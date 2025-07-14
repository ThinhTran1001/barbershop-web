import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import ToastNotify from "../contact/ToastNotifyContact";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    fullname: "",
    phone: "",
    email: "",
    message: "",
  });

  const [showToast, setShowToast] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch("http://localhost:3000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          time: new Date().toLocaleString("vi-VN"),
        }),
      });
  
      if (response.ok) {
        setShowToast(true);
        setFormData({
          fullname: "",
          phone: "",
          email: "",
          message: "",
        });
      } else {
        alert("Đã xảy ra lỗi khi gửi liên hệ.");
      }
    } catch (error) {
      console.error("Lỗi gửi liên hệ:", error);
      alert("Không thể kết nối đến máy chủ.");
    }
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
