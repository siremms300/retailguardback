const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');

const getInventory = async (req, res) => {
  try {
    const products = await Product.find({ 
      businessId: req.user.businessId,
      isActive: true 
    }).select('name sku category stock pricing.sellingPrice');
    
    const stats = {
      totalProducts: products.length,
      totalValue: products.reduce((sum, p) => sum + (p.stock.current * p.pricing.costPrice || 0), 0),
      lowStockItems: products.filter(p => p.stock.current <= p.stock.minimumThreshold).length,
      outOfStock: products.filter(p => p.stock.current === 0).length
    };
    
    res.json({ success: true, inventory: products, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLowStockAlerts = async (req, res) => {
  try {
    const products = await Product.find({
      businessId: req.user.businessId,
      'stock.current': { $lte: '$stock.minimumThreshold' },
      isActive: true
    });
    
    res.json({ success: true, alerts: products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, reason } = req.body;
    
    const product = await Product.findOne({
      _id: productId,
      businessId: req.user.businessId
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const oldQuantity = product.stock.current;
    product.stock.current = quantity;
    await product.save();
    
    await InventoryLog.create({
      businessId: req.user.businessId,
      productId: product._id,
      transactionType: 'adjustment',
      quantityChange: quantity - oldQuantity,
      quantityBefore: oldQuantity,
      quantityAfter: quantity,
      reason,
      performedBy: req.user.userId
    });
    
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const stockAdjustment = async (req, res) => {
  try {
    const { productId, adjustment, reason } = req.body;
    
    const product = await Product.findOne({
      _id: productId,
      businessId: req.user.businessId
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const oldQuantity = product.stock.current;
    product.stock.current += adjustment;
    await product.save();
    
    await InventoryLog.create({
      businessId: req.user.businessId,
      productId: product._id,
      transactionType: 'adjustment',
      quantityChange: adjustment,
      quantityBefore: oldQuantity,
      quantityAfter: product.stock.current,
      reason,
      performedBy: req.user.userId
    });
    
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInventory,
  getLowStockAlerts,
  updateStock,
  stockAdjustment
};