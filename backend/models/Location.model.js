import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Location name is required'],
    trim: true
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'Warehouse is required']
  },
  type: {
    type: String,
    enum: ['storage', 'production', 'transit', 'vendor', 'customer'],
    default: 'storage'
  },
  parentLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound unique index
locationSchema.index({ name: 1, warehouse: 1 }, { unique: true });

export default mongoose.model('Location', locationSchema);
