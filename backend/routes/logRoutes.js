const express = require('express');
const router = express.Router();
const Log = require('../models/Log');

// @route   GET /api/logs
// @desc    Get all logs
// @access  Private/Admin
router.get('/', async (req, res) => {
  try {
    console.log('Getting logs...');
    const logs = await Log.findAll({
      order: [['createdAt', 'DESC']],
      limit: 1000 // Limit to prevent performance issues
    });

    console.log('Logs found:', logs.length);
    res.json(logs);
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({ message: 'Failed to get logs' });
  }
});

// @route   POST /api/logs
// @desc    Create a new log entry
// @access  Private/Admin
router.post('/', async (req, res) => {
  try {
    const { action, entityType, entityId, entityName, details, adminId, adminName, ipAddress, userAgent } = req.body;

    console.log('Creating log entry:', { action, entityType, entityId, entityName });

    const log = await Log.create({
      action,
      entityType,
      entityId,
      entityName,
      details,
      adminId,
      adminName,
      ipAddress: ipAddress || req.ip,
      userAgent: userAgent || req.get('User-Agent')
    });

    console.log('Log entry created:', log.id);
    res.status(201).json(log);
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({ message: 'Failed to create log' });
  }
});

// @route   DELETE /api/logs
// @desc    Clear all logs (for maintenance)
// @access  Private/Admin
router.delete('/', async (req, res) => {
  try {
    console.log('Clearing all logs...');
    const deletedCount = await Log.destroy({
      where: {},
      truncate: true
    });

    console.log('Logs cleared:', deletedCount);
    res.json({ message: 'All logs cleared', deletedCount });
  } catch (error) {
    console.error('Error clearing logs:', error);
    res.status(500).json({ message: 'Failed to clear logs' });
  }
});

module.exports = router;