const Alert = require('../models/Alert');

// GET /api/alerts
const getAlerts = async (req, res) => {
  try {
    const { read, type, limit = 50 } = req.query;
    const query = {};
    if (read !== undefined) query.read = read === 'true';
    if (type) query.type = type;

    const alerts = await Alert.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .populate('product', 'name')
      .populate('order', 'orderId customer');

    const unreadCount = await Alert.countDocuments({ read: false });

    res.json({ success: true, data: alerts, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/alerts/:id/read
const markAlertRead = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

    const io = req.app.get('io');
    io && io.emit('alert_read', { id: alert._id });

    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/alerts/read-all
const markAllAlertsRead = async (req, res) => {
  try {
    await Alert.updateMany({ read: false }, { read: true });

    const io = req.app.get('io');
    io && io.emit('alerts_all_read');

    res.json({ success: true, message: 'All alerts marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/alerts/:id
const deleteAlert = async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Alert deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/alerts  (create manual alert)
const createAlert = async (req, res) => {
  try {
    const alert = await Alert.create(req.body);
    const io = req.app.get('io');
    io && io.emit('new_alert', alert);
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getAlerts, markAlertRead, markAllAlertsRead, deleteAlert, createAlert };
