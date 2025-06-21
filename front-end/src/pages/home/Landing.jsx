import React from "react";
import HeroSection from "../../components/landing/HeroSection";
import AboutSection from "../../components/landing/AboutSection";
import Services from "../../components/landing/Services";
import BusinessHours from "../../components/landing/BussinessHour";
import Barbers from "../../components/landing/Barber";
import BookingForm from "../../components/landing/Booking";
import '../../css/landing/container.css'
import ShopItems from "../../components/landing/products";
import ChatWidget from "../../components/chatbot/ChatWidget";

export default function Landing() {
  return (
    <>
      
      <HeroSection />
        <AboutSection />

        <Services />
        <br></br>
        <ShopItems />
        <BusinessHours />

        <Barbers />
        <BookingForm />
        <ChatWidget />

    </>
  );
}
