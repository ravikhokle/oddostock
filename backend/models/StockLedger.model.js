import mongoose from 'mongoose';

const stockLedgerSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  runningBalance: {
    type: Number,
    required: true,
    default: 0
  },
  transactionType: {
    type: String,
    enum: ['receipt', 'delivery', 'transfer_in', 'transfer_out', 'adjustment'],
    required: true
  },
  referenceDoc: {
    type: String,
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
stockLedgerSchema.index({ product: 1, warehouse: 1, location: 1 });
stockLedgerSchema.index({ transactionType: 1 });
stockLedgerSchema.index({ createdAt: -1 });

export default mongoose.model('StockLedger', stockLedgerSchema);
