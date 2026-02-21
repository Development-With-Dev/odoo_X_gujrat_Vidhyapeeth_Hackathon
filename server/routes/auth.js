import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendResetEmail } from '../utils/mailer.js';

const router = express.Router();

function signToken(user) {
    return jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

router.post('/register', async (req, res) => {
    try {
        const { username, password, name, role, companyName } = req.body;

        if (!username || !password || !name) {
            return res.status(400).json({ success: false, error: 'Username, password, and name are required' });
        }

        const existing = await User.findOne({ username: username.toLowerCase() });
        if (existing) {
            return res.status(400).json({ success: false, error: 'Username already taken' });
        }

        const user = await User.create({
            username: username.toLowerCase(),
            password,
            name,
            role: role || 'dispatcher',
            companyName: companyName || '',
        });

        const token = signToken(user);

        res.status(201).json({
            success: true,
            token,
            user: user.toJSON(),
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Username already taken' });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Username and password are required' });
        }

        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }

        const token = signToken(user);

        res.json({
            success: true,
            token,
            user: user.toJSON(),
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ success: false, error: 'User not found' });
        }

        res.json({ success: true, user: user.toJSON() });
    } catch (err) {
        res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
});

/* ─── Forgot Password: send OTP to email ─── */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        // username IS the email in this system
        const user = await User.findOne({ username: email.toLowerCase() });
        if (!user) {
            // Don't reveal whether user exists
            return res.json({ success: true, message: 'If this email is registered, a reset code has been sent.' });
        }

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        user.resetPasswordToken = otp;
        user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        // Send email
        await sendResetEmail(user.username, otp, user.name);

        res.json({ success: true, message: 'If this email is registered, a reset code has been sent.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ success: false, error: 'Failed to process request. Please try again.' });
    }
});

/* ─── Reset Password: verify OTP and set new password ─── */
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, error: 'Email, OTP, and new password are required' });
        }

        if (newPassword.length < 4) {
            return res.status(400).json({ success: false, error: 'Password must be at least 4 characters' });
        }

        const user = await User.findOne({
            username: email.toLowerCase(),
            resetPasswordToken: otp,
            resetPasswordExpires: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ success: false, error: 'Invalid or expired reset code' });
        }

        user.password = newPassword; // will be hashed by pre-save hook
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully! You can now login.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
