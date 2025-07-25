import React from "react";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

const OrderFail = () => {
  const navigate = useNavigate();

  return (
    <div className="order-fail-container" style={{ padding: "50px", textAlign: "center" }}>
      <Result
        status="error"
        title="Thanh toán thất bại"
        subTitle="Rất tiếc, giao dịch của bạn không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ."
        extra={[
          <Button type="primary" key="retry" onClick={() => navigate("/checkout")}>
            Thử lại
          </Button>,
          <Button key="home" onClick={() => navigate("/")}>
            Về trang chủ
          </Button>,
        ]}
      />
    </div>
  );
};

export default OrderFail;