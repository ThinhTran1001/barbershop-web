import React, { useState } from 'react';
import BookingInfoForm from '../../components/BookingInfoForm.jsx';
import { Card, Typography, Descriptions, Divider, Button } from 'antd';
import { createBooking } from '../../services/serviceApi.js';
import { toast } from 'react-toastify';
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
            toast.error(
              `❌ You already have a booking with ${validation.conflictingBooking?.barberName || 'another barber'} at ${validation.conflictingBooking?.date || 'this time'}`,
              {
                position: "top-right",
                autoClose: 6000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              }
            );
          } else if (validation.conflictType === 'BARBER_CONFLICT') {
            toast.error(
              `⚠️ This time slot is no longer available. The barber is already booked at ${validation.conflictingBooking?.date || 'this time'}`,
              {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              }
            );
          } else {
            toast.error(
              validation.reason || '❌ Time slot is no longer available',
              {
                position: "top-right",
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              }
            );
          }
          setSubmitting(false);
          return;
        }
      } catch (validationError) {
        console.error('Pre-submission validation failed:', validationError);
        toast.warn(
          '⚠️ Unable to validate time slot. Proceeding with booking...',
          {
            position: "top-right",
            autoClose: 6000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
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
      const loadingToastId = toast.loading('🔄 Creating your booking...', {
        position: "top-right",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
      });

      await createBooking(bookingData);

      // Update loading toast to success
      toast.update(loadingToastId, {
        render: `🎉 Booking confirmed successfully!\n📅 ${service.name} with ${barber?.userId?.name || 'Auto-assigned barber'}\n🕐 ${timeSlot.date} at ${timeSlot.time} (${service.durationMinutes || 30} minutes)`,
        type: "success",
        isLoading: false,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      localStorage.removeItem('selectedService');
      localStorage.removeItem('selectedBarber');
      localStorage.removeItem('selectedTimeSlot');
      setTimeout(() => window.location.href = '/my-booking', 2000);
    } catch (e) {
      console.error('Booking creation error:', e);

      // Handle specific error types with enhanced messaging
      if (e.response?.status === 409) {
        const errorCode = e.response?.data?.errorCode;
        const errorMessage = e.response?.data?.message;
        const conflictDetails = e.response?.data?.conflictDetails;

        if (errorCode === 'CUSTOMER_DOUBLE_BOOKING') {
          toast.error(
            `❌ Double Booking Detected!\nYou already have a booking with ${conflictDetails?.conflictingBarber || 'another barber'} at ${conflictDetails?.conflictingTime || 'this time'}`,
            {
              position: "top-right",
              autoClose: 7000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            }
          );
        } else if (errorCode === 'BOOKING_CONFLICT') {
          toast.error(
            `⚠️ Booking Conflict!\n${errorMessage}\nConflict time: ${conflictDetails?.conflictingTime || 'Unknown'}`,
            {
              position: "top-right",
              autoClose: 6000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            }
          );
        } else {
          toast.error(
            '❌ Time slot is no longer available. Another customer just booked this time.',
            {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            }
          );
        }
      } else if (e.response?.data?.errorCode === 'DAILY_LIMIT_EXCEEDED') {
        toast.error(
          `📅 Daily Booking Limit Exceeded!\n${barber?.userId?.name || 'This barber'} has reached the maximum bookings for today. Please choose a different date or barber.`,
          {
            position: "top-right",
            autoClose: 6000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      } else if (e.response?.data?.errorCode === 'SCHEDULE_UPDATE_FAILED') {
        toast.error(
          '⚠️ Schedule Update Failed!\nYour booking was created but there was an issue updating the schedule. Please contact support.',
          {
            position: "top-right",
            autoClose: 7000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      } else if (!e.response) {
        // Network error
        toast.error(
          '🌐 Network Error!\nUnable to connect to the server. Please check your internet connection and try again.',
          {
            position: "top-right",
            autoClose: 6000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      } else {
        // Generic error
        toast.error(
          e.response?.data?.message || '❌ Booking creation failed. Please try again.',
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
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
