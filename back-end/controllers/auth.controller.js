const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const kafka = require('../config/kafka');
const redis = require('../config/redis');

const producer = kafka.producer();
producer.connect(); // khởi tạo Kafka producer

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ message: 'Email already exists' });

        const passwordHash = await bcrypt.hash(password, 10);
        const user = new User({ name, email, passwordHash });
        await user.save();

        await producer.send({
            topic: 'user.registered',
            messages: [{ value: JSON.stringify({ email }) }],
        });

        res.status(201).json({ message: 'User created. Check email for OTP.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const cachedOtp = await redis.get(`otp:${email}`);

        if (!cachedOtp) return res.status(410).json({ message: 'OTP expired' });
        if (cachedOtp !== otp) return res.status(400).json({ message: 'Incorrect OTP' });

        await User.updateOne({ email }, { $set: { isVerified: true } });
        await redis.del(`otp:${email}`);
        res.json({ message: 'Email verified successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        await producer.send({
            topic: 'user.registered',
            messages: [{ value: JSON.stringify({ email }) }],
        });
        res.json({ message: 'OTP resent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
