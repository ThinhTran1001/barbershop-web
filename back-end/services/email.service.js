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
const sendOrderCodeToGuestEmail = async (to, orderCode) => {
    const subject = 'Mã đơn hàng của bạn từ Barber App';
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h3>Xin chào,</h3>
            <p>Cảm ơn bạn đã đặt hàng tại <strong>Barber App</strong>.</p>
            <p>Mã đơn hàng của bạn là: <strong style="color: #007bff;">${orderCode}</strong></p>
            <p>Hãy giữ lại mã này để tra cứu hoặc hỗ trợ nếu cần.</p>
            <br />
            <p>Trân trọng,<br/>Barber App Team</p>
        </div>
    `;

    await sendEmail(to, subject, html);
};


module.exports = { sendOtp, sendEmail, sendOrderCodeToGuestEmail };
