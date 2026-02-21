import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    licenseNumber: { type: String, required: true, trim: true },
    licenseCategory: { type: String, required: true },
    licenseExpiry: { type: Date, required: true },
    safetyScore: { type: Number, default: 100, min: 0, max: 100 },
    tripsCompleted: { type: Number, default: 0 },
    tripsCancelled: { type: Number, default: 0 },
    status: { type: String, enum: ['On Duty', 'On Trip', 'Off Duty', 'Suspended'], default: 'On Duty' },
    photoUrl: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Driver', driverSchema);
