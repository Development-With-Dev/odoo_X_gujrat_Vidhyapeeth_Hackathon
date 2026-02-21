import express from 'express';
import Maintenance from '../models/Maintenance.js';
import Vehicle from '../models/Vehicle.js';
import { requireAuth } from '../middleware/auth.js';
import { toJSON } from '../utils/toJSON.js';

const router = express.Router();
const fmt = (doc) => toJSON(doc, { refs: ['vehicleId'], dates: ['date'] });

router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const { vehicleId, status } = req.query;
        const filter = {};
        if (vehicleId) filter.vehicleId = vehicleId;
        if (status && status !== 'All') filter.status = status;
        const list = await Maintenance.find(filter).sort({ date: -1 });
        res.json({ success: true, data: list.map(fmt) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { vehicleId, status, ...rest } = req.body;
        const statusVal = status || 'In Progress';
        const m = await Maintenance.create({ vehicleId, status: statusVal, ...rest });
        if (statusVal === 'In Progress') {
            await Vehicle.findByIdAndUpdate(vehicleId, { status: 'In Shop' });
        }
        res.status(201).json({ success: true, data: fmt(m) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.patch('/:id', async (req, res) => {
    try {
        const m = await Maintenance.findById(req.params.id);
        if (!m) return res.status(404).json({ success: false, error: 'Maintenance record not found' });
        if (req.body.status === 'Completed' && m.status === 'In Progress') {
            await Vehicle.findByIdAndUpdate(m.vehicleId, { status: 'Available' });
        }
        Object.assign(m, req.body);
        await m.save();
        res.json({ success: true, data: fmt(m) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const m = await Maintenance.findById(req.params.id);
        if (!m) return res.status(404).json({ success: false, error: 'Maintenance record not found' });
        if (m.status === 'In Progress') {
            await Vehicle.findByIdAndUpdate(m.vehicleId, { status: 'Available' });
        }
        await Maintenance.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
