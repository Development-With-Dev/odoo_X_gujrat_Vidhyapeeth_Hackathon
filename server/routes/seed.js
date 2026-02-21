import express from 'express';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Trip from '../models/Trip.js';
import Maintenance from '../models/Maintenance.js';
import FuelLog from '../models/FuelLog.js';
import Expense from '../models/Expense.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.post('/', async (req, res) => {
    try {
        const vehicleCount = await Vehicle.countDocuments();
        if (vehicleCount > 0) {
            return res.json({ success: true, message: 'Data already exists. Skipping seed.' });
        }

        const vehicles = await Vehicle.insertMany([
            { name: 'Volvo FH-16', model: '2023', type: 'Truck', licensePlate: 'GJ-05-AB-1234', maxCapacity: 18000, odometer: 125340, region: 'West', status: 'Available', acquisitionCost: 4500000 },
            { name: 'Tata Ace EV', model: '2024', type: 'Van', licensePlate: 'GJ-01-CD-5678', maxCapacity: 500, odometer: 34200, region: 'Central', status: 'On Trip', acquisitionCost: 850000 },
            { name: 'Mahindra Treo', model: '2024', type: 'Bike', licensePlate: 'GJ-06-EF-9012', maxCapacity: 150, odometer: 12800, region: 'East', status: 'Available', acquisitionCost: 350000 },
            { name: 'Eicher Pro 2049', model: '2022', type: 'Truck', licensePlate: 'GJ-03-GH-3456', maxCapacity: 9500, odometer: 210500, region: 'North', status: 'In Shop', acquisitionCost: 2200000 },
            { name: 'Ashok Leyland Dost+', model: '2023', type: 'Van', licensePlate: 'GJ-07-IJ-7890', maxCapacity: 1500, odometer: 67800, region: 'South', status: 'Available', acquisitionCost: 750000 },
            { name: 'BharatBenz 1617R', model: '2023', type: 'Truck', licensePlate: 'GJ-02-KL-2345', maxCapacity: 16000, odometer: 98200, region: 'West', status: 'Available', acquisitionCost: 3800000 },
        ]);

        const drivers = await Driver.insertMany([
            { name: 'Alex Kumar', phone: '+91-98765-43210', licenseNumber: 'GJ12-2020-0045678', licenseCategory: 'Truck,Van', licenseExpiry: new Date('2026-08-15'), safetyScore: 92, tripsCompleted: 187, tripsCancelled: 3, status: 'On Duty' },
            { name: 'Priya Sharma', phone: '+91-87654-32109', licenseNumber: 'GJ05-2021-0098765', licenseCategory: 'Van,Bike', licenseExpiry: new Date('2027-03-20'), safetyScore: 97, tripsCompleted: 134, tripsCancelled: 1, status: 'On Trip' },
            { name: 'Raj Patel', phone: '+91-76543-21098', licenseNumber: 'GJ01-2019-0034567', licenseCategory: 'Truck,Van,Bike', licenseExpiry: new Date('2025-12-01'), safetyScore: 78, tripsCompleted: 256, tripsCancelled: 12, status: 'On Duty' },
            { name: 'Meena Devi', phone: '+91-65432-10987', licenseNumber: 'GJ08-2022-0076543', licenseCategory: 'Van,Bike', licenseExpiry: new Date('2028-06-30'), safetyScore: 88, tripsCompleted: 89, tripsCancelled: 2, status: 'Off Duty' },
        ]);

        const vIds = vehicles.map(v => v._id);
        const dIds = drivers.map(d => d._id);

        await Trip.insertMany([
            { vehicleId: vIds[1], driverId: dIds[1], origin: 'Ahmedabad Warehouse', destination: 'Surat Distribution Hub', cargoWeight: 420, cargoDescription: 'Electronics', status: 'Dispatched', dispatchedAt: new Date(), startOdometer: 34100, revenue: 15000 },
            { vehicleId: vIds[0], driverId: dIds[0], origin: 'Mundra Port', destination: 'Delhi NCR Hub', cargoWeight: 16500, cargoDescription: 'Industrial Parts', status: 'Completed', dispatchedAt: new Date(Date.now() - 86400000), completedAt: new Date(), startOdometer: 124200, endOdometer: 125340, revenue: 95000 },
            { vehicleId: vIds[4], driverId: dIds[2], origin: 'Gandhinagar Depot', destination: 'Bhavnagar Port', cargoWeight: 1200, cargoDescription: 'Textile Rolls', status: 'Completed', dispatchedAt: new Date(Date.now() - 86400000 * 2), completedAt: new Date(Date.now() - 86400000), startOdometer: 67200, endOdometer: 67800, revenue: 22000 },
            { vehicleId: vIds[5], driverId: dIds[0], origin: 'Ahmedabad Cold Storage', destination: 'Mumbai Distribution', cargoWeight: 14000, cargoDescription: 'Frozen Foods', status: 'Draft', revenue: 78000 },
        ]);

        await Maintenance.insertMany([
            { vehicleId: vIds[3], type: 'Engine Overhaul', description: 'Complete engine rebuild', cost: 185000, date: new Date(), status: 'In Progress', mechanic: 'AutoCare Garage' },
            { vehicleId: vIds[0], type: 'Oil Change', description: 'Synthetic oil + filter', cost: 8500, date: new Date(Date.now() - 86400000 * 7), status: 'Completed', mechanic: 'QuickLube' },
        ]);

        await FuelLog.insertMany([
            { vehicleId: vIds[0], liters: 180, costPerLiter: 102.5, totalCost: 18450, date: new Date(), odometer: 125340 },
            { vehicleId: vIds[4], liters: 45, costPerLiter: 102.5, totalCost: 4612.5, date: new Date(), odometer: 67800 },
        ]);

        await Expense.insertMany([
            { vehicleId: vIds[0], category: 'Toll', description: 'NH-48 Toll', amount: 3200, date: new Date() },
            { vehicleId: vIds[1], category: 'Insurance', description: 'Quarterly premium', amount: 12000, date: new Date() },
        ]);

        res.json({ success: true, message: 'Demo data seeded successfully. Refresh the app.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
