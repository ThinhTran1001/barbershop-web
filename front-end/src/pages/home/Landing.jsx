
import React from "react";
import Header from "../../components/landing/Header";
import HeroSection from "../../components/landing/HeroSection";
import AboutSection from "../../components/landing/AboutSection";
import Services from "../../components/landing/Services";
import BusinessHours from "../../components/landing/BussinessHour";
import Barbers from "../../components/landing/Barber";
import BookingForm from "../../components/landing/Booking";
import Footer from "../../components/landing/footer";
import '../../css/landing/container.css'
import ShopItems from "../../components/landing/products";



export default function Landing() {
  return (
    <div>
      <Header />

      <div className="container__section">
        <HeroSection />
        <br></br>
        <AboutSection />

        <Services />
        <br></br>
        <ShopItems />
        <BusinessHours />


        <Barbers />
        <BookingForm />

      </div>
      <Footer />
    </div>
  );
}
