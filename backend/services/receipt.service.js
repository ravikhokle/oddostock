import Receipt from '../models/Receipt.model.js';
import StockLedger from '../models/StockLedger.model.js';
import { AppError } from '../middleware/errorHandler.js';
import mongoose from 'mongoose';

class ReceiptService {
  async createReceipt(receiptData, userId) {
    receiptData.createdBy = userId;
    const receipt = await Receipt.create(receiptData);
    return receipt.populate(['warehouse', 'location', 'items.product']);
  }

  async getAllReceipts(filters = {}) {
    const query = {};
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.warehouse) {
      query.warehouse = filters.warehouse;
    }

    const receipts = await Receipt.find(query)
      .populate(['warehouse', 'location', 'items.product', 'createdBy'])
      .sort({ createdAt: -1 });

    return receipts;
  }

  async getReceiptById(receiptId) {
    const receipt = await Receipt.findById(receiptId)
      .populate(['warehouse', 'location', 'items.product', 'createdBy', 'validatedBy']);
    
    if (!receipt) {
      throw new AppError('Receipt not found', 404);
    }

    return receipt;
  }

  async updateReceipt(receiptId, updates) {
    const receipt = await Receipt.findById(receiptId);
    
    if (!receipt) {
      throw new AppError('Receipt not found', 404);
    }

    if (receipt.status === 'done' || receipt.status === 'cancelled') {
      throw new AppError('Cannot update completed or cancelled receipt', 400);
    }

    Object.assign(receipt, updates);
    await receipt.save();

    return receipt.populate(['warehouse', 'location', 'items.product']);
  }

  async validateReceipt(receiptId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const receipt = await Receipt.findById(receiptId).session(session);
      
      if (!receipt) {
        throw new AppError('Receipt not found', 404);
      }

      if (receipt.status === 'done') {
        throw new AppError('Receipt already validated', 400);
      }

      // Update stock ledger for each item
      for (const item of receipt.items) {
        if (item.quantityReceived > 0) {
          // Get current running balance
          const lastEntry = await StockLedger.findOne({
            product: item.product,
            warehouse: receipt.warehouse,
            location: receipt.location
          }).sort({ createdAt: -1 }).session(session);

          const runningBalance = (lastEntry?.runningBalance || 0) + item.quantityReceived;

          await StockLedger.create([{
            product: item.product,
            warehouse: receipt.warehouse,
            location: receipt.location,
            quantity: item.quantityReceived,
            runningBalance,
            transactionType: 'receipt',
            referenceDoc: receipt.receiptNumber,
            referenceId: receipt._id,
            performedBy: userId,
            notes: `Receipt from ${receipt.supplier.name}`
          }], { session });
        }
      }

      receipt.status = 'done';
      receipt.receivedDate = new Date();
      receipt.validatedBy = userId;
      await receipt.save({ session });

      await session.commitTransaction();
      
      return receipt.populate(['warehouse', 'location', 'items.product']);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async cancelReceipt(receiptId) {
    const receipt = await Receipt.findById(receiptId);
    
    if (!receipt) {
      throw new AppError('Receipt not found', 404);
    }

    if (receipt.status === 'done') {
      throw new AppError('Cannot cancel validated receipt', 400);
    }

    receipt.status = 'cancelled';
    await receipt.save();

    return receipt;
  }
}

export default new ReceiptService();
