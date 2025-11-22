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
deliverySchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Delivery').countDocuments();
    this.deliveryNumber = `DEL-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model('Delivery', deliverySchema);
