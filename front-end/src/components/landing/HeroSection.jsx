import React from "react";
import { Button } from "antd";
import heroBg from "../../assets/images/hero.jpg";
import "../../css/landing/herosection.css";


export default function HeroSection() {
  return (
    <div className="hero-section">

      <div className="hero-img-container">
        <img src={heroBg} alt="Berger Barbershop" className="hero-img" />
      </div>



      <div className="hero-overlay"></div>


      <div className="hero-content">
        <div className="logo-container">
          <span className="men-only">MEN</span>

          <span className="men-only">ONLY</span>
        </div>

        <h1 className="hero-title">BERGER</h1>

        <div className="barbershop-container">
          <span className="since">SINCE</span>
          <span className="barbershop">BARBERSHOP</span>
          <span className="year">MMXVI</span>
        </div>

        <Button className="appointment-button">
          ĐẶT LỊCH HẸN
        </Button>
      </div>
    </div>
  );
}