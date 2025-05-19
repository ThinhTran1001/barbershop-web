import React from "react";
import "../../css/landing/bussinesshour.css";

const weekdays = [
  { day: "THỨ 2", hours: "08:30 AM – 17:00 PM" },
  { day: "THỨ 3", hours: "08:30 AM – 17:30 PM" },
  { day: "THỨ 4", hours: "08:30 AM – 17:00 PM" },
  { day: "THỨ 5", hours: "08:30 AM – 17:30 PM" },
  { day: "THỨ 6", hours: "08:30 AM – 17:00 PM" },
  { day: "THỨ 7", hours: "08:30 AM – 19:00 PM" },
];

export default function BusinessHours() {
  return (
    <section className="business-hours-section">
      <div className="hours-overlay"></div>
      <div className="container">
        <div className="hours-header">
          <h2 className="hours-title">THỜI GIAN LÀM VIỆC</h2>
          <div className="title-separator"></div>
        </div>

        <div className="hours-grid">
          {weekdays.map((item, index) => (
            <div key={index} className="hours-card">
              <h3 className="day-title">{item.day}</h3>
              <p className="hours-time">{item.hours}</p>
            </div>
          ))}
        </div>

        <div className="sunday-hours">
          <h3 className="sunday-title">CHỦ NHẬT: NGHỈ</h3>
        </div>
      </div>
    </section>
  );
}