// src/components/ImageSlider.jsx
import React, { useEffect, useState } from 'react';
import { Image } from 'antd';
import '../pages/ServiceBooking/ServiceBooking.css'; // Import CSS

const ImageSlider = ({ images, interval = 5000 }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className="image-gallery">
      <Image
        src={images[currentImageIndex]}
        alt={`Barber service ${currentImageIndex + 1}`}
        preview={false}
        className="gallery-image"
      />
    </div>
  );
};

export default ImageSlider;
