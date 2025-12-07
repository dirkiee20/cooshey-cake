const { Sequelize } = require('sequelize');

// Initialize Sequelize globally BEFORE requiring models
const dotenv = require('dotenv');
dotenv.config();

const password = process.env.DB_PASSWORD || null;
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    password,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

async function initDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Database connected for test script');

        // Set global BEFORE requiring models
        global.sequelize = sequelize;

        // Require models AFTER setting global.sequelize
        require('./models/AdminNotification');

        // Sync database
        await sequelize.sync({ alter: true });
        console.log('Database synchronized for test script');

        // Require service AFTER models are loaded
        const AdminNotificationService = require('./services/adminNotificationService');

        // Now create the notification
        console.log('Creating test notification...');
        const notification = await AdminNotificationService.createNotification({
            title: 'Test Notification',
            message: 'This is a test notification to verify the bell button functionality.',
            type: 'general',
            priority: 'medium'
        });
        console.log('Test notification created:', notification);

    } catch (error) {
        console.error('Error in test script:', error);
    } finally {
        await sequelize.close();
    }
}

initDatabase();