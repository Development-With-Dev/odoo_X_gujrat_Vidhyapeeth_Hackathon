import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import vehicleRoutes from './routes/vehicles.js';
import driverRoutes from './routes/drivers.js';
import tripRoutes from './routes/trips.js';
import maintenanceRoutes from './routes/maintenance.js';
import fuelRoutes from './routes/fuel.js';
import expenseRoutes from './routes/expenses.js';
import kpiRoutes from './routes/kpis.js';
import analyticsRoutes from './routes/analytics.js';
import seedRoutes from './routes/seed.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== 'production') {
    app.use((req, _res, next) => {
        console.log(`→ ${req.method} ${req.url}`);
        next();
    });
}

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/kpis', kpiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/seed', seedRoutes);

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err.stack || err.message || err);
    res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error' });
});

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`FleetFlow API running on http://localhost:${PORT}`);
    });
});
