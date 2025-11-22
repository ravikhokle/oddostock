import StockLedger from '../models/StockLedger.model.js';

export const getMoveHistory = async (req, res, next) => {
  try {
    const { product, warehouse, location, transactionType, startDate, endDate } = req.query;
    
    const query = {};
    
    if (product) query.product = product;
    if (warehouse) query.warehouse = warehouse;
    if (location) query.location = location;
    if (transactionType) query.transactionType = transactionType;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const history = await StockLedger.find(query)
      .populate(['product', 'warehouse', 'location', 'performedBy'])
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 100);

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

export const getProductMoveHistory = async (req, res, next) => {
  try {
    const history = await StockLedger.find({ product: req.params.productId })
      .populate(['warehouse', 'location', 'performedBy'])
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    next(error);
  }
};
