import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import ToastNotify from "../contact/ToastNotifyContact";
import emailjs from "emailjs-com";

const SERVICE_ID = "service_b5z5ow3";
const TEMPLATE_ID = "template_vhsdj7n";
const PUBLIC_KEY = "_yNtuCDbHtnDUgmvw";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    fullname: "",
    phone: "",
    email: "",
    message: "",
  });
  const [showToast, setShowToast] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const templateParams = {
      fullname: formData.fullname,
      phone: formData.phone,
      email: formData.email,
      message: formData.message,
      time: new Date().toLocaleString("vi-VN"),
    };

    emailjs
      .send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
      .then((result) => {
        console.log("Email sent:", result.text);
        setShowToast(true);
        setFormData({
          fullname: "",
          phone: "",
          email: "",
          message: "",
        });
      })
      .catch((error) => {
        console.error("Email error:", error.text);
        alert("Đã xảy ra lỗi khi gửi email. Vui lòng thử lại sau.");
      });
  };

  return (
    <>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="fullname" className="mb-3">
          <Form.Label>Họ và tên</Form.Label>
          <Form.Control
            type="text"
            name="fullname"
            value={formData.fullname}
            onChange={handleChange}
            placeholder="Nhập họ và tên của bạn"
            required
          />
        </Form.Group>

        <Form.Group controlId="phone" className="mb-3">
          <Form.Label>Số điện thoại</Form.Label>
          <Form.Control
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Nhập số điện thoại của bạn"
            required
          />
        </Form.Group>

        <Form.Group controlId="email" className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Nhập địa chỉ email của bạn"
            required
          />
        </Form.Group>

        <Form.Group controlId="message" className="mb-3">
          <Form.Label>Nội dung liên hệ</Form.Label>
          <Form.Control
            as="textarea"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Nhập nội dung liên hệ"
            rows={4}
            required
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          Gửi thông tin
        </Button>
      </Form>

      <ToastNotify
        show={showToast}
        onClose={() => setShowToast(false)}
        message="Thông tin của bạn đã được gửi thành công. Vui lòng kiểm tra email."
      />
    </>
  );
};

export default ContactForm;
