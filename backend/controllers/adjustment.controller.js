import adjustmentService from '../services/adjustment.service.js';

export const createAdjustment = async (req, res, next) => {
  try {
    const adjustment = await adjustmentService.createAdjustment(req.body, req.user._id);
    
    const io = req.app.get('io');
    io.emit('adjustment:created', adjustment);

    res.status(201).json({
      success: true,
      message: 'Adjustment created successfully',
      data: adjustment
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAdjustments = async (req, res, next) => {
  try {
    const adjustments = await adjustmentService.getAllAdjustments(req.query);
    res.status(200).json({
      success: true,
      count: adjustments.length,
      data: adjustments
    });
  } catch (error) {
    next(error);
  }
};

export const getAdjustmentById = async (req, res, next) => {
  try {
    const adjustment = await adjustmentService.getAdjustmentById(req.params.id);
    res.status(200).json({
      success: true,
      data: adjustment
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdjustment = async (req, res, next) => {
  try {
    const adjustment = await adjustmentService.updateAdjustment(req.params.id, req.body);
    
    const io = req.app.get('io');
    io.emit('adjustment:updated', adjustment);

    res.status(200).json({
      success: true,
      message: 'Adjustment updated successfully',
      data: adjustment
    });
  } catch (error) {
    next(error);
  }
};

export const validateAdjustment = async (req, res, next) => {
  try {
    const adjustment = await adjustmentService.validateAdjustment(req.params.id, req.user._id);
    
    const io = req.app.get('io');
    io.emit('adjustment:validated', adjustment);
    io.emit('stock:updated');

    res.status(200).json({
      success: true,
      message: 'Adjustment validated successfully',
      data: adjustment
    });
  } catch (error) {
    next(error);
  }
};

export const cancelAdjustment = async (req, res, next) => {
  try {
    const adjustment = await adjustmentService.cancelAdjustment(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Adjustment cancelled successfully',
      data: adjustment
    });
  } catch (error) {
    next(error);
  }
};
