import StockAdjustment from '../models/StockAdjustment.model.js';
import StockLedger from '../models/StockLedger.model.js';
import { AppError } from '../middleware/errorHandler.js';
import mongoose from 'mongoose';

class AdjustmentService {
  async createAdjustment(adjustmentData, userId) {
    adjustmentData.createdBy = userId;
    const adjustment = await StockAdjustment.create(adjustmentData);
    return adjustment.populate(['warehouse', 'location', 'items.product']);
  }

  async getAllAdjustments(filters = {}) {
    const query = {};
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.warehouse) {
      query.warehouse = filters.warehouse;
    }

    const adjustments = await StockAdjustment.find(query)
      .populate(['warehouse', 'location', 'items.product', 'createdBy'])
      .sort({ createdAt: -1 });

    return adjustments;
  }

  async getAdjustmentById(adjustmentId) {
    const adjustment = await StockAdjustment.findById(adjustmentId)
      .populate(['warehouse', 'location', 'items.product', 'createdBy', 'validatedBy']);
    
    if (!adjustment) {
      throw new AppError('Adjustment not found', 404);
    }

    return adjustment;
  }

  async updateAdjustment(adjustmentId, updates) {
    const adjustment = await StockAdjustment.findById(adjustmentId);
    
    if (!adjustment) {
      throw new AppError('Adjustment not found', 404);
    }

    if (adjustment.status === 'done' || adjustment.status === 'cancelled') {
      throw new AppError('Cannot update completed or cancelled adjustment', 400);
    }

    Object.assign(adjustment, updates);
    await adjustment.save();

    return adjustment.populate(['warehouse', 'location', 'items.product']);
  }

  async validateAdjustment(adjustmentId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const adjustment = await StockAdjustment.findById(adjustmentId).session(session);
      
      if (!adjustment) {
        throw new AppError('Adjustment not found', 404);
      }

      if (adjustment.status === 'done') {
        throw new AppError('Adjustment already validated', 400);
      }

      // Update stock ledger for each item
      for (const item of adjustment.items) {
        if (item.difference !== 0) {
          // Get current running balance
          const lastEntry = await StockLedger.findOne({
            product: item.product,
            warehouse: adjustment.warehouse,
            location: adjustment.location
          }).sort({ createdAt: -1 }).session(session);

          const runningBalance = (lastEntry?.runningBalance || 0) + item.difference;

          await StockLedger.create([{
            product: item.product,
            warehouse: adjustment.warehouse,
            location: adjustment.location,
            quantity: item.difference,
            runningBalance,
            transactionType: 'adjustment',
            referenceDoc: adjustment.adjustmentNumber,
            referenceId: adjustment._id,
            performedBy: userId,
            notes: `Stock adjustment - ${item.reason}: ${item.notes || ''}`
          }], { session });
        }
      }

      adjustment.status = 'done';
      adjustment.validatedBy = userId;
      await adjustment.save({ session });

      await session.commitTransaction();
      
      return adjustment.populate(['warehouse', 'location', 'items.product']);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async cancelAdjustment(adjustmentId) {
    const adjustment = await StockAdjustment.findById(adjustmentId);
    
    if (!adjustment) {
      throw new AppError('Adjustment not found', 404);
    }

    if (adjustment.status === 'done') {
      throw new AppError('Cannot cancel validated adjustment', 400);
    }

    adjustment.status = 'cancelled';
    await adjustment.save();

    return adjustment;
  }
}

export default new AdjustmentService();
