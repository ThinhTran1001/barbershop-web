import React, { useEffect, useState } from 'react';
import { fetchServiceSuggestions } from '../services/serviceApi';

const ServiceSuggestions = ({ hairType, userId, onSelect }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchServiceSuggestions({ hairType, userId })
      .then(setSuggestions)
      .finally(() => setLoading(false));
  }, [hairType, userId]);

  return (
    <div>
      <h2>Suggested Services</h2>
      {loading ? <p>Loading...</p> : (
        <ul>
          {suggestions.map(service => (
            <li key={service._id}>
              <strong>{service.name}</strong> - ${service.price}
              <button onClick={() => onSelect && onSelect(service)}>Choose</button>
            </li>
          ))}
        </ul>
      )}
      {(!loading && suggestions.length === 0) && <p>No suggestions found.</p>}
    </div>
  );
};

export default ServiceSuggestions;

