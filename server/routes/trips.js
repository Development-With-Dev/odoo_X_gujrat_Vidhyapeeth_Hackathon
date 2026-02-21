import express from 'express';
import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import { requireAuth } from '../middleware/auth.js';
import { toJSON } from '../utils/toJSON.js';

const router = express.Router();
const fmt = (doc) => toJSON(doc, { refs: ['vehicleId', 'driverId'] });

router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status && status !== 'All') filter.status = status;
        const list = await Trip.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, data: list.map(fmt) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const t = await Trip.findById(req.params.id);
        if (!t) return res.status(404).json({ success: false, error: 'Trip not found' });
        res.json({ success: true, data: fmt(t) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { vehicleId, driverId, cargoWeight, origin, destination, cargoDescription, startOdometer, revenue } = req.body;
        const vehicle = await Vehicle.findById(vehicleId);
        const driver = await Driver.findById(driverId);
        if (!vehicle) return res.status(400).json({ success: false, error: 'Vehicle not found' });
        if (!driver) return res.status(400).json({ success: false, error: 'Driver not found' });
        if (vehicle.status !== 'Available') return res.status(400).json({ success: false, error: 'Vehicle is not available' });
        if (cargoWeight > vehicle.maxCapacity) return res.status(400).json({ success: false, error: `Cargo weight (${cargoWeight}kg) exceeds vehicle max capacity (${vehicle.maxCapacity}kg)` });
        const today = new Date().toISOString().slice(0, 10);
        const expiry = new Date(driver.licenseExpiry).toISOString().slice(0, 10);
        if (expiry < today) return res.status(400).json({ success: false, error: 'Driver license has expired' });
        const cats = (driver.licenseCategory || '').split(',').map(c => c.trim());
        if (!cats.includes(vehicle.type)) return res.status(400).json({ success: false, error: `Driver not licensed for ${vehicle.type}` });
        if (driver.status !== 'On Duty') return res.status(400).json({ success: false, error: 'Driver is not available (must be On Duty)' });

        const t = await Trip.create({
            vehicleId,
            driverId,
            origin: origin || 'Unknown',
            destination: destination || 'Unknown',
            cargoWeight: Number(cargoWeight),
            cargoDescription: cargoDescription || '',
            startOdometer: startOdometer || null,
            revenue: Number(revenue) || 0,
            status: 'Draft',
        });
        res.status(201).json({ success: true, data: fmt(t) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.patch('/:id/dispatch', async (req, res) => {
    try {
        const t = await Trip.findById(req.params.id);
        if (!t) return res.status(404).json({ success: false, error: 'Trip not found' });
        if (t.status !== 'Draft') return res.status(400).json({ success: false, error: 'Only draft trips can be dispatched' });
        await Vehicle.findByIdAndUpdate(t.vehicleId, { status: 'On Trip' });
        await Driver.findByIdAndUpdate(t.driverId, { status: 'On Trip' });
        t.status = 'Dispatched';
        t.dispatchedAt = new Date();
        await t.save();
        res.json({ success: true, data: fmt(t) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.patch('/:id/complete', async (req, res) => {
    try {
        const { endOdometer } = req.body;
        const t = await Trip.findById(req.params.id);
        if (!t) return res.status(404).json({ success: false, error: 'Trip not found' });
        if (t.status !== 'Dispatched') return res.status(400).json({ success: false, error: 'Only dispatched trips can be completed' });
        await Vehicle.findByIdAndUpdate(t.vehicleId, { status: 'Available', odometer: Number(endOdometer) || t.startOdometer });
        const driver = await Driver.findById(t.driverId);
        await Driver.findByIdAndUpdate(t.driverId, { status: 'On Duty', tripsCompleted: (driver?.tripsCompleted || 0) + 1 });
        t.status = 'Completed';
        t.completedAt = new Date();
        t.endOdometer = Number(endOdometer) || null;
        await t.save();
        res.json({ success: true, data: fmt(t) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.patch('/:id/cancel', async (req, res) => {
    try {
        const t = await Trip.findById(req.params.id);
        if (!t) return res.status(404).json({ success: false, error: 'Trip not found' });
        if (!['Draft', 'Dispatched'].includes(t.status)) return res.status(400).json({ success: false, error: 'Trip cannot be cancelled' });
        if (t.status === 'Dispatched') {
            await Vehicle.findByIdAndUpdate(t.vehicleId, { status: 'Available' });
            const driver = await Driver.findById(t.driverId);
            await Driver.findByIdAndUpdate(t.driverId, { status: 'On Duty', tripsCancelled: (driver?.tripsCancelled || 0) + 1 });
        }
        t.status = 'Cancelled';
        await t.save();
        res.json({ success: true, data: fmt(t) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const t = await Trip.findById(req.params.id);
        if (!t) return res.status(404).json({ success: false, error: 'Trip not found' });
        if (['Dispatched'].includes(t.status)) {
            return res.status(400).json({ success: false, error: 'Cannot delete a dispatched trip — cancel it first' });
        }
        await Trip.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
