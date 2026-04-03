const Order = require('../models/Order');
const Product = require('../models/Product');
const Alert = require('../models/Alert');

// GET /api/orders
const getOrders = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { customer: { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Order.countDocuments(query),
    ]);

    res.json({ success: true, data: orders, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/:id
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/orders
const createOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);

    // Reduce stock for each product in the order
    for (const item of order.items) {
      if (item.product) {
        const product = await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );

        // Check if stock went low after order
        if (product && product.stock <= product.threshold) {
          const io = req.app.get('io');
          const alert = await Alert.create({
            type: product.stock === 0 ? 'danger' : 'warning',
            title: product.stock === 0 ? 'Out of Stock' : 'Low Stock Alert',
            message: `${product.name} stock is now ${product.stock} units after order ${order.orderId}`,
            product: product._id,
            order: order._id,
          });
          io && io.emit('new_alert', alert);
          io && io.emit('product_updated', product);
        }
      }
    }

    const io = req.app.get('io');
    io && io.emit('order_created', order);

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/orders/:id
const updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const io = req.app.get('io');
    io && io.emit('order_updated', order);

    // Alert on status change to delivered/cancelled
    if (req.body.status === 'delivered') {
      const alert = await Alert.create({
        type: 'success',
        title: 'Order Delivered',
        message: `Order ${order.orderId} for ${order.customer} has been delivered`,
        order: order._id,
      });
      io && io.emit('new_alert', alert);
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/orders/:id
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const io = req.app.get('io');
    io && io.emit('order_deleted', { id: req.params.id });
    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/stats
const getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
    ]);

    const totalRevenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]);

    const result = {
      total: 0,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      revenue: totalRevenue[0]?.total || 0,
    };

    stats.forEach((s) => {
      result[s._id] = s.count;
      result.total += s.count;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getOrders, getOrder, createOrder, updateOrder, deleteOrder, getOrderStats };
