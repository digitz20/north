// Admin-only account functions
// @desc    Get ALL accounts across all users (admin only)
// @route   GET /api/v1/admin/accounts
// @access  Private/Admin
exports.getAdminAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find()
      .populate('user', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update any account (admin only)
// @route   PUT /api/v1/admin/accounts/:id
// @access  Private/Admin
exports.updateAdminAccount = async (req, res, next) => {
  try {
    const updateableFields = {
      balance: req.body.balance,
      accountStatus: req.body.accountStatus,
      isLocked: req.body.isLocked,
      notes: req.body.notes,
      processedBy: req.user.id
    };
    
    // Remove undefined fields
    Object.keys(updateableFields).forEach(key => 
      updateableFields[key] === undefined && delete updateableFields[key]
    );

    const account = await Account.findByIdAndUpdate(
      req.params.id, 
      updateableFields, 
      {
        new: true,
        runValidators: true
      }
    ).populate('user', 'firstName lastName email');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    await AuditLog.create({
      user: req.user.id,
      action: `Updated account: ${account.accountNumber}`,
      description: `Admin updated account status/balance`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete account (admin only, super-admin only)
// @route   DELETE /api/v1/admin/accounts/:id
// @access  Private/Super Admin
exports.deleteAdminAccount = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const account = await Account.findById(req.params.id).session(session);
    
    if (!account) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Delete all transactions linked to this account
    await Transaction.deleteMany({
      $or: [
        { 'source.account': account._id },
        { 'destination.account': account._id }
      ]
    }).session(session);

    // Delete the account
    await Account.findByIdAndDelete(req.params.id).session(session);

    await AuditLog.create({
      user: req.user.id,
      action: `Deleted account: ${account.accountNumber}`,
      description: `Super admin deleted user account`,
      ipAddress: req.ip
    }, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Account and all associated transactions deleted'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};