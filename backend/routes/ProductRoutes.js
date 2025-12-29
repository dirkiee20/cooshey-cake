const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const StockTransaction = require('../models/StockTransaction');
const upload = require('../middleware/uploadMiddleware');
const multer = require('multer');
const { protect, admin } = require('../middleware/authMiddleware');
console.log('Auth middlewares imported:', { protect: typeof protect, admin: typeof admin });

// @route   POST /api/upload
// @desc    Upload image
// @access  Public (consider making this admin-only later)
router.post('/upload', upload.single('image'), (req, res) => {
  if (req.file) {
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
  } else {
    res.status(400).json({ message: 'No image file provided' });
  }
});

// @route   GET /api/products
// @desc    Get all products
// @access  Public (temporarily no auth for debug)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category.toLowerCase();
    }

    const products = await Product.findAll({
      where: {
        ...filter,
        stock: { [Op.gt]: 0 }
      }
    });

    // Create absolute image URLs
    const productsWithAbsoluteImageUrls = products.map(product => {
      const productObject = product.toJSON();
      return {
        ...productObject,
        imageUrl: `${req.protocol}://${req.get('host')}${product.imageUrl}`
      };
    });

    res.json(productsWithAbsoluteImageUrls);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/products/:id
// @desc    Get a single product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // Create absolute image URL
    const productObject = product.toJSON();
    const productWithAbsoluteImageUrl = {
      ...productObject,
      imageUrl: `${req.protocol}://${req.get('host')}${product.imageUrl}`
    };

    res.json(productWithAbsoluteImageUrl);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/products
// @desc    Add a new product
// @access  Admin only
const uploadProduct = upload.fields([
  { name: 'image', maxCount: 1 }
]);

