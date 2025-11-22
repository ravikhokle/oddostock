import mongoose from 'mongoose';

const internalTransferSchema = new mongoose.Schema({
  transferNumber: {
    type: String,
    required: true,
    unique: true
  },
  sourceWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  sourceLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  destinationWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  destinationLocation: {
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
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    quantityTransferred: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'waiting', 'in_transit', 'done', 'cancelled'],
    default: 'draft'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  completedDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Auto-generate transfer number
internalTransferSchema.pre('save', async function() {
  if (this.isNew && !this.transferNumber) {
    try {
      const lastTransfer = await mongoose.model('InternalTransfer')
        .findOne({}, { transferNumber: 1 })
        .sort({ createdAt: -1 })
        .lean();
      
      let nextNumber = 1;
      if (lastTransfer && lastTransfer.transferNumber) {
        const lastNumber = parseInt(lastTransfer.transferNumber.split('-')[1]);
        nextNumber = lastNumber + 1;
      }
      
      this.transferNumber = `TRF-${String(nextNumber).padStart(6, '0')}`;
      console.log('Generated transfer number:', this.transferNumber);
    } catch (error) {
      console.error('Error generating transfer number:', error);
      this.transferNumber = `TRF-${Date.now()}`;
    }
  }
});

export default mongoose.model('InternalTransfer', internalTransferSchema);
