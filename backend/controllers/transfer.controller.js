import transferService from '../services/transfer.service.js';

export const createTransfer = async (req, res, next) => {
  try {
    const transfer = await transferService.createTransfer(req.body, req.user._id);
    
    const io = req.app.get('io');
    io.emit('transfer:created', transfer);

    res.status(201).json({
      success: true,
      message: 'Transfer created successfully',
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

export const getAllTransfers = async (req, res, next) => {
  try {
    const transfers = await transferService.getAllTransfers(req.query);
    res.status(200).json({
      success: true,
      count: transfers.length,
      data: transfers
    });
  } catch (error) {
    next(error);
  }
};

export const getTransferById = async (req, res, next) => {
  try {
    const transfer = await transferService.getTransferById(req.params.id);
    res.status(200).json({
      success: true,
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

export const updateTransfer = async (req, res, next) => {
  try {
    const transfer = await transferService.updateTransfer(req.params.id, req.body);
    
    const io = req.app.get('io');
    io.emit('transfer:updated', transfer);

    res.status(200).json({
      success: true,
      message: 'Transfer updated successfully',
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

export const validateTransfer = async (req, res, next) => {
  try {
    const transfer = await transferService.validateTransfer(req.params.id, req.user._id);
    
    const io = req.app.get('io');
    io.emit('transfer:validated', transfer);
    io.emit('stock:updated');

    res.status(200).json({
      success: true,
      message: 'Transfer validated successfully',
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

export const cancelTransfer = async (req, res, next) => {
  try {
    const transfer = await transferService.cancelTransfer(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Transfer cancelled successfully',
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};
