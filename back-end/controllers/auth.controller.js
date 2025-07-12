const bcrypt = require('bcrypt');
const kafka = require('../config/kafka');
const redis = require('../config/redis');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/user.model');
const PasswordReset = require('../models/password-reset.model');
const authService = require('../services/auth.service');

const producer = kafka.producer();
producer.connect();

exports.register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ message: 'Email already exists' });

        const passwordHash = await bcrypt.hash(password, 10);
        const user = new User({ name, email, phone, passwordHash });
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

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email invalid' });
        }

        if (!user.isVerified) {
            return res.status(400).json({ message: 'Account is not verified' });
        }

        if (user.oauthProvider) {
            return res.status(400).json({
                message: `Tài khoản này sử dụng ${user.oauthProvider}. Vui lòng đăng nhập bằng ${user.oauthProvider}.`
            });
        }

        if (!user.passwordHash) {
            return res.status(400).json({
                message: 'Tài khoản không có mật khẩu. Vui lòng sử dụng quên mật khẩu để đặt mật khẩu mới.'
            });
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) return res.status(401).json({ message: 'Password Incorrect' });

        const payload = { id: user._id, email: user.email, role: user.role, name: user.name, phone: user.phone };
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '1d' });

        await redis.set(`refreshToken:${user._id}`, refreshToken, "EX", 7 * 24 * 60 * 60);

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            sameSite: "Strict",
            maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: "Strict",
            maxAge: 24 * 60 * 60 * 1000,
        });

        return res.json({ message: "Login successfully!", token: accessToken });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Error Server" });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) return res.sendStatus(401);

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

        const stored = await redis.get(`refreshToken:${decoded.id}`);
        if (stored !== token) return res.sendStatus(403);

        const newAccessToken = jwt.sign(
          { id: decoded.id, email: decoded.email, role: decoded.role },
          process.env.JWT_SECRET,
          { expiresIn: '15m' }
        );

        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            sameSite: "Strict",
            maxAge: 15 * 60 * 1000,
        });

        return res.json({ message: "Access token refreshed" });
    } catch {
        return res.sendStatus(403);
    }
};

exports.logout = async (req, res) => {
    const token = req.cookies.refreshToken;
    if (token) {
        try {
            const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
            await redis.del(`refreshToken:${payload.id}`);
        } catch (e) {
        }
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Log out successfully!" });
};

exports.getCurrentUser = (req, res) => {
    if (!req.userId) return res.sendStatus(401);
    res.json({
        user: {
            id: req.userId,
            name: req.user.name,
            phone: req.user.phone,
            email: req.user.email,
            role: req.role,
        }
    });
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Email not found' });

        await PasswordReset.deleteMany({ userId: user._id });

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 60 * 1000); // 15 phút

        await PasswordReset.create({
            userId: user._id,
            token,
            isUsed: false,
            expiresAt,
            createdAt: new Date(),
        });

        const resetLink = `http://localhost:5173/reset-password?token=${token}&id=${user._id}`;

        await producer.send({
            topic: 'email.reset-password',
            messages: [
                {
                    value: JSON.stringify({
                        to: email,
                        subject: 'Reset your password',
                        html: `
              <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
              <p>This link will expire in 7 minutes.</p>
            `,
                    }),
                },
            ],
        });

        res.json({ message: 'Reset link sent to email' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { userId, token, newPassword } = req.body;

        const record = await PasswordReset.findOne({ userId, token });
        if (!record || record.isUsed || record.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await User.updateOne({ _id: userId }, { $set: { passwordHash: hashed } });

        record.isUsed = true;
        await record.save();

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.googleOauthHandler = async (req, res) => {
    try {
        const code = req.query.code;
        if (!code) {
            return res.redirect(
                `${process.env.CORS_ORIGIN}/login?error=${encodeURIComponent('No code provided')}`
            );
        }

        const { id_token, access_token } = await authService.getGoogleTokens({ code });
        const googleUser = await authService.getGoogleUser({ id_token, access_token });

        console.log('Google User Data:', googleUser); 

        const { id, email, name, picture, verified_email } = googleUser;

        if (!email || !name) {
            return res.redirect(
                `${process.env.CORS_ORIGIN}/login?error=${encodeURIComponent('Invalid Google user data: email or name is missing')}`
            );
        }

        let user = await User.findOne({ email });

        if (user) {
            if (user.status !== 'active') {
                return res.status(403).json({
                    success: false,
                    message: 'Tài khoản của bạn đã bị khóa',
                });
            }

            if (!user.oauthId) {
                user.oauthId = id;
                user.oauthProvider = 'GOOGLE';
                await user.save();
            }
        } else {
            user = new User({
            name: name,
            email: email,
            oauthId: id,
            role: 'customer',
            oauthProvider: 'GOOGLE',
            avatarUrl: picture || '',      
            phone: '' ,                    
            isVerified: true,
            status: 'active',
            });
            try {
                await user.save();
                console.log('New user created:', user._id); 
            } catch (validationError) {
                console.error('Validation Error:', validationError); 
                return res.redirect(
                    `${process.env.CORS_ORIGIN}/login?error=${encodeURIComponent('Document failed validation: ' + validationError.message)}`
                );
            }
        }

        const payload = { id: user._id, email: user.email, role: user.role, name: user.name, phone: user.phone };
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '1d' });

        await redis.set(`refreshToken:${user._id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            sameSite: 'Strict',
            maxAge: 15 * 60 * 1000,
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            sameSite: 'Strict',
            maxAge: 24 * 60 * 60 * 1000,
        });

        return res.redirect(
            `${process.env.CORS_ORIGIN}/oauth-success?accessToken=${encodeURIComponent(accessToken)}`
        );
    } catch (error) {
        console.error('Google OAuth error:', error);
        res.redirect(
            `${process.env.CORS_ORIGIN}/login?error=${encodeURIComponent(error.message)}`
        );
    }
};