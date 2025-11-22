import Product from '../models/Product.model.js';
import StockLedger from '../models/StockLedger.model.js';
import { AppError } from '../middleware/errorHandler.js';

class ProductService {
  async createProduct(productData) {
    const product = await Product.create(productData);
    return product;
  }

  async getAllProducts(filters = {}) {
    const query = { isActive: true };
    
    if (filters.category) {
      query.category = filters.category;
    }
    
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { sku: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    // Get stock levels for each product
    const productsWithStock = await Promise.all(
      products.map(async (product) => {
        const stockByLocation = await StockLedger.aggregate([
          { $match: { product: product._id } },
          {
            $group: {
              _id: {
                warehouse: '$warehouse',
                location: '$location'
              },
              totalQuantity: { $sum: '$quantity' }
            }
          },
          {
            $lookup: {
              from: 'warehouses',
              localField: '_id.warehouse',
              foreignField: '_id',
              as: 'warehouseInfo'
            }
          },
          {
            $lookup: {
              from: 'locations',
              localField: '_id.location',
              foreignField: '_id',
              as: 'locationInfo'
            }
          }
        ]);

        const totalStock = stockByLocation.reduce((sum, item) => sum + item.totalQuantity, 0);

        return {
          ...product.toObject(),
          totalStock,
          stockByLocation
        };
      })
    );

    return productsWithStock;
  }

  async getProductById(productId) {
    const product = await Product.findById(productId).populate('category');
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Get stock details
    const stockByLocation = await StockLedger.aggregate([
      { $match: { product: product._id } },
      {
        $group: {
          _id: {
            warehouse: '$warehouse',
            location: '$location'
          },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      {
        $lookup: {
          from: 'warehouses',
          localField: '_id.warehouse',
          foreignField: '_id',
          as: 'warehouseInfo'
        }
      },
      {
        $lookup: {
          from: 'locations',
          localField: '_id.location',
          foreignField: '_id',
          as: 'locationInfo'
        }
      }
    ]);

    const totalStock = stockByLocation.reduce((sum, item) => sum + item.totalQuantity, 0);

    return {
      ...product.toObject(),
      totalStock,
      stockByLocation
    };
  }

  async updateProduct(productId, updates) {
    const product = await Product.findByIdAndUpdate(
      productId,
      updates,
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  }

  async deleteProduct(productId) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    return { message: 'Product deleted successfully' };
  }

  async getLowStockProducts() {
    const products = await Product.find({ isActive: true });
    
    const lowStockProducts = [];

    for (const product of products) {
      const stockAgg = await StockLedger.aggregate([
        { $match: { product: product._id } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]);

      const totalStock = stockAgg.length > 0 ? stockAgg[0].total : 0;

      if (totalStock <= product.reorderLevel) {
        lowStockProducts.push({
          ...product.toObject(),
          currentStock: totalStock
        });
      }
    }

    return lowStockProducts;
  }
}

export default new ProductService();
