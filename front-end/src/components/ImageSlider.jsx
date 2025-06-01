// src/components/ImageSlider.jsx

import React, { useEffect, useState } from 'react';
import { Image } from 'antd';
import '../pages/ServiceBooking/ServiceBooking.css';

const ImageSlider = ({ images = [], interval = 5000 }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!images.length) return;

    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images, interval]);

  if (!images || images.length === 0) {
    return <div className="image-gallery">Không có hình ảnh để hiển thị.</div>;
  }

  return (
    <div className="image-gallery text-center">
      <Image
        src={images[currentImageIndex]}
        alt={`Slide ${currentImageIndex + 1}`}
        preview={false}
        className="gallery-image"
      />
    </div>
  );
};

export default ImageSlider;