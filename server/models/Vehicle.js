import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    model: { type: String, default: '' },
    type: { type: String, enum: ['Truck', 'Van', 'Bike'], required: true },
    licensePlate: { type: String, required: true, unique: true, trim: true },
    maxCapacity: { type: Number, required: true },
    odometer: { type: Number, required: true, default: 0 },
    region: { type: String, default: 'Central' },
    status: { type: String, enum: ['Available', 'On Trip', 'In Shop', 'Retired'], default: 'Available' },
    acquisitionCost: { type: Number, default: 0 },
    dateAdded: { type: Date, default: Date.now },
    location: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Vehicle', vehicleSchema);
