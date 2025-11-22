import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import Category from '../models/Category.model.js';
import Warehouse from '../models/Warehouse.model.js';
import Location from '../models/Location.model.js';
import Product from '../models/Product.model.js';
import Receipt from '../models/Receipt.model.js';
import StockLedger from '../models/StockLedger.model.js';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Warehouse.deleteMany({}),
      Location.deleteMany({}),
      Product.deleteMany({}),
      Receipt.deleteMany({}),
      StockLedger.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    // Create Users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@stockmaster.com',
      password: 'password123',
      role: 'admin'
    });

    const manager = await User.create({
      name: 'Manager User',
      email: 'manager@stockmaster.com',
      password: 'password123',
      role: 'manager'
    });

    console.log('👤 Created users');

    // Create Categories
    const electronicsCategory = await Category.create({
      name: 'Electronics',
      description: 'Electronic items and gadgets'
    });

    const furnitureCategory = await Category.create({
      name: 'Furniture',
      description: 'Office and home furniture'
    });

    const stationeryCategory = await Category.create({
      name: 'Stationery',
      description: 'Office supplies and stationery'
    });

    console.log('📁 Created categories');

    // Create Warehouses
    const mainWarehouse = await Warehouse.create({
      name: 'Main Warehouse',
      code: 'WH-MAIN',
      address: {
        street: '123 Industrial Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India'
      }
    });

    const secondaryWarehouse = await Warehouse.create({
      name: 'Secondary Warehouse',
      code: 'WH-SEC',
      address: {
        street: '456 Storage Lane',
        city: 'Delhi',
        state: 'Delhi',
        zipCode: '110001',
        country: 'India'
      }
    });

    console.log('🏭 Created warehouses');

    // Create Locations
    const mainStorage = await Location.create({
      name: 'Main Storage',
      warehouse: mainWarehouse._id,
      type: 'storage'
    });

    const productionFloor = await Location.create({
      name: 'Production Floor',
      warehouse: mainWarehouse._id,
      type: 'production'
    });

    const secondaryStorage = await Location.create({
      name: 'Secondary Storage',
      warehouse: secondaryWarehouse._id,
      type: 'storage'
    });

    console.log('📍 Created locations');

    // Create Products
    const products = await Product.create([
      {
        name: 'Laptop Dell XPS 15',
        sku: 'ELEC-001',
        category: electronicsCategory._id,
        description: 'High-performance laptop',
        unitOfMeasure: 'pcs',
        cost: 80000,
        price: 95000,
        reorderLevel: 5,
        reorderQuantity: 10
      },
      {
        name: 'Office Chair Premium',
        sku: 'FURN-001',
        category: furnitureCategory._id,
        description: 'Ergonomic office chair',
        unitOfMeasure: 'pcs',
        cost: 8000,
        price: 12000,
        reorderLevel: 10,
        reorderQuantity: 20
      },
      {
        name: 'A4 Paper Box',
        sku: 'STAT-001',
        category: stationeryCategory._id,
        description: 'Premium A4 paper 500 sheets',
        unitOfMeasure: 'box',
        cost: 200,
        price: 300,
        reorderLevel: 50,
        reorderQuantity: 100
      },
      {
        name: 'Wireless Mouse',
        sku: 'ELEC-002',
        category: electronicsCategory._id,
        description: 'Wireless optical mouse',
        unitOfMeasure: 'pcs',
        cost: 500,
        price: 800,
        reorderLevel: 20,
        reorderQuantity: 50
      },
      {
        name: 'Standing Desk',
        sku: 'FURN-002',
        category: furnitureCategory._id,
        description: 'Adjustable standing desk',
        unitOfMeasure: 'pcs',
        cost: 15000,
        price: 20000,
        reorderLevel: 3,
        reorderQuantity: 5
      }
    ]);

    console.log('📦 Created products');

    // Create initial stock via receipts
    for (const product of products) {
      const receipt = await Receipt.create({
        supplier: {
          name: 'Sample Supplier Ltd',
          contact: '+91 9876543210',
          email: 'supplier@example.com'
        },
        warehouse: mainWarehouse._id,
        location: mainStorage._id,
        items: [{
          product: product._id,
          quantityOrdered: 100,
          quantityReceived: 100,
          unitPrice: product.cost
        }],
        status: 'done',
        expectedDate: new Date(),
        receivedDate: new Date(),
        createdBy: admin._id,
        validatedBy: admin._id
      });

      // Create stock ledger entry
      await StockLedger.create({
        product: product._id,
        warehouse: mainWarehouse._id,
        location: mainStorage._id,
        quantity: 100,
        runningBalance: 100,
        transactionType: 'receipt',
        referenceDoc: receipt.receiptNumber,
        referenceId: receipt._id,
        performedBy: admin._id,
        notes: 'Initial stock'
      });
    }

    console.log('📊 Created initial stock');

    console.log('\n✨ Seed data created successfully!\n');
    console.log('Login credentials:');
    console.log('Admin: admin@stockmaster.com / password123');
    console.log('Manager: manager@stockmaster.com / password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();
