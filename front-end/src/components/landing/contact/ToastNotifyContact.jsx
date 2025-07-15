import React from "react";
import { Toast, ToastContainer } from "react-bootstrap";

const ToastNotifyContact = ({ show, onClose, title = "Thành công", message }) => {
  return (
    <ToastContainer position="top-end" className="p-3">
      <Toast show={show} onClose={onClose} bg="success" delay={3000} autohide>
        <Toast.Header>
          <strong className="me-auto">{title}</strong>
        </Toast.Header>
        <Toast.Body className="text-white">{message}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default ToastNotifyContact;
