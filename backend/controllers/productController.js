const Product = require('../models/Product');
const Alert = require('../models/Alert');

// Helper to emit socket alert
const emitAlert = (io, alert) => {
  if (io) io.emit('new_alert', alert);
};

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) query.category = category;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Product.countDocuments(query),
    ]);

    res.json({ success: true, data: products, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/:id
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/products
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    // Emit socket event
    const io = req.app.get('io');
    io && io.emit('product_created', product);

    // Check if new product is already low stock
    if (product.stock <= product.threshold) {
      const alert = await Alert.create({
        type: 'warning',
        title: 'Low Stock on New Product',
        message: `${product.name} was added with low stock: ${product.stock} units`,
        product: product._id,
      });
      emitAlert(io, alert);
    }

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const oldProduct = await Product.findById(req.params.id);
    if (!oldProduct) return res.status(404).json({ success: false, message: 'Product not found' });

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    const io = req.app.get('io');
    io && io.emit('product_updated', product);

    // Check low stock threshold crossing
    if (product.stock <= product.threshold && oldProduct.stock > oldProduct.threshold) {
      const alert = await Alert.create({
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${product.name} is running low: only ${product.stock} units remaining`,
        product: product._id,
      });
      emitAlert(io, alert);
    }

    // Check out of stock
    if (product.stock === 0 && oldProduct.stock > 0) {
      const alert = await Alert.create({
        type: 'danger',
        title: 'Out of Stock',
        message: `${product.name} is now out of stock!`,
        product: product._id,
      });
      emitAlert(io, alert);
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const io = req.app.get('io');
    io && io.emit('product_deleted', { id: req.params.id });

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/stats
const getProductStats = async (req, res) => {
  try {
    const [total, lowStock, outOfStock, categories] = await Promise.all([
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({ $expr: { $and: [{ $lte: ['$stock', '$threshold'] }, { $gt: ['$stock', 0] }] } }),
      Product.countDocuments({ stock: 0 }),
      Product.distinct('category'),
    ]);
    res.json({ success: true, data: { total, lowStock, outOfStock, categories: categories.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getProductStats };
