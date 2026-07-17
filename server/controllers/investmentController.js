const { InvestmentPlan, UserInvestment } = require('../models/Investment');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// Helper function to calculate current investment value based on returns
const calculateCurrentValue = (investment, plan) => {
  if (investment.status !== 'active') return investment.currentValue;
  
  const monthsInvested = (Date.now() - investment.purchaseDate) / (1000 * 60 * 60 * 24 * 30);
  const annualReturn = plan.expectedReturn / 100;
  const monthlyReturn = annualReturn / 12;
  const projectedValue = investment.amountInvested * Math.pow(1 + monthlyReturn, monthsInvested);
  return Math.round(projectedValue * 100) / 100;
};

// @desc    Get all user investments
// @route   GET /api/v1/investments
// @access  Private
exports.getInvestments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filter options
    const filters = { user: req.user.id };
    if (req.query.status) filters.status = req.query.status;
    
    const total = await UserInvestment.countDocuments(filters);
    const investments = await UserInvestment.find(filters)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex)
      .populate('plan', 'name type expectedReturn riskLevel')
      .populate('transaction', 'amount status');

    // Update current values for active investments
    for (let investment of investments) {
      if (investment.status === 'active') {
        const plan = await InvestmentPlan.findById(investment.plan._id);
        if (plan) {
          const newValue = calculateCurrentValue(investment, plan);
          const returnsEarned = newValue - investment.amountInvested;
          await UserInvestment.findByIdAndUpdate(investment._id, {
            currentValue: newValue,
            returnsEarned: Math.round(returnsEarned * 100) / 100,
            lastValuationUpdate: Date.now()
          });
          investment.currentValue = newValue;
          investment.returnsEarned = Math.round(returnsEarned * 100) / 100;
        }
      }
    }

    await AuditLog.log({
      actor: { user: req.user.id, role: 'user', ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'investments_viewed',
      category: 'investment-management',
      description: `User viewed their investment portfolio`
    });

    res.status(200).json({
      success: true,
      data: { investments, total, page, limit }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single investment
// @route   GET /api/v1/investments/:id
// @access  Private
exports.getInvestment = async (req, res, next) => {
  try {
    const investment = await UserInvestment.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('plan', 'name description type expectedReturn riskLevel duration liquidity')
      .populate('transaction', 'amount status createdAt');

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    // Update current value if active
    if (investment.status === 'active') {
      const plan = await InvestmentPlan.findById(investment.plan._id);
      if (plan) {
        const newValue = calculateCurrentValue(investment, plan);
        const returnsEarned = newValue - investment.amountInvested;
        await UserInvestment.findByIdAndUpdate(investment._id, {
          currentValue: newValue,
          returnsEarned: Math.round(returnsEarned * 100) / 100,
          lastValuationUpdate: Date.now()
        });
        investment.currentValue = newValue;
        investment.returnsEarned = Math.round(returnsEarned * 100) / 100;
      }
    }

    await AuditLog.log({
      actor: { user: req.user.id, role: 'user', ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'investment_viewed',
      category: 'investment-management',
      description: `User viewed investment ${investment.investmentId}`,
      entity: { type: 'investment', id: investment._id, name: investment.investmentId }
    });

    res.status(200).json({
      success: true,
      data: investment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new investment
// @route   POST /api/v1/investments
// @access  Private
exports.createInvestment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { planId, amount, accountId, isAutoReinvest } = req.body;

    // Validate required fields
    if (!planId || !amount || !accountId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide planId, amount, and accountId'
      });
    }

    // Find the investment plan
    const plan = await InvestmentPlan.findById(planId).session(session);
    if (!plan || !plan.isActive) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Investment plan not found or inactive'
      });
    }

    // Validate minimum investment
    if (amount < plan.minimumInvestment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Minimum investment for this plan is $${plan.minimumInvestment}`
      });
    }

    // Check if account exists and belongs to user
    const account = await Account.findOne({ _id: accountId, user: req.user.id }).session(session);
    if (!account) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Check sufficient balance
    if (account.balance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Insufficient account balance'
      });
    }

    // Deduct amount from account
    await Account.findByIdAndUpdate(accountId, { $inc: { balance: -amount } }, { session });

    // Create transaction record
    const transaction = await Transaction.create([{
      user: req.user.id,
      account: accountId,
      type: 'investment',
      amount: amount,
      description: `Investment in ${plan.name}`,
      category: 'investment',
      status: 'completed',
      metadata: { planId: plan._id }
    }], { session });

    // Create user investment
    const investment = await UserInvestment.create([{
      user: req.user.id,
      plan: planId,
      amountInvested: amount,
      currentValue: amount,
      transaction: transaction[0]._id,
      isAutoReinvest: isAutoReinvest || false
    }], { session });

    // Update plan's total invested
    await InvestmentPlan.findByIdAndUpdate(planId, { $inc: { totalInvested: amount } }, { session });

    // Create audit log
    await AuditLog.log({
      actor: { user: req.user.id, role: 'user', ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'investment_created',
      category: 'investment-management',
      description: `User created new investment of $${amount} in ${plan.name}`,
      entity: { type: 'investment', id: investment[0]._id, name: investment[0].investmentId },
      metadata: { planId, amount, accountId }
    });

    // Create notification
    await Notification.create([{
      user: req.user.id,
      type: 'investment',
      title: 'Investment Successful',
      message: `You've successfully invested $${amount} in ${plan.name}. Your investment ID is ${investment[0].investmentId}.`,
      relatedModel: 'UserInvestment',
      relatedId: investment[0]._id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Investment created successfully',
      data: investment[0]
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Sell investment
// @route   POST /api/v1/investments/:id/sell
// @access  Private
exports.sellInvestment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { accountId } = req.body;

    if (!accountId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide accountId to receive funds'
      });
    }

    // Find the investment and ensure it belongs to user and is active
    const investment = await UserInvestment.findOne({
      _id: req.params.id,
      user: req.user.id,
      status: 'active'
    }).populate('plan').session(session);

    if (!investment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Active investment not found'
      });
    }

    // Check if investment can be liquidated (check liquidity from plan)
    const plan = investment.plan;
    if (plan.liquidity === 'maturity-only' && Date.now() < investment.maturityDate) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'This investment can only be sold at maturity'
      });
    }

    // Calculate current value including all returns
    const currentValue = calculateCurrentValue(investment, plan);
    const returnsEarned = currentValue - investment.amountInvested;

    // Verify the account exists and belongs to user
    const account = await Account.findOne({ _id: accountId, user: req.user.id }).session(session);
    if (!account) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Add funds back to user's account
    await Account.findByIdAndUpdate(accountId, { $inc: { balance: currentValue } }, { session });

    // Create transaction for sale
    const transaction = await Transaction.create([{
      user: req.user.id,
      account: accountId,
      type: 'deposit',
      amount: currentValue,
      description: `Sale proceeds from investment ${investment.investmentId}`,
      category: 'investment',
      status: 'completed',
      metadata: { investmentId: investment.investmentId, returnsEarned }
    }], { session });

    // Update investment status
    await UserInvestment.findByIdAndUpdate(req.params.id, {
      status: 'sold',
      soldDate: Date.now(),
      currentValue,
      returnsEarned: Math.round(returnsEarned * 100) / 100
    }, { session });

    // Update plan's total invested
    await InvestmentPlan.findByIdAndUpdate(plan._id, { $inc: { totalInvested: -investment.amountInvested } }, { session });

    // Create audit log
    await AuditLog.log({
      actor: { user: req.user.id, role: 'user', ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'investment_sold',
      category: 'investment-management',
      description: `User sold investment ${investment.investmentId} for $${currentValue}`,
      entity: { type: 'investment', id: investment._id, name: investment.investmentId },
      before: { status: 'active' },
      after: { status: 'sold', soldDate: Date.now() }
    });

    // Create notification
    await Notification.create([{
      user: req.user.id,
      type: 'investment',
      title: 'Investment Sold Successfully',
      message: `You've sold your investment ${investment.investmentId} for $${currentValue.toFixed(2)}. Returns earned: $${returnsEarned.toFixed(2)}. Funds have been added to your account.`,
      relatedModel: 'UserInvestment',
      relatedId: investment._id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Investment sold successfully',
      data: {
        investmentId: investment.investmentId,
        amountReceived: currentValue,
        returnsEarned: Math.round(returnsEarned * 100) / 100
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Get available investment types
// @route   GET /api/v1/investments/types
// @access  Private
exports.getInvestmentTypes = async (req, res, next) => {
  try {
    const plans = await InvestmentPlan.find({ isActive: true })
      .select('name description type minimumInvestment expectedReturn riskLevel duration liquidity image');

    await AuditLog.log({
      actor: { user: req.user.id, role: 'user', ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'investment_plans_viewed',
      category: 'investment-management',
      description: `User viewed available investment plans`
    });

    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all investments (admin only)
// @route   GET /api/v1/investments/admin/all
// @access  Private/Admin
exports.getAllInvestments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    
    // Filter options
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.planType) filters.plan = { $in: await InvestmentPlan.find({ type: req.query.planType }).select('_id') };

    const total = await UserInvestment.countDocuments(filters);
    const investments = await UserInvestment.find(filters)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex)
      .populate('user', 'fullName email')
      .populate('plan', 'name type expectedReturn')
      .populate('transaction', 'amount status');

    await AuditLog.log({
      actor: { user: req.user.id, role: 'admin', ip: req.ip, userAgent: req.get('User-Agent') },
      action: 'all_investments_viewed',
      category: 'investment-management',
      description: `Admin viewed all platform investments`,
      metadata: { filters }
    });

    res.status(200).json({
      success: true,
      data: { investments, total, page, limit }
    });
  } catch (error) {
    next(error);
  }
};