import Delivery from '../models/Delivery.model.js';
import StockLedger from '../models/StockLedger.model.js';
import { AppError } from '../middleware/errorHandler.js';
import mongoose from 'mongoose';

class DeliveryService {
  async createDelivery(deliveryData, userId) {
    try {
      deliveryData.createdBy = userId;
      delete deliveryData.deliveryNumber;
      
      console.log('Creating delivery with data:', JSON.stringify(deliveryData, null, 2));
      
      const delivery = await Delivery.create(deliveryData);
      console.log('Delivery created successfully:', delivery.deliveryNumber);
      
      return delivery.populate(['warehouse', 'location', 'items.product']);
    } catch (error) {
      console.error('Error in createDelivery service:', error.message);
      throw error;
    }
  }

  async getAllDeliveries(filters = {}) {
    const query = {};
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.warehouse) {
      query.warehouse = filters.warehouse;
    }

    const deliveries = await Delivery.find(query)
      .populate(['warehouse', 'location', 'items.product', 'createdBy'])
      .sort({ createdAt: -1 });

    return deliveries;
  }

  async getDeliveryById(deliveryId) {
    const delivery = await Delivery.findById(deliveryId)
      .populate(['warehouse', 'location', 'items.product', 'createdBy', 'validatedBy']);
    
    if (!delivery) {
      throw new AppError('Delivery not found', 404);
    }

    return delivery;
  }

  async updateDelivery(deliveryId, updates) {
    const delivery = await Delivery.findById(deliveryId);
    
    if (!delivery) {
      throw new AppError('Delivery not found', 404);
    }

    if (delivery.status === 'done' || delivery.status === 'cancelled') {
      throw new AppError('Cannot update completed or cancelled delivery', 400);
    }

    Object.assign(delivery, updates);
    await delivery.save();

    return delivery.populate(['warehouse', 'location', 'items.product']);
  }

  async pickItems(deliveryId, items, userId) {
    const delivery = await Delivery.findById(deliveryId);
    
    if (!delivery) {
      throw new AppError('Delivery not found', 404);
    }

    if (delivery.status === 'done' || delivery.status === 'cancelled') {
      throw new AppError('Cannot pick items for completed or cancelled delivery', 400);
    }

    // Update picked quantities
    items.forEach(({ productId, quantityPicked }) => {
      const item = delivery.items.find(i => i.product.toString() === productId);
      if (item) {
        item.quantityPicked = quantityPicked;
      }
    });

    delivery.status = 'picking';
    await delivery.save();

    return delivery.populate(['warehouse', 'location', 'items.product']);
  }

  async packItems(deliveryId, items, userId) {
    const delivery = await Delivery.findById(deliveryId);
    
    if (!delivery) {
      throw new AppError('Delivery not found', 404);
    }

    if (delivery.status === 'done' || delivery.status === 'cancelled') {
      throw new AppError('Cannot pack items for completed or cancelled delivery', 400);
    }

    // Update packed quantities
    items.forEach(({ productId, quantityPacked }) => {
      const item = delivery.items.find(i => i.product.toString() === productId);
      if (item) {
        item.quantityPacked = quantityPacked;
        item.quantityDelivered = quantityPacked; // Packed = delivered
      }
    });

    delivery.status = 'ready';
    await delivery.save();

    return delivery.populate(['warehouse', 'location', 'items.product']);
  }

  async validateDelivery(deliveryId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const delivery = await Delivery.findById(deliveryId).session(session);
      
      if (!delivery) {
        throw new AppError('Delivery not found', 404);
      }

      if (delivery.status === 'done') {
        throw new AppError('Delivery already validated', 400);
      }

      // Update stock ledger for each item
      for (const item of delivery.items) {
        if (item.quantityDelivered > 0) {
          // Check if enough stock available
          const lastEntry = await StockLedger.findOne({
            product: item.product,
            warehouse: delivery.warehouse,
            location: delivery.location
          }).sort({ createdAt: -1 }).session(session);

          const currentStock = lastEntry?.runningBalance || 0;

          if (currentStock < item.quantityDelivered) {
            throw new AppError(`Insufficient stock for product ${item.product}`, 400);
          }

          const runningBalance = currentStock - item.quantityDelivered;

          await StockLedger.create([{
            product: item.product,
            warehouse: delivery.warehouse,
            location: delivery.location,
            quantity: -item.quantityDelivered,
            runningBalance,
            transactionType: 'delivery',
            referenceDoc: delivery.deliveryNumber,
            referenceId: delivery._id,
            performedBy: userId,
            notes: `Delivery to ${delivery.customer.name}`
          }], { session });
        }
      }

      delivery.status = 'done';
      delivery.deliveredDate = new Date();
      delivery.validatedBy = userId;
      await delivery.save({ session });

      await session.commitTransaction();
      
      return delivery.populate(['warehouse', 'location', 'items.product']);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async cancelDelivery(deliveryId) {
    const delivery = await Delivery.findById(deliveryId);
    
    if (!delivery) {
      throw new AppError('Delivery not found', 404);
    }

    if (delivery.status === 'done') {
      throw new AppError('Cannot cancel validated delivery', 400);
    }

    delivery.status = 'cancelled';
    await delivery.save();

    return delivery;
  }
}

export default new DeliveryService();
