import Product from '../models/Product.model.js';
import Receipt from '../models/Receipt.model.js';
import Delivery from '../models/Delivery.model.js';
import InternalTransfer from '../models/InternalTransfer.model.js';
import StockLedger from '../models/StockLedger.model.js';

class DashboardService {
  async getDashboardKPIs(filters = {}) {
    // Compute only the KPIs requested: total products, out-of-stock, pending receipts, pending deliveries, scheduled transfers
    const totalProducts = await Product.countDocuments({ isActive: true });

    // Compute out of stock count efficiently by aggregating stockledger sums per product
    const stockAgg = await StockLedger.aggregate([
      {
        $group: {
          _id: '$product',
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    const stockMap = new Map();
    stockAgg.forEach(item => stockMap.set(String(item._id), item.totalQuantity));

    const products = await Product.find({ isActive: true }).select('_id initialStock');

    let outOfStockCount = 0;
    for (const product of products) {
      const ledgerQty = stockMap.get(String(product._id)) || 0;
      const totalQty = (product.initialStock || 0) + ledgerQty;
      if (totalQty <= 0) outOfStockCount++;
    }

    const pendingReceipts = await Receipt.countDocuments({ status: { $in: ['draft', 'waiting', 'ready'] } });
    const pendingDeliveries = await Delivery.countDocuments({ status: { $in: ['draft', 'waiting', 'picking', 'packing', 'ready'] } });
    const scheduledTransfers = await InternalTransfer.countDocuments({ status: { $in: ['draft', 'waiting', 'in_transit'] } });

    return {
      totalProducts,
      outOfStockItems: outOfStockCount,
      pendingReceipts,
      pendingDeliveries,
      scheduledTransfers
    };
  }

  async getTotalStockValue() {
    const products = await Product.find({ isActive: true });
    let totalValue = 0;

    for (const product of products) {
      const stockAgg = await StockLedger.aggregate([
        { $match: { product: product._id } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]);

      const totalStock = stockAgg.length > 0 ? stockAgg[0].total : 0;
      totalValue += totalStock * product.cost;
    }

    return totalValue;
  }

  async getInventorySummary() {
    const products = await Product.countDocuments({ isActive: true });
    const categories = await Product.distinct('category');
    
    // Get unique suppliers from receipts
    const receipts = await Receipt.find({ status: 'done' }).distinct('supplier.name');

    return {
      quantityInHand: await this.getTotalQuantityInHand(),
      toBeReceived: await this.getToBeReceived(),
      numberOfSuppliers: receipts.length,
      numberOfCategories: categories.length
    };
  }

  async getTotalQuantityInHand() {
    const result = await StockLedger.aggregate([
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    return result.length > 0 ? result[0].total : 0;
  }

  async getToBeReceived() {
    const pendingReceipts = await Receipt.find({
      status: { $in: ['draft', 'waiting', 'ready'] }
    });

    let total = 0;
    for (const receipt of pendingReceipts) {
      for (const item of receipt.items) {
        total += item.quantityOrdered - item.quantityReceived;
      }
    }

    return total;
  }

  async getSalesAndPurchaseChart(period = 'monthly') {
    // Get data for last 12 months
    const data = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const sales = await Delivery.aggregate([
        {
          $match: {
            status: 'done',
            deliveredDate: { $gte: monthStart, $lte: monthEnd }
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $reduce: {
                  input: '$items',
                  initialValue: 0,
                  in: {
                    $add: ['$$value', { $multiply: ['$$this.quantityDelivered', '$$this.unitPrice'] }]
                  }
                }
              }
            }
          }
        }
      ]);

      const purchases = await Receipt.aggregate([
        {
          $match: {
            status: 'done',
            receivedDate: { $gte: monthStart, $lte: monthEnd }
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $reduce: {
                  input: '$items',
                  initialValue: 0,
                  in: {
                    $add: ['$$value', { $multiply: ['$$this.quantityReceived', '$$this.unitPrice'] }]
                  }
                }
              }
            }
          }
        }
      ]);

      data.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        sales: sales[0]?.total || 0,
        purchases: purchases[0]?.total || 0
      });
    }

    return data;
  }
}

export default new DashboardService();
