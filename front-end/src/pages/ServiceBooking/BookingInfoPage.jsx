import React, { useState } from 'react';
import BookingInfoForm from '../../components/BookingInfoForm.jsx';
import { Card, Typography, Descriptions, Divider, Button } from 'antd';
import { createBooking } from '../../services/serviceApi.js';
import ToastService from '../../services/toastService.jsx';
import Cookies from 'js-cookie';

const { Title } = Typography;

const BookingInfoPage = () => {
  // Lấy thông tin đã chọn từ localStorage
  const service = JSON.parse(localStorage.getItem('selectedService') || '{}');
  const barber = JSON.parse(localStorage.getItem('selectedBarber') || '{}');
  const timeSlot = JSON.parse(localStorage.getItem('selectedTimeSlot') || '{}');
  const [submitting, setSubmitting] = useState(false);
  const token = Cookies.get('accessToken');

  console.log('Selected timeSlot:', timeSlot); // Debug log
  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      // Lấy customerId từ token trong cookie (giả sử JWT lưu ở cookie 'token')
      let customerId;
      const token = Cookies.get('accessToken');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          customerId = payload.id || payload._id || payload.userId;
        } catch (e) {
          customerId = undefined;
        }
      }
      // Tạo bookingDate từ ngày giờ đã chọn
      let bookingDate;
      if (timeSlot.date && timeSlot.time) {
        // Tạo datetime từ date và time đã chọn
        const [year, month, day] = timeSlot.date.split('-');
        const [hour, minute] = timeSlot.time.split(':');
        bookingDate = new Date(year, month - 1, day, hour, minute);
      } else if (timeSlot.dateTime) {
        // Nếu có dateTime string
        bookingDate = new Date(timeSlot.dateTime);
      } else {
        // Fallback về hiện tại
        bookingDate = new Date();
      }

      // Pre-submission validation to prevent double-booking
      const { validateTimeSlotAvailability } = await import('../../services/barberScheduleApi.js');

      try {
        const validation = await validateTimeSlotAvailability({
          barberId: barber?._id,
          bookingDate: bookingDate.toISOString(),
          durationMinutes: service.durationMinutes || 30,
          customerId
        });

        if (!validation.available) {
          // Show enhanced error notifications based on conflict type
          if (validation.conflictType === 'CUSTOMER_CONFLICT') {
            ToastService.showCustomerDoubleBookingError({
              reason: validation.reason,
              conflictingBarber: validation.conflictingBooking?.barberName,
              conflictTime: validation.conflictingBooking?.date,
              conflictDuration: validation.conflictingBooking?.duration
            });
          } else if (validation.conflictType === 'BARBER_CONFLICT') {
            ToastService.showBarberConflictError({
              reason: validation.reason,
              conflictTime: validation.conflictingBooking?.date,
              conflictDuration: validation.conflictingBooking?.duration
            });
          } else {
            ToastService.showValidationError({
              reason: validation.reason || 'Time slot is no longer available'
            });
          }
          setSubmitting(false);
          return;
        }
      } catch (validationError) {
        console.error('Pre-submission validation failed:', validationError);
        ToastService.showWarning(
          'Validation Warning',
          'Unable to validate time slot. Proceeding with booking...',
          6
        );
      }

      // Chuẩn bị dữ liệu booking gửi lên backend
      const bookingData = {
        customerId,
        serviceId: service._id,
        barberId: barber?._id,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        note: formData.note,
        notificationMethods: formData.notificationMethods,
        bookingDate: bookingDate.toISOString(),
        timeSlot: timeSlot.time, // Thêm timeSlot riêng
        date: timeSlot.date, // Thêm date riêng (format YYYY-MM-DD)
        durationMinutes: service.durationMinutes || 30,
        // autoAssignedBarber: !barber?._id
      };

      // Show loading toast
      ToastService.showLoadingToast('Creating your booking...', 'booking-creation');

      await createBooking(bookingData);

      // Hide loading toast
      ToastService.hideLoadingToast('booking-creation');

      // Show success toast with booking details
      ToastService.showBookingSuccess({
        serviceName: service.name,
        barberName: barber?.userId?.name || 'Auto-assigned',
        date: timeSlot.date,
        time: timeSlot.time,
        duration: service.durationMinutes || 30
      });

      localStorage.removeItem('selectedService');
      localStorage.removeItem('selectedBarber');
      localStorage.removeItem('selectedTimeSlot');
      setTimeout(() => window.location.href = '/', 2000);
    } catch (e) {
      console.error('Booking creation error:', e);

      // Hide loading toast on error
      ToastService.hideLoadingToast('booking-creation');

      // Handle specific error types with enhanced messaging
      if (e.response?.status === 409) {
        const errorCode = e.response?.data?.errorCode;
        const errorMessage = e.response?.data?.message;
        const conflictDetails = e.response?.data?.conflictDetails;

        if (errorCode === 'CUSTOMER_DOUBLE_BOOKING') {
          ToastService.showCustomerDoubleBookingError({
            reason: errorMessage,
            conflictingBarber: conflictDetails?.conflictingBarber,
            conflictTime: conflictDetails?.conflictingTime,
            conflictDuration: conflictDetails?.conflictingDuration
          });
        } else if (errorCode === 'BOOKING_CONFLICT') {
          ToastService.showBarberConflictError({
            reason: errorMessage,
            conflictTime: conflictDetails?.conflictingTime,
            conflictDuration: conflictDetails?.conflictingDuration
          });
        } else {
          ToastService.showBarberConflictError({
            reason: 'Time slot is no longer available. Another customer just booked this time.'
          });
        }
      } else if (e.response?.data?.errorCode === 'DAILY_LIMIT_EXCEEDED') {
        ToastService.showDailyLimitError(barber?.userId?.name);
      } else if (e.response?.data?.errorCode === 'SCHEDULE_UPDATE_FAILED') {
        ToastService.showScheduleUpdateError();
      } else if (!e.response) {
        // Network error
        ToastService.showNetworkError('booking creation');
      } else {
        // Generic error
        ToastService.showValidationError({
          reason: e.response?.data?.message || 'Booking creation failed. Please try again.'
        });
      }
    }
    setSubmitting(false);
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      

      <Card>
        <Title level={2}>Xác nhận & Nhập thông tin đặt lịch</Title>
        <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="Dịch vụ">{service.name} ({service.price?.toLocaleString()} đ)</Descriptions.Item>
          <Descriptions.Item label="Thợ cắt">{barber.userId?.name || 'Tự động chọn'}</Descriptions.Item>
          <Descriptions.Item label="Ngày đặt lịch">
            {timeSlot?.date ? new Date(timeSlot.date).toLocaleDateString('vi-VN') : 'Chưa chọn'}
          </Descriptions.Item>
          <Descriptions.Item label="Khung giờ">
            {timeSlot?.time || 'Chưa chọn'}
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian dự kiến">
            {service.durationMinutes ? `${service.durationMinutes} phút` : 'Chưa xác định'}
          </Descriptions.Item>
        </Descriptions>
        <Divider />
        <BookingInfoForm onSubmit={handleSubmit} />
        <Button type="primary" loading={submitting} htmlType="submit" form="booking-info-form" style={{ marginTop: 24 }} block>
          Xác nhận đặt lịch
        </Button>
      </Card>
    </div>
  );
};

export default BookingInfoPage;
