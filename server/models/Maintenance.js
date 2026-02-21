import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema({
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    type: { type: String, required: true },
    description: { type: String, default: '' },
    cost: { type: Number, required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'], default: 'In Progress' },
    mechanic: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Maintenance', maintenanceSchema);
