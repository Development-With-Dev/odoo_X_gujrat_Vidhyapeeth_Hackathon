import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
    category: { type: String, required: true },
    description: { type: String, default: '' },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);
