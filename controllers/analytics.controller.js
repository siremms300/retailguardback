// // server/controllers/analytics.controller.js
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');

const getDashboardStats = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const todayTransactions = await Transaction.find({
      businessId: req.user.businessId,
      createdAt: { $gte: startOfDay }
    });
    
    const todaySales = todayTransactions.reduce((sum, t) => sum + t.total, 0);
    
    const lowStockProducts = await Product.countDocuments({
      businessId: req.user.businessId,
      'stock.current': { $lte: '$stock.minimumThreshold' },
      isActive: true
    });
    
    res.json({
      success: true,
      todaySales,
      transactions: todayTransactions.length,
      lowStock: lowStockProducts,
      pendingReconciliation: false
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {
      businessId: req.user.businessId,
      status: 'completed'
    };
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const transactions = await Transaction.find(query);
    
    const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
    const averageTicket = totalSales / transactions.length || 0;
    
    res.json({
      success: true,
      report: {
        totalSales,
        transactionCount: transactions.length,
        averageTicket,
        transactions
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLeakageAnalysis = async (req, res) => {
  try {
    // This would contain complex analytics
    res.json({
      success: true,
      riskScore: 25,
      areas: [
        { area: 'cash_handling', score: 20, risk: 'low' },
        { area: 'inventory', score: 30, risk: 'medium' },
        { area: 'staff_behavior', score: 15, risk: 'low' }
      ]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getSalesReport,
  getLeakageAnalysis
};