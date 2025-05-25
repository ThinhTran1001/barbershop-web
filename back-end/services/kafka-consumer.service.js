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
                if (handler) await handler(data);
                else console.warn(`[EmailConsumer] No handler for topic: ${topic}`);
            } catch (err) {
                console.error(`[EmailConsumer] Error processing topic ${topic}:`, err.message);
            }
        },
    });
};

module.exports = run;
