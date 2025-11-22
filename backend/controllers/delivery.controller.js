import deliveryService from '../services/delivery.service.js';

export const createDelivery = async (req, res, next) => {
  try {
    const delivery = await deliveryService.createDelivery(req.body, req.user._id);
    
    const io = req.app.get('io');
    io.emit('delivery:created', delivery);

    res.status(201).json({
      success: true,
      message: 'Delivery created successfully',
      data: delivery
    });
  } catch (error) {
    next(error);
  }
};

export const getAllDeliveries = async (req, res, next) => {
  try {
    const deliveries = await deliveryService.getAllDeliveries(req.query);
    res.status(200).json({
      success: true,
      count: deliveries.length,
      data: deliveries
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryById = async (req, res, next) => {
  try {
    const delivery = await deliveryService.getDeliveryById(req.params.id);
    res.status(200).json({
      success: true,
      data: delivery
    });
  } catch (error) {
    next(error);
  }
};

export const updateDelivery = async (req, res, next) => {
  try {
    const delivery = await deliveryService.updateDelivery(req.params.id, req.body);
    
    const io = req.app.get('io');
    io.emit('delivery:updated', delivery);

    res.status(200).json({
      success: true,
      message: 'Delivery updated successfully',
      data: delivery
    });
  } catch (error) {
    next(error);
  }
};

export const pickItems = async (req, res, next) => {
  try {
    const delivery = await deliveryService.pickItems(req.params.id, req.body.items, req.user._id);
    
    const io = req.app.get('io');
    io.emit('delivery:picked', delivery);

    res.status(200).json({
      success: true,
      message: 'Items picked successfully',
      data: delivery
    });
  } catch (error) {
    next(error);
  }
};

export const packItems = async (req, res, next) => {
  try {
    const delivery = await deliveryService.packItems(req.params.id, req.body.items, req.user._id);
    
    const io = req.app.get('io');
    io.emit('delivery:packed', delivery);

    res.status(200).json({
      success: true,
      message: 'Items packed successfully',
      data: delivery
    });
  } catch (error) {
    next(error);
  }
};

export const validateDelivery = async (req, res, next) => {
  try {
    const delivery = await deliveryService.validateDelivery(req.params.id, req.user._id);
    
    const io = req.app.get('io');
    io.emit('delivery:validated', delivery);
    io.emit('stock:updated');

    res.status(200).json({
      success: true,
      message: 'Delivery validated successfully',
      data: delivery
    });
  } catch (error) {
    next(error);
  }
};

export const cancelDelivery = async (req, res, next) => {
  try {
    const delivery = await deliveryService.cancelDelivery(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Delivery cancelled successfully',
      data: delivery
    });
  } catch (error) {
    next(error);
  }
};
