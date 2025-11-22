import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    required: true,
    unique: true
  },
  supplier: {
    name: {
      type: String,
      required: [true, 'Supplier name is required']
    },
    contact: String,
    email: String
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
    quantityOrdered: {
      type: Number,
      required: true,
      min: 0
    },
    quantityReceived: {
      type: Number,
      default: 0,
      min: 0
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'pending', 'validated', 'cancelled'],
    default: 'pending'
  },
  expectedDate: {
    type: Date,
    default: Date.now
  },
  receivedDate: {
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

// Auto-generate receipt number
receiptSchema.pre('save', async function() {
  if (this.isNew && !this.receiptNumber) {
    try {
      // Find the last receipt number to avoid duplicates
      const lastReceipt = await mongoose.model('Receipt')
        .findOne({}, { receiptNumber: 1 })
        .sort({ createdAt: -1 })
        .lean();
      
      let nextNumber = 1;
      if (lastReceipt && lastReceipt.receiptNumber) {
        const lastNumber = parseInt(lastReceipt.receiptNumber.split('-')[1]);
        nextNumber = lastNumber + 1;
      }
      
      this.receiptNumber = `RCP-${String(nextNumber).padStart(6, '0')}`;
      console.log('Generated receipt number:', this.receiptNumber);
    } catch (error) {
      console.error('Error generating receipt number:', error);
      // Fallback to timestamp-based number if generation fails
      this.receiptNumber = `RCP-${Date.now()}`;
    }
  }
});

export default mongoose.model('Receipt', receiptSchema);
