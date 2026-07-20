const Settings = require('../models/Settings');

// @desc    Get admin settings
// @route   GET /api/v1/admin/settings
// @access  Private/Admin
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({
        bankName: 'NorthCrest Bank of USA',
        maintenanceMode: false,
        emailNotifications: true,
        maxTransferAmount: 10000,
        minLoanAmount: 500,
        interestRate: 4.5,
        supportEmail: 'support@northcrestbank.com',
        supportPhone: '+1-800-555-0123'
      });
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update admin settings
// @route   POST /api/v1/admin/settings
// @access  Private/Admin
exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      const allowedFields = [
        'bankName', 'maintenanceMode', 'emailNotifications', 'maxTransferAmount',
        'minLoanAmount', 'interestRate', 'supportEmail', 'supportPhone'
      ];
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          settings[field] = req.body[field];
        }
      });
      
      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};
