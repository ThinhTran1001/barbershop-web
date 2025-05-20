import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import ServiceList from '../../components/ServiceList';
import ImageSlider from '../../components/ImageSlider';
import { getAllServices } from '../../services/api';
import './ServiceBooking.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// ✅ Import ảnh từ src/assets/images
import barber1 from '../../assets/images/barber1.png';
import barber2 from '../../assets/images/barber2.png';
import barber3 from '../../assets/images/barber3.png';
import barber4 from '../../assets/images/barber4.png';
import barber5 from '../../assets/images/barber5.png';

const images = [barber1, barber2, barber3, barber4, barber5];

const ServiceBooking = () => {
  const [services, setServices] = useState([]);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await getAllServices();
        setServices(res.data);
        // eslint-disable-next-line no-unused-vars
      } catch (err) {
        message.error('Lỗi khi tải dịch vụ');
      }
    };

    loadServices();
  }, []);

  return (
    <div className="service-booking-wrapper container mt-5">
      <div className="row">
        <div className="col-md-6">
          <ServiceList services={services} />
        </div>
        <div className="col-md-6">
          <ImageSlider images={images} />
        </div>
      </div>
    </div>
  );
};

export default ServiceBooking;
