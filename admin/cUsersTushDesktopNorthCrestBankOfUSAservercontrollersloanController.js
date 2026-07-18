// @desc    Get all available loan types/products
// @route   GET /api/v1/loans/types
// @access  Private
exports.getLoanTypes = async (req, res, next) => {
  try {
    // Get all active loan products
    const loanProducts = await LoanProduct.find({ isActive: true })
      .select('name description type minimumAmount maximumAmount interestRate minTerm maxTerm originationFee creditScoreRequired requirements documents');

    res.status(200).json({
      success: true,
      count: loanProducts.length,
      data: loanProducts
    });
  } catch (error) {
    next(error);
  }
};
