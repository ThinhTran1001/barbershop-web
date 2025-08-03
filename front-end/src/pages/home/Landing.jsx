import React from "react";
import HeroSection from "../../components/landing/HeroSection";
import AboutSection from "../../components/landing/AboutSection";
import VoucherSection from "../../components/landing/VoucherSection";
import Services from "../../components/landing/Services";
import BusinessHours from "../../components/landing/BussinessHour";
import Barbers from "../../components/landing/Barber";
import BookingForm from "../../components/landing/Booking";
import '../../css/landing/container.css'
import ChatWidget from "../../components/chatbot/ChatWidget";
import ShopItems from "../../components/landing/productlistd";
import ServiceBooking from "../ServiceBooking/ServiceBooking";
import HotDeals from "../../components/landing/HotDeals";
import ServiceFeedbackList from "../../components/landing/ServiceFeedbackList";

export default function Landing() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      {/* <VoucherSection /> */}
      
      <div id="services">
        <Services />
        {/* <ServiceBooking/> */}
      </div>
      <VoucherSection />
      <br></br>   
      <HotDeals />
      <br></br>
      {/* <ShopItems /> */}
      <br></br>
      <br></br>
      <BusinessHours />
      <br></br>
      <br></br>
      <Barbers />
      {/* <BookingForm /> */}
      {/* <ChatWidget /> */}
      <br></br>
      <ServiceFeedbackList />
    </>
  );
}
