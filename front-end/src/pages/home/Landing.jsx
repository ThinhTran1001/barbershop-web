import React from "react";
import HeroSection from "../../components/landing/HeroSection";
import AboutSection from "../../components/landing/AboutSection";
import Services from "../../components/landing/Services";
import BusinessHours from "../../components/landing/BussinessHour";
import Barbers from "../../components/landing/Barber";
import BookingForm from "../../components/landing/Booking";
import '../../css/landing/container.css'
import ChatWidget from "../../components/chatbot/ChatWidget";
import ShopItems from "../../components/landing/productlistd";

export default function Landing() {
  return (
    <>
      
      <HeroSection />
        <AboutSection />

        <Services />
        <br></br>   
        <br></br>
        <ShopItems />
        <br></br>
        <br></br>
        <BusinessHours />

        <br></br>
        <br></br>
        <Barbers />
        <BookingForm />
        <ChatWidget />

    </>
  );
}
