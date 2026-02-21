import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    cargoWeight: { type: Number, required: true },
    cargoDescription: { type: String, default: '' },
    status: { type: String, enum: ['Draft', 'Dispatched', 'Completed', 'Cancelled'], default: 'Draft' },
    dispatchedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    startOdometer: { type: Number, default: null },
    endOdometer: { type: Number, default: null },
    revenue: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Trip', tripSchema);
