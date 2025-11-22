import Warehouse from '../models/Warehouse.model.js';
import Location from '../models/Location.model.js';
import { AppError } from '../middleware/errorHandler.js';

export const createWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      data: warehouse
    });
  } catch (error) {
    next(error);
  }
};

export const getAllWarehouses = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: warehouses.length,
      data: warehouses
    });
  } catch (error) {
    next(error);
  }
};

export const getWarehouseById = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return next(new AppError('Warehouse not found', 404));
    }

    // Get locations for this warehouse
    const locations = await Location.find({ warehouse: warehouse._id, isActive: true });

    res.status(200).json({
      success: true,
      data: { ...warehouse.toObject(), locations }
    });
  } catch (error) {
    next(error);
  }
};

export const updateWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!warehouse) {
      return next(new AppError('Warehouse not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Warehouse updated successfully',
      data: warehouse
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return next(new AppError('Warehouse not found', 404));
    }

    warehouse.isActive = false;
    await warehouse.save();

    res.status(200).json({
      success: true,
      message: 'Warehouse deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Location operations
export const createLocation = async (req, res, next) => {
  try {
    const location = await Location.create(req.body);
    await location.populate('warehouse');
    
    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: location
    });
  } catch (error) {
    next(error);
  }
};

export const getLocationsByWarehouse = async (req, res, next) => {
  try {
    const locations = await Location.find({
      warehouse: req.params.warehouseId,
      isActive: true
    }).populate('warehouse');

    res.status(200).json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (error) {
    next(error);
  }
};
