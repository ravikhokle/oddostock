import mongoose from 'mongoose';

const stockAdjustmentSchema = new mongoose.Schema({
  adjustmentNumber: {
    type: String,
    required: true,
    unique: true
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
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    recordedQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    countedQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    difference: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      enum: ['damaged', 'lost', 'found', 'expired', 'theft', 'cycle_count', 'other'],
      required: true
    },
    notes: String
  }],
  status: {
    type: String,
    enum: ['draft', 'done', 'cancelled'],
    default: 'draft'
  },
  adjustmentDate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Auto-generate adjustment number
stockAdjustmentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('StockAdjustment').countDocuments();
    this.adjustmentNumber = `ADJ-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model('StockAdjustment', stockAdjustmentSchema);
