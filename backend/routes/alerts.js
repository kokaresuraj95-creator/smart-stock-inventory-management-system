const express = require('express');
const router = express.Router();
const {
  getAlerts,
  markAlertRead,
  markAllAlertsRead,
  deleteAlert,
  createAlert,
} = require('../controllers/alertController');

router.get('/', getAlerts);
router.post('/', createAlert);
router.put('/read-all', markAllAlertsRead);
router.put('/:id/read', markAlertRead);
router.delete('/:id', deleteAlert);

module.exports = router;
