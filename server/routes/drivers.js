import express from 'express';
import Driver from '../models/Driver.js';
import { requireAuth } from '../middleware/auth.js';
import { toJSON } from '../utils/toJSON.js';

const router = express.Router();
const fmt = (doc) => toJSON(doc, { dates: ['licenseExpiry'] });

router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const { status, search } = req.query;
        const filter = {};
        if (status && status !== 'All') filter.status = status;
        if (search) {
            filter.$or = [
                { name: new RegExp(search, 'i') },
                { licenseNumber: new RegExp(search, 'i') },
            ];
        }
        const list = await Driver.find(filter).sort({ name: 1 });
        res.json({ success: true, data: list.map(fmt) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const d = await Driver.findById(req.params.id);
        if (!d) return res.status(404).json({ success: false, error: 'Driver not found' });
        res.json({ success: true, data: fmt(d) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const d = await Driver.create({
            ...req.body,
            tripsCompleted: req.body.tripsCompleted ?? 0,
            tripsCancelled: req.body.tripsCancelled ?? 0,
            safetyScore: req.body.safetyScore ?? 100,
        });
        res.status(201).json({ success: true, data: fmt(d) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const d = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!d) return res.status(404).json({ success: false, error: 'Driver not found' });
        res.json({ success: true, data: fmt(d) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['On Duty', 'On Trip', 'Off Duty', 'Suspended'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }
        const d = await Driver.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!d) return res.status(404).json({ success: false, error: 'Driver not found' });
        res.json({ success: true, data: fmt(d) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const d = await Driver.findByIdAndDelete(req.params.id);
        if (!d) return res.status(404).json({ success: false, error: 'Driver not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
