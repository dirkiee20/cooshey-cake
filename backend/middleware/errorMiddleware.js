const AdminNotificationService = require('../services/adminNotificationService');

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;

    res.status(statusCode);

    // Create admin notification for server errors (5xx)
    if (statusCode >= 500) {
        try {
            AdminNotificationService.notifySystemError({
                message: err.message || 'Unknown server error',
                statusCode: statusCode,
                url: req.originalUrl,
                method: req.method,
                stack: process.env.NODE_ENV === 'production' ? null : err.stack,
                userAgent: req.get('User-Agent'),
                ip: req.ip
            }).catch(notificationError => {
                console.error('Failed to create system error notification:', notificationError);
            });
        } catch (notificationError) {
            console.error('Failed to create system error notification:', notificationError);
        }
    }

    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { errorHandler };