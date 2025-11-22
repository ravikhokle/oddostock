import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  deliveryNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    name: {
      type: String,
      required: [true, 'Customer name is required']
    },
    contact: String,
    email: String,
    address: String
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
    quantityPicked: {
      type: Number,
      default: 0,
      min: 0
    },
    quantityPacked: {
      type: Number,
      default: 0,
      min: 0
    },
    quantityDelivered: {
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
    enum: ['draft', 'waiting', 'picking', 'packing', 'ready', 'done', 'cancelled'],
    default: 'draft'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  deliveredDate: {
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

// Auto-generate delivery number
deliverySchema.pre('save', async function() {
  if (this.isNew && !this.deliveryNumber) {
    try {
      const lastDelivery = await mongoose.model('Delivery')
        .findOne({}, { deliveryNumber: 1 })
        .sort({ createdAt: -1 })
        .lean();
      
      let nextNumber = 1;
      if (lastDelivery && lastDelivery.deliveryNumber) {
        const lastNumber = parseInt(lastDelivery.deliveryNumber.split('-')[1]);
        nextNumber = lastNumber + 1;
      }
      
      this.deliveryNumber = `DEL-${String(nextNumber).padStart(6, '0')}`;
      console.log('Generated delivery number:', this.deliveryNumber);
    } catch (error) {
      console.error('Error generating delivery number:', error);
      this.deliveryNumber = `DEL-${Date.now()}`;
    }
  }
});

export default mongoose.model('Delivery', deliverySchema);
