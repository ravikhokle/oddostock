import Product from '../models/Product.model.js';
import Receipt from '../models/Receipt.model.js';
import Delivery from '../models/Delivery.model.js';
import InternalTransfer from '../models/InternalTransfer.model.js';
import StockLedger from '../models/StockLedger.model.js';

class DashboardService {
  async getDashboardKPIs(filters = {}) {
    // Total Products in Stock
    const totalProducts = await Product.countDocuments({ isActive: true });

    // Low Stock / Out of Stock Items
    const products = await Product.find({ isActive: true });
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const product of products) {
      const stockAgg = await StockLedger.aggregate([
        { $match: { product: product._id } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]);

      const totalStock = stockAgg.length > 0 ? stockAgg[0].total : 0;

      if (totalStock === 0) {
        outOfStockCount++;
      } else if (totalStock <= product.reorderLevel) {
        lowStockCount++;
      }
    }

    // Pending Receipts
    const pendingReceipts = await Receipt.countDocuments({
      status: { $in: ['draft', 'waiting', 'ready'] }
    });

    // Pending Deliveries
    const pendingDeliveries = await Delivery.countDocuments({
      status: { $in: ['draft', 'waiting', 'picking', 'packing', 'ready'] }
    });

    // Internal Transfers Scheduled
    const scheduledTransfers = await InternalTransfer.countDocuments({
      status: { $in: ['draft', 'waiting', 'in_transit'] }
    });

    // Total Stock Value
    const stockValue = await this.getTotalStockValue();

    // Recent Activities
    const recentActivities = await StockLedger.find()
      .populate(['product', 'warehouse', 'location', 'performedBy'])
      .sort({ createdAt: -1 })
      .limit(10);

    // Sales & Purchase Overview (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesData = await Delivery.aggregate([
      {
        $match: {
          status: 'done',
          deliveredDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $multiply: ['$$this.quantityDelivered', '$$this.unitPrice'] }
                  ]
                }
              }
            }
          }
        }
      }
    ]);

    const purchaseData = await Receipt.aggregate([
      {
        $match: {
          status: 'done',
          receivedDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          totalCost: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $multiply: ['$$this.quantityReceived', '$$this.unitPrice'] }
                  ]
                }
              }
            }
          }
        }
      }
    ]);

    return {
      totalProducts,
      lowStockItems: lowStockCount,
      outOfStockItems: outOfStockCount,
      pendingReceipts,
      pendingDeliveries,
      scheduledTransfers,
      stockValue,
      sales: salesData[0] || { totalSales: 0, totalRevenue: 0 },
      purchase: purchaseData[0] || { totalPurchases: 0, totalCost: 0 },
      profit: (salesData[0]?.totalRevenue || 0) - (purchaseData[0]?.totalCost || 0),
      recentActivities
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
