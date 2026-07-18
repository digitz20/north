// @desc    Get all transfers (admin only)
// @route   GET /api/v1/admin/transfers
// @access  Private/Admin
exports.getAllTransfers = async (req, res, next) => {
  try {
    const transfers = await Transfer.find()
      .populate('initiatedBy', 'firstName lastName email')
      .populate('sourceAccount', 'accountNumber accountType');
    
    res.status(200).json({
      success: true,
      count: transfers.length,
      data: transfers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transfer (admin only)
// @route   GET /api/v1/admin/transfers/:id
// @access  Private/Admin
exports.getTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('initiatedBy', 'firstName lastName email')
      .populate('sourceAccount', 'accountNumber accountType');
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update transfer status (admin only)
// @route   PUT /api/v1/admin/transfers/:id
// @access  Private/Admin
exports.updateTransfer = async (req, res, next) => {
  try {
    const updateableFields = {
      status: req.body.status,
      notes: req.body.notes,
      processedBy: req.user.id
    };
    
    // Remove undefined fields
    Object.keys(updateableFields).forEach(key => 
      updateableFields[key] === undefined && delete updateableFields[key]
    );

    const transfer = await Transfer.findByIdAndUpdate(
      req.params.id, 
      updateableFields, 
      {
        new: true,
        runValidators: true
      }
    ).populate('initiatedBy', 'firstName lastName email');

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    // Create audit log
    await AuditLog.create({
      user: req.user.id,
      action: `Updated transfer: ${transfer._id}`,
      description: `Admin updated transfer status to ${transfer.status}`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete transfer (admin only, super-admin only)
// @route   DELETE /api/v1/admin/transfers/:id
// @access  Private/Super Admin
exports.deleteTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    await Transfer.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      user: req.user.id,
      action: `Deleted transfer: ${transfer._id}`,
      description: `Super admin deleted transfer record`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Transfer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};