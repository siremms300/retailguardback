const Transaction = require('../models/Transaction');

const runReconciliation = async (req, res) => {
  try {
    const { date, cashCount, bankDeposits } = req.body;
    const reconciliationDate = date || new Date().toISOString().split('T')[0];
    
    const startOfDay = new Date(reconciliationDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(reconciliationDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const transactions = await Transaction.find({
      businessId: req.user.businessId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: 'completed'
    });
    
    const salesBreakdown = {
      cash: transactions.filter(t => t.payment.method === 'cash').reduce((sum, t) => sum + t.total, 0),
      card: transactions.filter(t => t.payment.method === 'card').reduce((sum, t) => sum + t.total, 0),
      transfer: transactions.filter(t => t.payment.method === 'transfer').reduce((sum, t) => sum + t.total, 0),
      total: transactions.reduce((sum, t) => sum + t.total, 0)
    };
    
    const discrepancy = cashCount - salesBreakdown.cash;
    
    res.json({
      success: true,
      reconciliation: {
        date: reconciliationDate,
        sales: salesBreakdown,
        cashCount,
        discrepancy,
        status: discrepancy === 0 ? 'balanced' : 'discrepancy',
        transactions: transactions.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReconciliation = async (req, res) => {
  try {
    const { date } = req.params;
    // This would fetch from a Reconciliation model
    res.json({ success: true, message: 'Reconciliation data' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveReconciliation = async (req, res) => {
  try {
    const { reconciliationId } = req.params;
    res.json({ success: true, message: 'Reconciliation approved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  runReconciliation,
  getReconciliation,
  approveReconciliation
};