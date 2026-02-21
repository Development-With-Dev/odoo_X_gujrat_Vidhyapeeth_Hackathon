import express from 'express';
import Vehicle from '../models/Vehicle.js';
import Trip from '../models/Trip.js';
import Driver from '../models/Driver.js';
import Maintenance from '../models/Maintenance.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const [vehicles, pendingCargo, drivers, maintenanceAlerts] = await Promise.all([
            Vehicle.find({ status: { $ne: 'Retired' } }),
            Trip.countDocuments({ status: 'Draft' }),
            Driver.find({}),
            Maintenance.countDocuments({ status: 'In Progress' }),
        ]);

        const total = vehicles.length;
        const activeFleet = vehicles.filter(v => v.status === 'On Trip').length;
        const inShop = vehicles.filter(v => v.status === 'In Shop').length;
        const available = vehicles.filter(v => v.status === 'Available').length;
        const utilizationRate = total > 0 ? Number(((activeFleet / total) * 100).toFixed(1)) : 0;
        const totalDrivers = drivers.length;
        const activeDrivers = drivers.filter(d => d.status === 'On Duty' || d.status === 'On Trip').length;

        res.json({
            success: true,
            data: {
                activeFleet,
                inShop: inShop || maintenanceAlerts,
                available,
                total,
                utilizationRate,
                pendingCargo,
                totalDrivers,
                activeDrivers,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
