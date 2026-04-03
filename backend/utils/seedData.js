require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Supplier = require('../models/Supplier');
const Alert = require('../models/Alert');

const suppliers = [
  { name: 'TechWorld Distributors', email: 'orders@techworld.com', phone: '+1-555-0101', address: '123 Silicon Ave, San Jose, CA', category: 'Electronics', rating: 4.8, status: 'active', productsSupplied: 45, totalOrders: 230 },
  { name: 'FootStep Wholesale', email: 'supply@footstep.com', phone: '+1-555-0102', address: '456 Shoe Lane, Portland, OR', category: 'Footwear', rating: 4.5, status: 'active', productsSupplied: 32, totalOrders: 180 },
  { name: 'HomeLife Supplies', email: 'info@homelife.com', phone: '+1-555-0103', address: '789 Living Blvd, Chicago, IL', category: 'Appliances', rating: 4.2, status: 'active', productsSupplied: 28, totalOrders: 145 },
  { name: 'FitGear Pro', email: 'bulk@fitgear.com', phone: '+1-555-0104', address: '321 Sport St, Denver, CO', category: 'Fitness', rating: 4.6, status: 'active', productsSupplied: 18, totalOrders: 95 },
  { name: 'AccessoMax', email: 'sales@accessomax.com', phone: '+1-555-0105', address: '654 Fashion Ave, New York, NY', category: 'Accessories', rating: 4.0, status: 'active', productsSupplied: 55, totalOrders: 310 },
];

const products = [
  { name: 'Wireless Headphones Pro', category: 'Electronics', price: 299.99, stock: 45, threshold: 10, supplier: 'TechWorld Distributors', sku: 'EL-WHP-001' },
  { name: 'Smartphone Stand Deluxe', category: 'Electronics', price: 49.99, stock: 8, threshold: 15, supplier: 'TechWorld Distributors', sku: 'EL-SSD-002' },
  { name: 'Bluetooth Speaker Mini', category: 'Electronics', price: 89.99, stock: 32, threshold: 10, supplier: 'TechWorld Distributors', sku: 'EL-BSM-003' },
  { name: 'USB-C Hub 7-in-1', category: 'Electronics', price: 59.99, stock: 0, threshold: 5, supplier: 'TechWorld Distributors', sku: 'EL-UHB-004' },
  { name: 'Running Shoes Elite', category: 'Footwear', price: 129.99, stock: 67, threshold: 20, supplier: 'FootStep Wholesale', sku: 'FW-RSE-001' },
  { name: 'Trail Boots Waterproof', category: 'Footwear', price: 189.99, stock: 5, threshold: 15, supplier: 'FootStep Wholesale', sku: 'FW-TBW-002' },
  { name: 'Casual Sneakers Urban', category: 'Footwear', price: 79.99, stock: 112, threshold: 25, supplier: 'FootStep Wholesale', sku: 'FW-CSU-003' },
  { name: 'Coffee Maker Smart', category: 'Appliances', price: 199.99, stock: 23, threshold: 8, supplier: 'HomeLife Supplies', sku: 'AP-CMS-001' },
  { name: 'Air Purifier HEPA', category: 'Appliances', price: 249.99, stock: 12, threshold: 5, supplier: 'HomeLife Supplies', sku: 'AP-APH-002' },
  { name: 'Blender Pro 1200W', category: 'Appliances', price: 149.99, stock: 3, threshold: 8, supplier: 'HomeLife Supplies', sku: 'AP-BP1-003' },
  { name: 'Yoga Mat Premium', category: 'Fitness', price: 59.99, stock: 88, threshold: 20, supplier: 'FitGear Pro', sku: 'FT-YMP-001' },
  { name: 'Resistance Band Set', category: 'Fitness', price: 29.99, stock: 156, threshold: 30, supplier: 'FitGear Pro', sku: 'FT-RBS-002' },
  { name: 'Dumbbells Adjustable 20kg', category: 'Fitness', price: 119.99, stock: 7, threshold: 10, supplier: 'FitGear Pro', sku: 'FT-DA2-003' },
  { name: 'Leather Wallet Slim', category: 'Accessories', price: 39.99, stock: 245, threshold: 50, supplier: 'AccessoMax', sku: 'AC-LWS-001' },
  { name: 'Sunglasses Polarized UV400', category: 'Accessories', price: 89.99, stock: 34, threshold: 15, supplier: 'AccessoMax', sku: 'AC-SPU-002' },
];

const generateOrders = (productDocs) => {
  const customers = [
    'Alice Johnson', 'Bob Martinez', 'Carol White', 'David Lee',
    'Emma Davis', 'Frank Miller', 'Grace Wilson', 'Henry Taylor',
    'Isabella Anderson', 'James Thomas',
  ];
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'delivered', 'delivered'];
  const orders = [];

  for (let i = 0; i < 30; i++) {
    const customer = customers[i % customers.length];
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items = [];
    let total = 0;

    for (let j = 0; j < numItems; j++) {
      const product = productDocs[Math.floor(Math.random() * productDocs.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const price = product.price;
      items.push({ product: product._id, productName: product.name, quantity, price });
      total += price * quantity;
    }

    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    orders.push({
      orderId: `ORD-${String(i + 1).padStart(4, '0')}`,
      customer,
      email: `${customer.split(' ')[0].toLowerCase()}@example.com`,
      items,
      total: Math.round(total * 100) / 100,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      date,
    });
  }
  return orders;
};

const generateAlerts = (productDocs) => {
  const alerts = [];
  productDocs.forEach((p) => {
    if (p.stock === 0) {
      alerts.push({
        type: 'danger',
        title: 'Out of Stock',
        message: `${p.name} is completely out of stock!`,
        product: p._id,
        read: false,
      });
    } else if (p.stock <= p.threshold) {
      alerts.push({
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${p.name} has only ${p.stock} units remaining (threshold: ${p.threshold})`,
        product: p._id,
        read: false,
      });
    }
  });
  alerts.push({
    type: 'info',
    title: 'System Ready',
    message: 'Smart Stock Inventory system is up and running',
    read: true,
  });
  return alerts;
};

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding database...');

    // Clean collections
    await Promise.all([
      Product.deleteMany({}),
      Order.deleteMany({}),
      Supplier.deleteMany({}),
      Alert.deleteMany({}),
    ]);
    console.log('✅ Cleared existing data');

    // Insert suppliers
    const supplierDocs = await Supplier.insertMany(suppliers);
    console.log(`✅ Inserted ${supplierDocs.length} suppliers`);

    // Insert products
    const productDocs = await Product.insertMany(products);
    console.log(`✅ Inserted ${productDocs.length} products`);

    // Insert orders
    const orderData = generateOrders(productDocs);
    const orderDocs = await Order.insertMany(orderData);
    console.log(`✅ Inserted ${orderDocs.length} orders`);

    // Insert alerts
    const alertData = generateAlerts(productDocs);
    const alertDocs = await Alert.insertMany(alertData);
    console.log(`✅ Inserted ${alertDocs.length} alerts`);

    console.log('\n🎉 Database seeded successfully!');
    console.log(`   📦 Products: ${productDocs.length}`);
    console.log(`   🛒 Orders: ${orderDocs.length}`);
    console.log(`   🏭 Suppliers: ${supplierDocs.length}`);
    console.log(`   🔔 Alerts: ${alertDocs.length}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedDatabase();
