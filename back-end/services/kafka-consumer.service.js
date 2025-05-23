const kafka = require('../config/kafka');
const redis = require('../config/redis');
const { sendOtp } = require('./email.service');

const consumer = kafka.consumer({ groupId: 'otp-services' });

const run = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'user.registered', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ message }) => {
            const { email } = JSON.parse(message.value.toString());
            const otp = Math.floor(100000 + Math.random() * 900000);
            await redis.set(`otp:${email}`, otp, 'EX', 180);
            await sendOtp(email, otp);
        }
    });
};

module.exports = run;