router.post('/', protect, admin, uploadProduct, async (req, res) => {
    console.log('=== ADD PRODUCT REQUEST RECEIVED ===');
    console.log('Request method:', req.method, 'path:', req.path);
    console.log('=== ADD PRODUCT REQUEST START ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    console.log('File count:', req.files ? Object.keys(req.files).length : 0);

   const { name, price, description, category = 'popular', stock } = req.body;
   console.log('Extracted data:', { name, price, description, category, stock });

   // Get uploaded image URL
   const imageUrl = req.files && req.files.image && req.files.image[0]
     ? `/uploads/${req.files.image[0].filename}`
     : req.body.imageUrl;
   console.log('Image URL:', imageUrl);

   // Basic validation
   if (!name || !price || !imageUrl) {
     console.log('VALIDATION FAILED:', { name: !!name, price: !!price, imageUrl: !!imageUrl });
     return res.status(400).json({ msg: 'Please provide name, price, and image for the product.' });
   }
   console.log('VALIDATION PASSED. Creating product...');

   try {
     const product = await Product.create({
       name,
       price,
       imageUrl,
       category: category.toLowerCase(),
       description: description || '',
       stock: stock || 0
     });
     console.log('PRODUCT CREATED SUCCESSFULLY:', product.id);

     // Log transaction
     await Transaction.create({
       action: 'add',
       type: 'stock_in',
       productId: product.id,
       productName: product.name,
       productDetails: `Price: ₱${product.price}, Category: ${product.category}, Stock: ${product.stock}`,
       quantityChange: product.stock,
       newStock: product.stock,
     });

     const productResponse = {
       id: product.id,
       name: product.name,
       price: product.price,
       imageUrl: product.imageUrl,
       category: product.category,
       description: product.description,
       stock: product.stock,
       createdAt: product.createdAt,
       updatedAt: product.updatedAt
     };
     console.log('Returning product:', productResponse);
     res.status(201).json(productResponse);
   } catch (error) {
     console.error('ERROR CREATING PRODUCT:', error);
     console.error('Error details:', error.message);
     res.status(500).json({ msg: 'Failed to create product' });
   }
   console.log('=== ADD PRODUCT REQUEST END ===');
});
// @route   PUT /api/products/:id
// @desc    Update (edit) a product
// @access  Admin only
const uploadUpdate = upload.fields([
  { name: 'image', maxCount: 1 }
]);

router.put('/:id', protect, admin, uploadUpdate, async (req, res) => {
  try {
    const { name, price, description, category, stock } = req.body;

    // Get the current product before update
    const currentProduct = await Product.findByPk(req.params.id);
    if (!currentProduct) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // Get uploaded image URL if new image provided
    const imageUrl = req.files && req.files.image && req.files.image[0]
      ? `/uploads/${req.files.image[0].filename}`
      : req.body.imageUrl;

    const updateData = {};
    if (name) updateData.name = name;
    if (price) updateData.price = price;
    if (description !== undefined) updateData.description = description;
    if (category) updateData.category = category.toLowerCase();
    if (stock !== undefined) updateData.stock = stock;
    if (imageUrl) updateData.imageUrl = imageUrl;

    const [updatedRowsCount] = await Product.update(updateData, {
      where: { id: req.params.id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    const updatedProduct = await Product.findByPk(req.params.id);

    // Log transaction if stock changed
    if (stock !== undefined && stock !== currentProduct.stock) {
      const quantityChange = stock - currentProduct.stock;
      const transactionType = quantityChange > 0 ? 'stock_in' : 'stock_out';

      await Transaction.create({
        action: 'edit',
        type: transactionType,
        productId: updatedProduct.id,
        productName: updatedProduct.name,
        productDetails: `Price: ₱${updatedProduct.price}, Category: ${updatedProduct.category}, Stock changed from ${currentProduct.stock} to ${updatedProduct.stock}`,
        quantityChange: quantityChange,
        previousStock: currentProduct.stock,
        newStock: updatedProduct.stock,
      });
    }

    res.json(updatedProduct.toJSON());
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Admin only
router.delete('/:id', protect, admin, async (req, res) => {
  console.log('=== DELETE PRODUCT START ===');
  console.log('Product ID:', req.params.id, 'Type:', typeof req.params.id);
  try {
    // Get the product before deleting
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      console.log('Product not found');
      return res.status(404).json({ msg: 'Product not found' });
    }
    console.log('Product found:', product.name, 'ID:', product.id, 'Type:', typeof product.id);

    // Log transaction
    console.log('Creating transaction...');
    const transactionData = {
      action: 'delete',
      type: 'stock_out',
      productId: null, // Product is being deleted, so no foreign key
      productName: product.name,
      productDetails: `Price: ₱${product.price}, Category: ${product.category}, Stock removed: ${product.stock}`,
      quantityChange: -product.stock,
      previousStock: product.stock,
      newStock: 0,
    };
    console.log('Transaction data:', transactionData);
    const transaction = await Transaction.create(transactionData);
    console.log('Transaction created:', transaction.id);

    // Delete associated StockTransactions before deleting the product
    console.log('Deleting associated StockTransactions...');
    const deletedStockTransactions = await StockTransaction.destroy({
      where: { productId: product.id }
    });
    console.log('StockTransactions deleted:', deletedStockTransactions);

    const deletedRowsCount = await Product.destroy({
      where: { id: req.params.id }
    });
    console.log('Product deleted, rows affected:', deletedRowsCount);

    if (deletedRowsCount === 0) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    console.log('=== DELETE PRODUCT END ===');
    res.json({ msg: 'Product removed successfully' });
  } catch (err) {
    console.error('DELETE PRODUCT ERROR:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Error name:', err.name);
    if (err.errors) {
      console.error('Validation errors:', err.errors);
    }
    res.status(500).json({ message: 'Server Error', details: err.message });
  }
});

// @route   DELETE /api/products
// @desc    Delete multiple products
// @access  Admin only
router.delete('/', protect, admin, async (req, res) => {
  const { productIds } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ msg: 'Please provide an array of product IDs to delete.' });
  }

  try {
    const deletedRowsCount = await Product.destroy({
      where: {
        id: productIds
      }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).json({ msg: 'No products found with the provided IDs.' });
    }

    res.json({ msg: `${deletedRowsCount} products removed successfully.` });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/transactions
// @desc    Get all transactions
// @access  Protected
router.get('/transactions', protect, async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
