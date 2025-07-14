import React from "react";
import {
  FacebookOutlined,
  InstagramOutlined,
  YoutubeOutlined,
} from "@ant-design/icons";

const ContactInfo = () => {
  return (
    <div>
      <h5>Chúng tôi trân trọng ý kiến của quý khách</h5>
      <p>Nếu bạn có gì thắc mắc hãy liên hệ với chúng tôi qua địa chỉ</p>
      <p><strong>Điện thoại:</strong> 1900.27.27.03</p>
      <p><strong>Địa chỉ:</strong> 82 Trần Đại Nghĩa, phường Đồng Tâm, quận Hai Bà Trưng, Hà Nội</p>
      <p><strong>Email:</strong> BERGER@BERGER.com</p>
      <p><strong>Thời gian:</strong> Tất cả các ngày trong tuần</p>
      <div className="d-flex gap-3 mt-2">
        <FacebookOutlined style={{ fontSize: '24px' }} />
        <InstagramOutlined style={{ fontSize: '24px' }} />
        <YoutubeOutlined style={{ fontSize: '24px' }} />
      </div>
    </div>
  );
};

export default ContactInfo;
