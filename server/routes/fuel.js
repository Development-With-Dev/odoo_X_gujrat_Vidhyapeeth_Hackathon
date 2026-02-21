import express from 'express';
import FuelLog from '../models/FuelLog.js';
import { requireAuth } from '../middleware/auth.js';
import { toJSON } from '../utils/toJSON.js';

const router = express.Router();
const fmt = (doc) => toJSON(doc, { refs: ['vehicleId', 'tripId'], dates: ['date'] });

router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const { vehicleId, tripId } = req.query;
        const filter = {};
        if (vehicleId) filter.vehicleId = vehicleId;
        if (tripId) filter.tripId = tripId;
        const list = await FuelLog.find(filter).sort({ date: -1 });
        res.json({ success: true, data: list.map(fmt) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { vehicleId, tripId, liters, costPerLiter, odometer, date } = req.body;
        const totalCost = (Number(liters) || 0) * (Number(costPerLiter) || 0);
        const f = await FuelLog.create({
            vehicleId,
            tripId: tripId || null,
            liters: Number(liters),
            costPerLiter: Number(costPerLiter) || 0,
            totalCost,
            odometer: Number(odometer),
            date: date ? new Date(date) : new Date(),
        });
        res.status(201).json({ success: true, data: fmt(f) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { liters, costPerLiter, ...rest } = req.body;
        const update = { ...rest };
        if (liters != null) update.liters = Number(liters);
        if (costPerLiter != null) update.costPerLiter = Number(costPerLiter);
        if (liters != null || costPerLiter != null) {
            update.totalCost = (Number(update.liters ?? req.body.liters) || 0) * (Number(update.costPerLiter ?? req.body.costPerLiter) || 0);
        }
        const f = await FuelLog.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
        if (!f) return res.status(404).json({ success: false, error: 'Fuel log not found' });
        res.json({ success: true, data: fmt(f) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const f = await FuelLog.findByIdAndDelete(req.params.id);
        if (!f) return res.status(404).json({ success: false, error: 'Fuel log not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
