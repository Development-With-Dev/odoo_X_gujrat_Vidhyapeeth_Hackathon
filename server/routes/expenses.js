import express from 'express';
import Expense from '../models/Expense.js';
import { requireAuth } from '../middleware/auth.js';
import { toJSON } from '../utils/toJSON.js';

const router = express.Router();
const fmt = (doc) => toJSON(doc, { refs: ['vehicleId', 'tripId'], dates: ['date'] });

router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const { vehicleId } = req.query;
        const filter = {};
        if (vehicleId) filter.vehicleId = vehicleId;
        const list = await Expense.find(filter).sort({ date: -1 });
        res.json({ success: true, data: list.map(fmt) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const e = await Expense.create(req.body);
        res.status(201).json({ success: true, data: fmt(e) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const e = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!e) return res.status(404).json({ success: false, error: 'Expense not found' });
        res.json({ success: true, data: fmt(e) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const e = await Expense.findByIdAndDelete(req.params.id);
        if (!e) return res.status(404).json({ success: false, error: 'Expense not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
