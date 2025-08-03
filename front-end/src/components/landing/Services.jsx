import React, { useState, useEffect, useCallback, useMemo } from "react";
import AOS from 'aos';
import 'aos/dist/aos.css';
import serviceImage from "../../assets/images/service.jpg";
import barber1 from "../../assets/images/barber1.jpg";
import barber2 from "../../assets/images/barber2.jpg";
import barber3 from "../../assets/images/barber3.jpg";
import barber4 from "../../assets/images/barber4.png";
import barber5 from "../../assets/images/barber5.png";
import "../../css/landing/service.css";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom"; 

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredServices, setFilteredServices] = useState([]);
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBooking = (e) => {
    if (!user) {
      navigate("/login");
    } else {
      navigate("/book-service");
    }
  };

  // Default service images for different categories
  const defaultImages = useMemo(() => ({
    cut: barber1,
    perm: barber2,
    color: barber3,
    combo: barber4,
    styling: barber5,
    treatment: serviceImage
  }), []);

  const categories = [
    { id: 'all', name: 'Tất cả', icon: '✨' },
    { id: 'cut', name: 'Cắt tóc', icon: '✂️' },
    { id: 'perm', name: 'Uốn tóc', icon: '🌀' },
    { id: 'color', name: 'Nhuộm tóc', icon: '🎨' },
    { id: 'combo', name: 'Combo', icon: '💎' },
    { id: 'styling', name: 'Tạo kiểu', icon: '💫' },
    { id: 'treatment', name: 'Chăm sóc', icon: '🌿' }
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}p` : `${hours}h`;
    }
    return `${mins}p`;
  };

  const getCategoryLabel = (category) => {
    const labels = {
      cut: "Cắt tóc",
      perm: "Uốn tóc",
      color: "Nhuộm tóc",
      combo: "Combo",
      styling: "Tạo kiểu",
      treatment: "Chăm sóc"
    };
    return labels[category] || category;
  };

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      setFilteredServices(services);
    } else {
      setFilteredServices(services.filter(service => service.category === categoryId));
    }
  };

  // Get all images for a service (including default images)
  const getServiceImages = useCallback((service) => {
    const serviceImages = service.images && service.images.length > 0 ? service.images : [];
    const defaultImage = defaultImages[service.category] || serviceImage;

    // If service has images, use them; otherwise use default image
    return serviceImages.length > 0 ? serviceImages : [defaultImage];
  }, [defaultImages]);

  // Get current image for a service
  const getCurrentImage = (service) => {
    const images = getServiceImages(service);
    const currentIndex = currentImageIndexes[service._id || service.id] || 0;
    return images[currentIndex];
  };

  // Navigate to next image
  const nextImage = (serviceId, e) => {
    e.stopPropagation();
    const service = filteredServices.find(s => (s._id || s.id) === serviceId);
    if (!service) return;

    const images = getServiceImages(service);
    if (images.length <= 1) return;

    const currentIndex = currentImageIndexes[serviceId] || 0;
    const nextIndex = (currentIndex + 1) % images.length;

    setCurrentImageIndexes(prev => ({
      ...prev,
      [serviceId]: nextIndex
    }));
  };

  // Navigate to previous image
  const prevImage = (serviceId, e) => {
    e.stopPropagation();
    const service = filteredServices.find(s => (s._id || s.id) === serviceId);
    if (!service) return;

    const images = getServiceImages(service);
    if (images.length <= 1) return;

    const currentIndex = currentImageIndexes[serviceId] || 0;
    const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;

    setCurrentImageIndexes(prev => ({
      ...prev,
      [serviceId]: prevIndex
    }));
  };

  useEffect(() => {
    // Initialize AOS
    AOS.init({
      duration: 1000,
      easing: 'ease-out-cubic',
      once: true,
      offset: 50
    });

    const fetchServices = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/services");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        const servicesData = Array.isArray(data.services) ? data.services : [];
        setServices(servicesData);
        setFilteredServices(servicesData);
        setLoading(false);
      } catch (error) {
        // Fallback to mock data if API fails
        console.warn("API failed, using mock data:", error);
        const mockServices = [
          {
            _id: '1',
            name: 'Cắt tóc nam cơ bản',
            description: 'Dịch vụ cắt tóc nam phong cách cơ bản, phù hợp với mọi độ tuổi',
            price: 150000,
            durationMinutes: 30,
            category: 'cut',
            hairTypes: ['straight', 'wavy'],
            styleCompatibility: ['short', 'medium'],
            images: [barber1, barber2, barber3]
          },
          {
            _id: '2',
            name: 'Cắt tóc nam hiện đại',
            description: 'Cắt tóc nam theo xu hướng hiện đại, tạo phong cách trẻ trung',
            price: 200000,
            durationMinutes: 45,
            category: 'cut',
            hairTypes: ['straight', 'wavy', 'curly'],
            styleCompatibility: ['short', 'medium'],
            images: [barber2, barber4, serviceImage]
          },
          {
            _id: '3',
            name: 'Uốn tóc nam',
            description: 'Dịch vụ uốn tóc nam tạo kiểu độc đáo, phong cách cá tính',
            price: 350000,
            durationMinutes: 90,
            category: 'perm',
            hairTypes: ['straight', 'wavy'],
            styleCompatibility: ['medium', 'long'],
            images: [barber3, barber5, barber1]
          },
          {
            _id: '4',
            name: 'Nhuộm tóc nam',
            description: 'Nhuộm tóc nam với màu sắc thời trang, an toàn cho da đầu',
            price: 400000,
            durationMinutes: 120,
            category: 'color',
            hairTypes: ['straight', 'wavy', 'curly'],
            styleCompatibility: ['short', 'medium', 'long'],
            images: [barber4, barber1, barber2, serviceImage]
          },
          {
            _id: '5',
            name: 'Combo cắt + gội + massage',
            description: 'Gói dịch vụ trọn gói bao gồm cắt tóc, gội đầu và massage thư giãn',
            price: 300000,
            durationMinutes: 60,
            category: 'combo',
            hairTypes: ['straight', 'wavy', 'curly'],
            styleCompatibility: ['short', 'medium'],
            images: [barber5, barber3, barber4]
          },
          {
            _id: '6',
            name: 'Tạo kiểu tóc sự kiện',
            description: 'Tạo kiểu tóc chuyên nghiệp cho các sự kiện quan trọng',
            price: 250000,
            durationMinutes: 45,
            category: 'styling',
            hairTypes: ['straight', 'wavy', 'curly'],
            styleCompatibility: ['short', 'medium', 'long'],
            images: [serviceImage, barber2]
          }
        ];
        setServices(mockServices);
        setFilteredServices(mockServices);
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Auto-rotate images every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      filteredServices.forEach(service => {
        const images = getServiceImages(service);
        if (images.length > 1) {
          const serviceId = service._id || service.id;
          const currentIndex = currentImageIndexes[serviceId] || 0;
          const nextIndex = (currentIndex + 1) % images.length;

          setCurrentImageIndexes(prev => ({
            ...prev,
            [serviceId]: nextIndex
          }));
        }
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [filteredServices, currentImageIndexes, getServiceImages]);

  if (loading) {
    return (
      <section className="modern-services-section">
        <div className="services-container">
          {/* Hero Section */}
          <div className="services-hero" data-aos="fade-down">
            <div className="hero-content">
              <span className="hero-badge">Dịch vụ chuyên nghiệp</span>
              <h1 className="hero-title">
                Khám phá <span className="gradient-text">Dịch vụ</span> của chúng tôi
              </h1>
              <p className="hero-subtitle">
                Trải nghiệm những dịch vụ cắt tóc và chăm sóc tóc đẳng cấp với đội ngũ thợ cắt tóc chuyên nghiệp
              </p>
            </div>
          </div>

          {/* Loading State */}
          <div className="loading-section">
            <div className="modern-loader">
              <div className="loader-ring"></div>
              <div className="loader-ring"></div>
              <div className="loader-ring"></div>
            </div>
            <p className="loading-text">Đang tải dịch vụ...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="modern-services-section">
        <div className="services-container">
          {/* Hero Section */}
          <div className="services-hero" data-aos="fade-down">
            <div className="hero-content">
              <span className="hero-badge">Dịch vụ chuyên nghiệp</span>
              <h1 className="hero-title">
                Khám phá <span className="gradient-text">Dịch vụ</span> của chúng tôi
              </h1>
              <p className="hero-subtitle">
                Trải nghiệm những dịch vụ cắt tóc và chăm sóc tóc đẳng cấp với đội ngũ thợ cắt tóc chuyên nghiệp
              </p>
            </div>
          </div>

          {/* Error State */}
          <div className="error-section">
            <div className="error-icon">⚠️</div>
            <h3 className="error-title">Có lỗi xảy ra</h3>
            <p className="error-message">{error}</p>
            <button
              className="retry-btn"
              onClick={() => window.location.reload()}
            >
              <span>Thử lại</span>
              <i className="retry-icon">🔄</i>
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="modern-services-section">
      <div className="services-container">
        {/* Hero Section */}
        <div className="services-hero" data-aos="fade-down">
          <div className="hero-content">
            <span className="hero-badge">Dịch vụ chuyên nghiệp</span>
            <h1 className="hero-title">
              Khám phá <span className="gradient-text">Dịch vụ</span> của chúng tôi
            </h1>
            {/* <p className="hero-subtitle">
              Trải nghiệm những dịch vụ cắt tóc và chăm sóc tóc đẳng cấp với đội ngũ thợ cắt tóc chuyên nghiệp
            </p> */}
          </div>
          <div className="hero-stats" data-aos="fade-up" data-aos-delay="200">
            <div className="stat-item">
              <span className="stat-number">{filteredServices.length}+</span>
              <span className="stat-label">Dịch vụ</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">1000+</span>
              <span className="stat-label">Khách hàng</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">5⭐</span>
              <span className="stat-label">Đánh giá</span>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="category-filter" data-aos="fade-up" data-aos-delay="300">
          <h3 className="filter-title">Danh mục dịch vụ</h3>
          <div className="category-tabs">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => handleCategoryFilter(category.id)}
              >
                <span className="tab-icon">{category.icon}</span>
                <span className="tab-name">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="services-grid-container" data-aos="fade-up" data-aos-delay="400">
          {filteredServices.length === 0 ? (
            <div className="no-services">
              <div className="no-services-icon">🔍</div>
              <h3>Không tìm thấy dịch vụ</h3>
              <p>Hiện tại không có dịch vụ nào trong danh mục này.</p>
            </div>
          ) : (
            <div className="services-grid">
              {filteredServices.map((service, index) => (
                <div
                  key={service._id || service.id}
                  className="modern-service-card"
                  data-aos="zoom-in"
                  data-aos-delay={index * 100}
                >
                  <div className="card-header">
                    <div className="service-image-container">
                      <img
                        src={getCurrentImage(service)}
                        alt={service.name}
                        className="service-image"
                        onError={(e) => {
                          e.target.src = serviceImage;
                        }}
                      />
                      <div className="image-overlay">
                        <div className="category-badge">
                          {getCategoryLabel(service.category)}
                        </div>
                      </div>

                      {/* Image Navigation Controls */}
                      {getServiceImages(service).length > 1 && (
                        <>
                          <button
                            className="image-nav-btn prev-btn"
                            onClick={(e) => prevImage(service._id || service.id, e)}
                            aria-label="Previous image"
                          >
                            ‹
                          </button>
                          <button
                            className="image-nav-btn next-btn"
                            onClick={(e) => nextImage(service._id || service.id, e)}
                            aria-label="Next image"
                          >
                            ›
                          </button>

                          {/* Image Indicators */}
                          <div className="image-indicators">
                            {getServiceImages(service).map((_, imgIndex) => (
                              <button
                                key={imgIndex}
                                className={`indicator ${
                                  (currentImageIndexes[service._id || service.id] || 0) === imgIndex
                                    ? 'active'
                                    : ''
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentImageIndexes(prev => ({
                                    ...prev,
                                    [service._id || service.id]: imgIndex
                                  }));
                                }}
                                aria-label={`Go to image ${imgIndex + 1}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="card-body">
                    <h3 className="service-title">{service.name}</h3>
                    {service.description && (
                      <p className="service-description">{service.description}</p>
                    )}

                    <div className="service-features">
                      {service.durationMinutes && (
                        <div className="feature-item">
                          <span className="feature-icon">⏱️</span>
                          <span className="feature-text">{formatDuration(service.durationMinutes)}</span>
                        </div>
                      )}

                      {service.hairTypes && service.hairTypes.length > 0 && (
                        <div className="feature-item">
                          <span className="feature-icon">✂️</span>
                          <span className="feature-text">{service.hairTypes.slice(0, 2).join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="price-section">
                      <span className="price-label">Giá từ</span>
                      <span className="service-price">{formatPrice(service.price)}</span>
                    </div>
                    <button className="book-btn">
                      <span>Đặt lịch ngay</span>
                      <span className="btn-arrow">→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="services-cta" data-aos="fade-up" data-aos-delay="600">
          <div className="cta-content">
            <h2 className="cta-title">Sẵn sàng để thay đổi phong cách?</h2>
            <p className="cta-subtitle">Đặt lịch hẹn ngay hôm nay và trải nghiệm dịch vụ đẳng cấp</p>
            <button onClick={handleBooking} className="cta-btn">
              <span>Đặt lịch ngay</span>
              <span className="btn-shine"></span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}