import receiptService from '../services/receipt.service.js';

export const createReceipt = async (req, res, next) => {
  try {
    const receipt = await receiptService.createReceipt(req.body, req.user._id);
    
    // Emit socket event
    const io = req.app.get('io');
    io.emit('receipt:created', receipt);

    res.status(201).json({
      success: true,
      message: 'Receipt created successfully',
      data: receipt
    });
  } catch (error) {
    next(error);
  }
};

export const getAllReceipts = async (req, res, next) => {
  try {
    const receipts = await receiptService.getAllReceipts(req.query);
    res.status(200).json({
      success: true,
      count: receipts.length,
      data: receipts
    });
  } catch (error) {
    next(error);
  }
};

export const getReceiptById = async (req, res, next) => {
  try {
    const receipt = await receiptService.getReceiptById(req.params.id);
    res.status(200).json({
      success: true,
      data: receipt
    });
  } catch (error) {
    next(error);
  }
};

export const updateReceipt = async (req, res, next) => {
  try {
    const receipt = await receiptService.updateReceipt(req.params.id, req.body);
    
    const io = req.app.get('io');
    io.emit('receipt:updated', receipt);

    res.status(200).json({
      success: true,
      message: 'Receipt updated successfully',
      data: receipt
    });
  } catch (error) {
    next(error);
  }
};

export const validateReceipt = async (req, res, next) => {
  try {
    const receipt = await receiptService.validateReceipt(req.params.id, req.user._id);
    
    const io = req.app.get('io');
    io.emit('receipt:validated', receipt);
    io.emit('stock:updated');

    res.status(200).json({
      success: true,
      message: 'Receipt validated successfully',
      data: receipt
    });
  } catch (error) {
    next(error);
  }
};

export const cancelReceipt = async (req, res, next) => {
  try {
    const receipt = await receiptService.cancelReceipt(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Receipt cancelled successfully',
      data: receipt
    });
  } catch (error) {
    next(error);
  }
};
