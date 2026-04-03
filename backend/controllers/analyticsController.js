const Order = require('../models/Order');
const Product = require('../models/Product');

// GET /api/analytics/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalProducts,
      totalOrders,
      lowStockProducts,
      revenueResult,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      Product.countDocuments({ status: 'active' }),
      Order.countDocuments(),
      Product.countDocuments({
        $expr: { $lte: ['$stock', '$threshold'] },
      }),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.find().sort({ createdAt: -1 }).limit(5),
      Product.find({ status: 'active' }).sort({ stock: 1 }).limit(5),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        lowStockProducts,
        totalRevenue,
        recentOrders,
        topProducts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/sales
const getSalesData = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    let groupId;

    if (period === 'daily') {
      groupId = {
        year: { $year: '$date' },
        month: { $month: '$date' },
        day: { $dayOfMonth: '$date' },
      };
    } else if (period === 'weekly') {
      groupId = {
        year: { $year: '$date' },
        week: { $week: '$date' },
      };
    } else {
      groupId = {
        year: { $year: '$date' },
        month: { $month: '$date' },
      };
    }

    const salesData = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: groupId,
          sales: { $sum: '$total' },
          orders: { $sum: 1 },
          profit: { $sum: { $multiply: ['$total', 0.25] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      { $limit: 12 },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const formatted = salesData.map((item) => ({
      name: period === 'monthly'
        ? monthNames[(item._id.month - 1)] + ' ' + item._id.year
        : period === 'weekly'
        ? `Week ${item._id.week}`
        : `${item._id.day}/${item._id.month}`,
      sales: Math.round(item.sales),
      profit: Math.round(item.profit),
      orders: item.orders,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/categories
const getCategoryStats = async (req, res) => {
  try {
    const categoryData = await Product.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          avgPrice: { $avg: '$price' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const formatted = categoryData.map((item) => ({
      name: item._id,
      value: item.count,
      stock: item.totalStock,
      avgPrice: Math.round(item.avgPrice * 100) / 100,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/inventory
const getInventoryAnalytics = async (req, res) => {
  try {
    const [stockDistribution, lowStockItems, outOfStockItems, totalValue] = await Promise.all([
      Product.aggregate([
        {
          $group: {
            _id: null,
            inStock: {
              $sum: { $cond: [{ $gt: ['$stock', '$threshold'] }, 1, 0] },
            },
            lowStock: {
              $sum: {
                $cond: [
                  { $and: [{ $lte: ['$stock', '$threshold'] }, { $gt: ['$stock', 0] }] },
                  1,
                  0,
                ],
              },
            },
            outOfStock: {
              $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] },
            },
          },
        },
      ]),
      Product.find({
        $expr: { $and: [{ $lte: ['$stock', '$threshold'] }, { $gt: ['$stock', 0] }] },
      }).sort({ stock: 1 }).limit(10),
      Product.find({ stock: 0 }).limit(10),
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalValue: { $sum: { $multiply: ['$stock', '$price'] } },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        stockDistribution: stockDistribution[0] || { inStock: 0, lowStock: 0, outOfStock: 0 },
        lowStockItems,
        outOfStockItems,
        totalInventoryValue: totalValue[0]?.totalValue || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats, getSalesData, getCategoryStats, getInventoryAnalytics };
