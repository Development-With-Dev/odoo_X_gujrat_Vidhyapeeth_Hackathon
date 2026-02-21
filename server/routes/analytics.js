import express from 'express';
import Vehicle from '../models/Vehicle.js';
import Trip from '../models/Trip.js';
import FuelLog from '../models/FuelLog.js';
import Maintenance from '../models/Maintenance.js';
import Expense from '../models/Expense.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const [vehicles, completedTrips, fuelLogs, maintenance, expenses] = await Promise.all([
            Vehicle.find({ status: { $ne: 'Retired' } }),
            Trip.find({ status: 'Completed' }),
            FuelLog.find({}),
            Maintenance.find({}),
            Expense.find({}),
        ]);

        const totalRevenue = completedTrips.reduce((s, t) => s + (t.revenue || 0), 0);
        const totalFuel = fuelLogs.reduce((s, f) => s + f.totalCost, 0);
        const totalMaint = maintenance.reduce((s, m) => s + m.cost, 0);
        const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
        const netProfit = totalRevenue - totalFuel - totalMaint - totalExpense;

        const vehicleMetrics = vehicles.map((v) => {
            const vid = v._id.toString();
            const vFuel = fuelLogs.filter(f => f.vehicleId.toString() === vid);
            const vMaint = maintenance.filter(m => m.vehicleId.toString() === vid);
            const vExp = expenses.filter(e => e.vehicleId.toString() === vid);
            const vTrips = completedTrips.filter(t => t.vehicleId.toString() === vid);
            const totalLiters = vFuel.reduce((s, f) => s + f.liters, 0);
            const totalKm = vTrips.reduce((s, t) => (t.endOdometer && t.startOdometer) ? s + (t.endOdometer - t.startOdometer) : s, 0);
            const fuelEff = totalLiters > 0 ? (totalKm / totalLiters).toFixed(1) : '—';
            const revenue = vTrips.reduce((s, t) => s + (t.revenue || 0), 0);
            const opsCost = vFuel.reduce((s, f) => s + f.totalCost, 0) + vMaint.reduce((s, m) => s + m.cost, 0) + vExp.reduce((s, e) => s + e.amount, 0);
            const roi = v.acquisitionCost > 0 ? (((revenue - opsCost) / v.acquisitionCost) * 100).toFixed(1) : 0;
            const costPerKm = totalKm > 0 ? (opsCost / totalKm).toFixed(1) : '—';
            return {
                id: vid,
                name: v.name,
                licensePlate: v.licensePlate,
                type: v.type,
                tripCount: vTrips.length,
                totalKm,
                totalLiters,
                fuelEff,
                revenue,
                opsCost,
                roi: Number(roi),
                costPerKm,
            };
        });

        res.json({
            success: true,
            data: {
                totalRevenue,
                totalFuel,
                totalMaint,
                totalExpense,
                netProfit,
                completedTripsCount: completedTrips.length,
                vehicleMetrics,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
