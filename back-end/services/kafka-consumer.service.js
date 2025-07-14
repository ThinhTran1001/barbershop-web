const kafka = require('../config/kafka');
const redis = require('../config/redis');
const { sendOtp, sendEmail } = require('./email.service');

const consumer = kafka.consumer({ groupId: 'email-service-group' });

const handlers = {
  'user.registered': async ({ email }) => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    await redis.set(`otp:${email}`, otp, 'EX', 180); 
    await sendOtp(email, otp);
    console.log(`[EmailConsumer] Sent OTP to ${email}`);
  },

  'email.reset-password': async ({ to, subject, html }) => {
    await sendEmail(to, subject, html);
    console.log(`[EmailConsumer] Sent reset email to ${to}`);
  },

 'contact.form.submitted': async ({ fullname, phone, email, message, time }) => {
  const html = `
    <h3>Chào ${fullname},</h3>
    <p>Cảm ơn bạn đã liên hệ với chúng tôi. Đây là nội dung bạn đã gửi:</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Số điện thoại:</strong> ${phone}</p>
    <p><strong>Thời gian gửi:</strong> ${time}</p>
    <p><strong>Nội dung:</strong><br/>${message}</p>
    <br/>
    <p>Chúng tôi sẽ liên hệ lại sớm nhất có thể.</p>
  `;

  await sendEmail(
    email, 
    'Xác nhận liên hệ thành công',
    html
  );

  await sendEmail(
    process.env.CONTACT_RECEIVER_EMAIL,
    'Liên hệ mới từ người dùng',
    `<p>Người dùng ${fullname} đã liên hệ, email: ${email}, message: ${message}</p>`
  );

  console.log(`[Kafka] Đã gửi mail xác nhận đến ${email}`);
}
};

const run = async () => {
  await consumer.connect();
  const topics = Object.keys(handlers);

  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
  }

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const data = JSON.parse(message.value.toString());
        const handler = handlers[topic];
        if (handler) {
          await handler(data);
        } else {
          console.warn(`[EmailConsumer] No handler for topic: ${topic}`);
        }
      } catch (err) {
        console.error(`[EmailConsumer] Error processing topic ${topic}:`, err.message);
      }
    }
  });
};

module.exports = run;
