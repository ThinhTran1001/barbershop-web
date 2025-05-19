import React from "react";
import "../../css/landing/barber.css";


import barber1 from "../../assets/images/barber1.jpg";
import barber2 from "../../assets/images/barber2.jpg";
import barber3 from "../../assets/images/barber3.jpg";

const barbers = [
  {
    id: 1,
    name: "BABER JOHN",
    image: barber1,
    specialty: "Master Barber",
  },
  {
    id: 2,
    name: "BABER DAVID",
    image: barber2,
    specialty: "Style Expert",
  },
  {
    id: 3,
    name: "BABER PETER",
    image: barber3,
    specialty: "Beard Specialist",
  },
];

export default function Barbers() {
  return (
    <section className="barbers-section">
      <div className="container">
        <div className="barbers-header">
          <h2 className="barbers-title">BARBERS</h2>
          <div className="title-divider"></div>
        </div>

        <div className="barbers-grid">
          {barbers.map((barber) => (
            <div key={barber.id} className="barber-card">
              <div className="barber-image-container">
                <img src={barber.image} alt={barber.name} className="barber-image" />
              </div>
              <h3 className="barber-name">{barber.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}