const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getSalesData,
  getCategoryStats,
  getInventoryAnalytics,
} = require('../controllers/analyticsController');

router.get('/dashboard', getDashboardStats);
router.get('/sales', getSalesData);
router.get('/categories', getCategoryStats);
router.get('/inventory', getInventoryAnalytics);

module.exports = router;
