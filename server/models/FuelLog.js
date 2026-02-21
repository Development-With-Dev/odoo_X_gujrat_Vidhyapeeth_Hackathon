import mongoose from 'mongoose';

const fuelLogSchema = new mongoose.Schema({
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
    liters: { type: Number, required: true },
    costPerLiter: { type: Number, default: 0 },
    totalCost: { type: Number, required: true },
    date: { type: Date, required: true },
    odometer: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model('FuelLog', fuelLogSchema);
