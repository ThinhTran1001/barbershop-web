const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOtp = async (to, otp) => {
    await transporter.sendMail({
        from: `"Barber App" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Your OTP Code',
        text: `Your OTP is ${otp}. It expires in 3 minutes.`,
    });
};

const sendEmail = async (to, subject, html) => {
    await transporter.sendMail({
        from: `"Barber App" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });
};
const sendOrderCodeToGuestEmail = async (to, {
  orderCode,
  orderDate,
  items = [],
  totalAmount,
  customerName
}) => {
  const subject = 'Xác nhận đơn hàng từ Barber App';
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 8px; border: 1px solid #eee; text-align: center;">
        <img src="${item.productImage || ''}" alt="${item.productName}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px;" />
      </td>
      <td style="padding: 8px; border: 1px solid #eee;">${item.productName}</td>
      <td style="padding: 8px; border: 1px solid #eee; text-align: center;">${item.quantity}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #6C47FF;">Xác nhận đơn hàng từ Barber App</h2>
      <p>Xin chào${customerName ? ' ' + customerName : ''}, cảm ơn bạn đã đặt hàng tại <strong>Barber App</strong>.</p>
      <p><b>Mã đơn hàng:</b> <span style="color: #007bff;">${orderCode}</span></p>
      <p><b>Ngày đặt hàng:</b> ${orderDate ? new Date(orderDate).toLocaleString('vi-VN') : ''}</p>
      <h3>Đơn hàng của bạn gồm:</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="padding: 8px; border: 1px solid #eee;">Ảnh</th>
            <th style="padding: 8px; border: 1px solid #eee;">Tên sản phẩm</th>
            <th style="padding: 8px; border: 1px solid #eee;">Số lượng</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div><b>Tổng cộng:</b> <span style="color: #e74c3c;">${totalAmount?.toLocaleString('vi-VN')} đ</span></div>
      <p style="margin-top:8px;">Giữ lại mã đơn hàng để tra cứu hoặc hỗ trợ nếu cần.</p>
      <p style="margin-top:8px;">Trân trọng, Barber App Team</p>
    </div>
  `;

  await sendEmail(to, subject, html);
};


module.exports = { sendOtp, sendEmail, sendOrderCodeToGuestEmail };
