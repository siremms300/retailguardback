const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');

const createTransaction = async (req, res) => {
  try {
    const { items, payment, customer, discount } = req.body;
    const { userId, businessId } = req.user;
    
    const transactionNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    let subtotal = 0;
    const processedItems = [];
    
    for (const item of items) {
      const product = await Product.findOne({
        _id: item.productId,
        businessId: businessId
      });
      
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }
      
      if (product.stock.current < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock.current}`
        });
      }
      
      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;
      
      processedItems.push({
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: totalPrice,
        costPriceAtSale: product.pricing.costPrice
      });
      
      product.stock.current -= item.quantity;
      await product.save();
      
      await InventoryLog.create({
        businessId,
        productId: product._id,
        transactionType: 'sale',
        quantityChange: -item.quantity,
        quantityBefore: product.stock.current + item.quantity,
        quantityAfter: product.stock.current,
        referenceId: transactionNumber,
        performedBy: userId
      });
    }
    
    let discountAmount = 0;
    if (discount && discount.amount > 0) {
      if (discount.type === 'percentage') {
        discountAmount = subtotal * (discount.amount / 100);
      } else {
        discountAmount = discount.amount;
      }
    }
    
    const total = subtotal - discountAmount;
    
    const transaction = await Transaction.create({
      businessId,
      branchId: req.body.branchId,
      transactionNumber,
      cashierId: userId,
      customer,
      items: processedItems,
      subtotal,
      discount: {
        amount: discountAmount,
        type: discount?.type,
        reason: discount?.reason
      },
      total,
      payment: {
        method: payment.method,
        details: [{
          type: payment.method,
          amount: total,
          reference: payment.reference,
          status: payment.method === 'cash' ? 'verified' : 'pending'
        }],
        status: payment.method === 'cash' ? 'paid' : 'pending'
      },
      receipt: {
        receiptNumber: `RCP-${Date.now()}`,
        qrCode: `https://api.afriguard.com/receipts/${transactionNumber}`
      }
    });
    
    res.status(201).json({
      success: true,
      transaction: {
        id: transaction._id,
        transactionNumber: transaction.transactionNumber,
        receiptNumber: transaction.receipt.receiptNumber,
        total: transaction.total,
        items: transaction.items.length,
        paymentStatus: transaction.payment.status,
        qrCode: transaction.receipt.qrCode
      }
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      transactionNumber: req.params.id,
      businessId: req.user.businessId
    }).populate('cashierId', 'firstName lastName');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDailyTransactions = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const transactions = await Transaction.find({
      businessId: req.user.businessId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const total = transactions.reduce((sum, t) => sum + t.total, 0);
    
    res.json({
      success: true,
      transactions,
      total,
      count: transactions.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const voidTransaction = async (req, res) => {
  try {
    const { reason } = req.body;
    const transaction = await Transaction.findOne({
      transactionNumber: req.params.id,
      businessId: req.user.businessId
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    if (transaction.status === 'voided') {
      return res.status(400).json({ message: 'Transaction already voided' });
    }
    
    for (const item of transaction.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { 'stock.current': item.quantity }
      });
    }
    
    transaction.status = 'voided';
    transaction.voidReason = reason;
    transaction.voidedBy = req.user.userId;
    transaction.voidedAt = new Date();
    await transaction.save();
    
    res.json({ success: true, message: 'Transaction voided successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTransaction,
  getTransaction,
  voidTransaction,
  getDailyTransactions
};