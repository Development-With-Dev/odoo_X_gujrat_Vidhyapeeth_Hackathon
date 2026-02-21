import express from 'express';
import Vehicle from '../models/Vehicle.js';
import { requireAuth } from '../middleware/auth.js';
import { toJSON } from '../utils/toJSON.js';

const router = express.Router();
const fmt = (doc) => toJSON(doc, { dates: ['dateAdded'] });

router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const { type, status, region, search } = req.query;
        const filter = {};
        if (type && type !== 'All') filter.type = type;
        if (status && status !== 'All') filter.status = status;
        if (region && region !== 'All') filter.region = region;
        if (search) {
            filter.$or = [
                { name: new RegExp(search, 'i') },
                { licensePlate: new RegExp(search, 'i') },
                { model: new RegExp(search, 'i') },
            ];
        }
        const list = await Vehicle.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, data: list.map(fmt) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const v = await Vehicle.findById(req.params.id);
        if (!v) return res.status(404).json({ success: false, error: 'Vehicle not found' });
        res.json({ success: true, data: fmt(v) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const v = await Vehicle.create({ ...req.body, status: req.body.status || 'Available' });
        res.status(201).json({ success: true, data: fmt(v) });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ success: false, error: 'License plate already exists' });
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const v = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!v) return res.status(404).json({ success: false, error: 'Vehicle not found' });
        res.json({ success: true, data: fmt(v) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Available', 'On Trip', 'In Shop', 'Retired'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }
        const v = await Vehicle.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!v) return res.status(404).json({ success: false, error: 'Vehicle not found' });
        res.json({ success: true, data: fmt(v) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const v = await Vehicle.findByIdAndDelete(req.params.id);
        if (!v) return res.status(404).json({ success: false, error: 'Vehicle not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
