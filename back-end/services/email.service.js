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

module.exports = { sendOtp };
