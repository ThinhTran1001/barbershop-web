import React from 'react';

const MapEmbed = () => {
  return (
    <div style={{ width: '100%', height: '400px' }}>
      <iframe
        title="Google Map"
        src="https://www.google.com/maps?q=82%20Tr%E1%BA%A7n%20%C4%90%E1%BA%A1i%20Ngh%C4%A9a%2C%20H%C3%A0%20N%E1%BB%99i&output=embed"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
      />
    </div>
  );
};

export default MapEmbed;
