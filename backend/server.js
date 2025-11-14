const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables from .env file
dotenv.config();

// Initialize Sequelize globally BEFORE requiring models
const { Sequelize } = require('sequelize');
const password = process.env.DB_PASSWORD || null; // Use null if password is empty
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    password,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: false, // Set to console.log to see SQL queries
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        retry: {
            max: 3
        }
    }
);

// Test the connection
console.log(`Attempting to connect to MySQL at ${process.env.DB_HOST}:${process.env.DB_PORT} with user ${process.env.DB_USER} and database ${process.env.DB_NAME}`);
sequelize.authenticate()
    .then(() => console.log('MySQL connected successfully.'))
    .catch(err => {
        console.error('MySQL connection error:', err);
        console.error('Error code:', err.original ? err.original.code : err.code);
        console.error('Ensure MySQL server is running and credentials are correct.');
    });

// Export sequelize instance for use in models
global.sequelize = sequelize;
module.exports = { sequelize };

// Require all models to ensure they are registered BEFORE sync
require('./models/userModel');
require('./models/Product');
require('./models/Transaction');
require('./models/cartModel');
require('./models/orderModel');
require('./models/Payment');

// Sync database models
sequelize.sync({ alter: true }) // Use alter to update schema without losing data
    .then(() => console.log('Database synchronized successfully.'))
    .catch(err => console.error('Database synchronization error:', err));

// Import routes AFTER models are loaded
const productRoutes = require('./routes/ProductRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const cartRoutes = require('./routes/cartRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To parse incoming JSON requests

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// Serve admin index.html directly (before static serving to avoid conflicts)
app.get('/admin/index.html', (req, res) => {
    console.log('Request received for /admin/index.html');
    res.sendFile('admin/index.html', { root: __dirname + '/..' });
});

// Serve admin static files (must be before main site to avoid conflicts)
app.use('/admin', (req, res, next) => {
    console.log(`Admin static request: ${req.path}`);
    express.static('../admin')(req, res, next);
});

// Serve main site static files
app.use(express.static('../'));

// Redirect old admin.html to new admin structure
app.get('/admin.html', (req, res) => {
    console.log('Request received for /admin.html, redirecting to /admin/index.html');
    res.redirect('/admin/index.html');
});

// API Routes
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// This should be the last middleware
// It will catch any errors from your routes
app.use(errorHandler);


// Add logging for unhandled exceptions and rejections
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Don't exit immediately, log and continue
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit immediately, log and continue
});

// Add keep-alive mechanism
setInterval(() => {
    console.log('Server is still running...');
}, 30000); // Log every 30 seconds


const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});