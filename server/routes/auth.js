import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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

export default router;
