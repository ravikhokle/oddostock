import InternalTransfer from '../models/InternalTransfer.model.js';
import StockLedger from '../models/StockLedger.model.js';
import { AppError } from '../middleware/errorHandler.js';
import mongoose from 'mongoose';

class TransferService {
  async createTransfer(transferData, userId) {
    try {
      transferData.createdBy = userId;
      delete transferData.transferNumber;
      
      console.log('Creating transfer with data:', JSON.stringify(transferData, null, 2));
      
      const transfer = await InternalTransfer.create(transferData);
      console.log('Transfer created successfully:', transfer.transferNumber);
      
      return transfer.populate([
        'sourceWarehouse',
        'sourceLocation',
        'destinationWarehouse',
        'destinationLocation',
        'items.product'
      ]);
    } catch (error) {
      console.error('Error in createTransfer service:', error.message);
      throw error;
    }
  }

  async getAllTransfers(filters = {}) {
    const query = {};
    
    if (filters.status) {
      query.status = filters.status;
    }

    const transfers = await InternalTransfer.find(query)
      .populate([
        'sourceWarehouse',
        'sourceLocation',
        'destinationWarehouse',
        'destinationLocation',
        'items.product',
        'createdBy'
      ])
      .sort({ createdAt: -1 });

    return transfers;
  }

  async getTransferById(transferId) {
    const transfer = await InternalTransfer.findById(transferId)
      .populate([
        'sourceWarehouse',
        'sourceLocation',
        'destinationWarehouse',
        'destinationLocation',
        'items.product',
        'createdBy',
        'validatedBy'
      ]);
    
    if (!transfer) {
      throw new AppError('Transfer not found', 404);
    }

    return transfer;
  }

  async updateTransfer(transferId, updates) {
    const transfer = await InternalTransfer.findById(transferId);
    
    if (!transfer) {
      throw new AppError('Transfer not found', 404);
    }

    if (transfer.status === 'done' || transfer.status === 'cancelled') {
      throw new AppError('Cannot update completed or cancelled transfer', 400);
    }

    Object.assign(transfer, updates);
    await transfer.save();

    return transfer.populate([
      'sourceWarehouse',
      'sourceLocation',
      'destinationWarehouse',
      'destinationLocation',
      'items.product'
    ]);
  }

  async validateTransfer(transferId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transfer = await InternalTransfer.findById(transferId).session(session);
      
      if (!transfer) {
        throw new AppError('Transfer not found', 404);
      }

      if (transfer.status === 'done') {
        throw new AppError('Transfer already validated', 400);
      }

      // Process each item
      for (const item of transfer.items) {
        const quantityToTransfer = item.quantityTransferred || item.quantity;

        // Deduct from source
        const sourceLastEntry = await StockLedger.findOne({
          product: item.product,
          warehouse: transfer.sourceWarehouse,
          location: transfer.sourceLocation
        }).sort({ createdAt: -1 }).session(session);

        const sourceStock = sourceLastEntry?.runningBalance || 0;

        if (sourceStock < quantityToTransfer) {
          throw new AppError(`Insufficient stock at source location`, 400);
        }

        const sourceBalance = sourceStock - quantityToTransfer;

        await StockLedger.create([{
          product: item.product,
          warehouse: transfer.sourceWarehouse,
          location: transfer.sourceLocation,
          quantity: -quantityToTransfer,
          runningBalance: sourceBalance,
          transactionType: 'transfer_out',
          referenceDoc: transfer.transferNumber,
          referenceId: transfer._id,
          performedBy: userId,
          notes: `Transfer to ${transfer.destinationLocation}`
        }], { session });

        // Add to destination
        const destLastEntry = await StockLedger.findOne({
          product: item.product,
          warehouse: transfer.destinationWarehouse,
          location: transfer.destinationLocation
        }).sort({ createdAt: -1 }).session(session);

        const destBalance = (destLastEntry?.runningBalance || 0) + quantityToTransfer;

        await StockLedger.create([{
          product: item.product,
          warehouse: transfer.destinationWarehouse,
          location: transfer.destinationLocation,
          quantity: quantityToTransfer,
          runningBalance: destBalance,
          transactionType: 'transfer_in',
          referenceDoc: transfer.transferNumber,
          referenceId: transfer._id,
          performedBy: userId,
          notes: `Transfer from ${transfer.sourceLocation}`
        }], { session });
      }

      transfer.status = 'done';
      transfer.completedDate = new Date();
      transfer.validatedBy = userId;
      await transfer.save({ session });

      await session.commitTransaction();
      
      return transfer.populate([
        'sourceWarehouse',
        'sourceLocation',
        'destinationWarehouse',
        'destinationLocation',
        'items.product'
      ]);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async cancelTransfer(transferId) {
    const transfer = await InternalTransfer.findById(transferId);
    
    if (!transfer) {
      throw new AppError('Transfer not found', 404);
    }

    if (transfer.status === 'done') {
      throw new AppError('Cannot cancel completed transfer', 400);
    }

    transfer.status = 'cancelled';
    await transfer.save();

    return transfer;
  }
}

export default new TransferService();
