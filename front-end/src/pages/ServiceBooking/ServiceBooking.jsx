// src/pages/ServiceBooking.jsx

import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import ServiceList from '../../components/ServiceList';
import ImageSlider from '../../components/ImageSlider';
import { getAllServices } from '../../services/api';
import './ServiceBooking.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import barber1 from '../../assets/images/barber1.png';
import barber2 from '../../assets/images/barber2.png';
import barber3 from '../../assets/images/barber3.png';
import barber4 from '../../assets/images/barber4.png';
import barber5 from '../../assets/images/barber5.png';
import ShopItems from '../../components/landing/products';

const images = [barber1, barber2, barber3, barber4, barber5];

const comboNames = [
  'uốn và ép',
  'uốn korea và ép',
  'uốn nhuộm korea',
  'uốn lô và nhuộm'
];

const ServiceBooking = () => {
  const [services, setServices] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [filteredServices, setFilteredServices] = useState([]);

  const tabs = [
    { id: 'all', label: 'TẤT CẢ' },
    { id: 'cut', label: 'CẮT TÓC' },
    { id: 'perm', label: 'UỐN TÓC' },
    { id: 'color', label: 'NHUỘM TÓC' },
    { id: 'combo', label: 'COMBO' },
  ];

  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await getAllServices();
        setServices(res.data);
        setFilteredServices(res.data);
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        message.error('Lỗi khi tải dịch vụ');
      }
    };

    loadServices();
  }, []);

  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredServices(services);
    } else {
      const filtered = services.filter(service => {
        const category = service.category?.toLowerCase() || '';
        const serviceName = service.name?.toLowerCase() || '';
        const isCombo = comboNames.includes(serviceName);

        switch (activeTab) {
          case 'cut':
            return !isCombo && (
              category.includes('cắt') || category.includes('cut') ||
              serviceName.includes('cắt') || serviceName.includes('cut')
            );
          case 'perm':
            return !isCombo && (
              category.includes('uốn') || category.includes('perm') ||
              serviceName.includes('uốn') || serviceName.includes('perm')
            );
          case 'color':
            return !isCombo && (
              category.includes('nhuộm') || category.includes('color') ||
              serviceName.includes('nhuộm') || serviceName.includes('màu')
            );
          case 'combo':
            return isCombo;
          default:
            return true;
        }
      });

      setFilteredServices(filtered);
    }
  }, [activeTab, services]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="service-booking-wrapper container mt-5">
      <div className="row">
        <div className="col-md-6">
          <ServiceList
          services={filteredServices}
            tabs={tabs}
            activeTab={activeTab}
            handleTabClick={handleTabClick}
          />
        </div>
        <div className="col-md-6">
        
          <ImageSlider images={images} />
        </div>
        <div>
          <ShopItems/>
        </div>
      </div>
    </div>
  );
};

export default ServiceBooking;