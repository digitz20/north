const Card = require('../models/Card');
const Account = require('../models/Account');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Helper function to generate card number (development only)
const generateCardNumber = (network) => {
  const prefixes = {
    visa: ['4'],
    mastercard: ['51', '52', '53', '54', '55'],
    amex: ['34', '37'],
    discover: ['6011', '65']
  };
  const prefix = prefixes[network][Math.floor(Math.random() * prefixes[network].length)];
  let cardNumber = prefix;
  const length = network === 'amex' ? 15 : 16;
  while (cardNumber.length < length - 1) {
    cardNumber += Math.floor(Math.random() * 10);
  }
  // Add Luhn check digit
  let sum = 0;
  let isEven = false;
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i]);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  cardNumber += checkDigit;
  return cardNumber;
};

// Helper function to generate CVV
const generateCVV = (network) => {
  const length = network === 'amex' ? 4 : 3;
  let cvv = '';
  for (let i = 0; i < length; i++) {
    cvv += Math.floor(Math.random() * 10);
  }
  return cvv;
};

// @desc    Get all user cards
// @route   GET /api/v1/cards
// @access  Private
exports.getCards = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Get all cards for the authenticated user
    const cards = await Card.find({ user: req.user.id })
      .populate('account', 'accountNumber accountType balance currency')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Card.countDocuments({ user: req.user.id });

    res.status(200).json({
      success: true,
      count: cards.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: cards
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single card
// @route   GET /api/v1/cards/:id
// @access  Private
exports.getCard = async (req, res, next) => {
  try {
    const card = await Card.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('account', 'accountNumber accountType balance currency');

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    res.status(200).json({
      success: true,
      data: card
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new card
// @route   POST /api/v1/cards
// @access  Private
exports.createCard = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { accountId, cardType, cardNetwork, cardholderName, billingAddress, creditLimit } = req.body;

    // Validate required fields
    if (!accountId || !cardType || !cardNetwork || !cardholderName) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide account ID, card type, card network, and cardholder name'
      });
    }

    // Verify account belongs to user
    const account = await Account.findOne({
      _id: accountId,
      user: req.user.id
    }).session(session);

    if (!account) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Validate credit card specific fields
    if (cardType === 'credit' && (!creditLimit || creditLimit <= 0)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Credit cards require a valid credit limit'
      });
    }

    // Generate card details
    const cardNumber = generateCardNumber(cardNetwork);
    const cvv = generateCVV(cardNetwork);
    const cardNumberHash = crypto.createHash('sha256').update(cardNumber).digest('hex');

    // Calculate expiry date (3 years from now)
    const now = new Date();
    const expiryMonth = now.getMonth() + 1;
    const expiryYear = now.getFullYear() + 3;

    // Create card
    const card = await Card.create([{
      user: req.user.id,
      account: accountId,
      cardNumber,
      cardNumberHash,
      cardType,
      cardNetwork,
      cardholderName,
      expiryMonth,
      expiryYear,
      cvv,
      billingAddress,
      creditLimit: cardType === 'credit' ? creditLimit : undefined,
      isActive: false,
      activatedAt: null
    }], { session });

    // Create audit log
    await AuditLog.create([{
      actor: {
        user: req.user.id,
        role: req.user.role || 'user',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'Card Created',
      category: 'card-management',
      severity: 'medium',
      description: `New ${cardNetwork} ${cardType} card created for account ending in ${account.accountNumber.slice(-4)}`,
      entity: {
        type: 'Card',
        id: card[0]._id
      },
      metadata: {
        cardId: card[0].cardId,
        accountId
      }
    }], { session });

    // Create notification
    await Notification.create([{
      user: req.user.id,
      type: 'card',
      title: 'New Card Created',
      message: `Your new ${cardNetwork} ${cardType} card has been created. Please activate it to start using.`,
      priority: 'high',
      relatedEntity: {
        type: 'Card',
        id: card[0]._id
      }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: card[0],
      // Only send full card number and CVV once at creation
      sensitive: {
        cardNumber,
        cvv
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Update card
// @route   PUT /api/v1/cards/:id
// @access  Private
exports.updateCard = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { nickName, dailySpendingLimit, notificationsEnabled, internationalTransactionsEnabled, onlineTransactionsEnabled, contactlessEnabled, billingAddress, creditLimit } = req.body;

    // Find card and ensure it belongs to user
    let card = await Card.findOne({
      _id: req.params.id,
      user: req.user.id
    }).session(session);

    if (!card) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    // Update allowed fields
    const updateFields = {};
    if (nickName) updateFields.nickName = nickName;
    if (dailySpendingLimit !== undefined) updateFields.dailySpendingLimit = dailySpendingLimit;
    if (creditLimit !== undefined) updateFields.creditLimit = creditLimit;
    if (notificationsEnabled !== undefined) updateFields.notificationsEnabled = notificationsEnabled;
    if (internationalTransactionsEnabled !== undefined) updateFields.internationalTransactionsEnabled = internationalTransactionsEnabled;
    if (onlineTransactionsEnabled !== undefined) updateFields.onlineTransactionsEnabled = onlineTransactionsEnabled;
    if (contactlessEnabled !== undefined) updateFields.contactlessEnabled = contactlessEnabled;
    if (billingAddress) updateFields.billingAddress = { ...card.billingAddress, ...billingAddress };

    card = await Card.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
      session
    }).populate('account', 'accountNumber accountType balance currency');

    // Create audit log
    await AuditLog.create([{
      actor: {
        user: req.user.id,
        role: req.user.role || 'user',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'Card Updated',
      category: 'card-management',
      severity: 'low',
      description: `Card settings updated for card ending in ${card.lastFourDigits}`,
      entity: {
        type: 'Card',
        id: card._id
      },
      metadata: { updatedFields: Object.keys(updateFields) }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      data: card
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Delete card
// @route   DELETE /api/v1/cards/:id
// @access  Private
exports.deleteCard = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const card = await Card.findOne({
      _id: req.params.id,
      user: req.user.id
    }).session(session);

    if (!card) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    await Card.findByIdAndDelete(req.params.id).session(session);

    // Create audit log
    await AuditLog.create([{
      actor: {
        user: req.user.id,
        role: req.user.role || 'user',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'Card Deleted',
      category: 'card-management',
      severity: 'high',
      description: `Card ending in ${card.lastFourDigits} has been deleted`,
      entity: {
        type: 'Card',
        id: card._id
      }
    }], { session });

    // Create notification
    await Notification.create([{
      user: req.user.id,
      type: 'security',
      title: 'Card Deleted',
      message: `Your card ending in ${card.lastFourDigits} has been deleted from your account. If this wasn't you, please contact support immediately.`,
      priority: 'urgent',
      relatedEntity: {
        type: 'Card',
        id: card._id
      }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Card deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Activate card
// @route   PUT /api/v1/cards/:id/activate
// @access  Private
exports.activateCard = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let card = await Card.findOne({
      _id: req.params.id,
      user: req.user.id
    }).session(session);

    if (!card) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    if (card.isActive) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Card is already active'
      });
    }

    card = await Card.findByIdAndUpdate(req.params.id, {
      isActive: true,
      activatedAt: Date.now()
    }, {
      new: true,
      runValidators: true,
      session
    }).populate('account', 'accountNumber accountType balance currency');

    // Create audit log
    await AuditLog.create([{
      actor: {
        user: req.user.id,
        role: req.user.role || 'user',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'Card Activated',
      category: 'card-management',
      severity: 'medium',
      description: `Card ending in ${card.lastFourDigits} has been activated`,
      entity: {
        type: 'Card',
        id: card._id
      }
    }], { session });

    // Create notification
    await Notification.create([{
      user: req.user.id,
      type: 'card',
      title: 'Card Activated',
      message: `Your card ending in ${card.lastFourDigits} is now active and ready to use.`,
      priority: 'high',
      relatedEntity: {
        type: 'Card',
        id: card._id
      }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      data: card
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Freeze card
// @route   PUT /api/v1/cards/:id/freeze
// @access  Private
exports.freezeCard = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { reason } = req.body;
    
    let card = await Card.findOne({
      _id: req.params.id,
      user: req.user.id
    }).session(session);

    if (!card) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    if (card.isLocked) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Card is already frozen'
      });
    }

    card = await Card.findByIdAndUpdate(req.params.id, {
      isLocked: true,
      lockReason: reason || 'User initiated freeze',
      lockedAt: Date.now()
    }, {
      new: true,
      runValidators: true,
      session
    }).populate('account', 'accountNumber accountType balance currency');

    // Create audit log
    await AuditLog.create([{
      actor: {
        user: req.user.id,
        role: req.user.role || 'user',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'Card Frozen',
      category: 'card-management',
      severity: 'high',
      description: `Card ending in ${card.lastFourDigits} has been frozen. Reason: ${card.lockReason}`,
      entity: {
        type: 'Card',
        id: card._id
      }
    }], { session });

    // Create notification
    await Notification.create([{
      user: req.user.id,
      type: 'security',
      title: 'Card Frozen',
      message: `Your card ending in ${card.lastFourDigits} has been frozen. You can unfreeze it at any time from your account settings.`,
      priority: 'high',
      relatedEntity: {
        type: 'Card',
        id: card._id
      }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      data: card
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Unfreeze card (additional endpoint not in initial TODOs but needed)
// @route   PUT /api/v1/cards/:id/unfreeze
// @access  Private
exports.unfreezeCard = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let card = await Card.findOne({
      _id: req.params.id,
      user: req.user.id
    }).session(session);

    if (!card) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    if (!card.isLocked) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Card is not frozen'
      });
    }

    card = await Card.findByIdAndUpdate(req.params.id, {
      isLocked: false,
      lockReason: null,
      lockedAt: null
    }, {
      new: true,
      runValidators: true,
      session
    }).populate('account', 'accountNumber accountType balance currency');

    // Create audit log
    await AuditLog.create([{
      actor: {
        user: req.user.id,
        role: req.user.role || 'user',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      action: 'Card Unfrozen',
      category: 'card-management',
      severity: 'medium',
      description: `Card ending in ${card.lastFourDigits} has been unfrozen`,
      entity: {
        type: 'Card',
        id: card._id
      }
    }], { session });

    // Create notification
    await Notification.create([{
      user: req.user.id,
      type: 'security',
      title: 'Card Unfrozen',
      message: `Your card ending in ${card.lastFourDigits} has been unfrozen and is ready to use again.`,
      priority: 'medium',
      relatedEntity: {
        type: 'Card',
        id: card._id
      }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      data: card
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Get all cards (admin only)
// @route   GET /api/v1/cards/admin/all
// @access  Private/Admin
exports.getAllCards = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;

    // Filter options
    let query = {};
    if (req.query.cardType) query.cardType = req.query.cardType;
    if (req.query.cardNetwork) query.cardNetwork = req.query.cardNetwork;
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
    if (req.query.isLocked !== undefined) query.isLocked = req.query.isLocked === 'true';

    const cards = await Card.find(query)
      .populate('user', 'name email')
      .populate('account', 'accountNumber accountType balance')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Card.countDocuments(query);

    res.status(200).json({
      success: true,
      count: cards.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: cards
    });
  } catch (error) {
    next(error);
  }
};