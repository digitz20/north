import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Helper to format loan data for UI
const formatLoanForUI = (loan) => ({
  ...loan,
  id: loan._id,
  type: loan.loanProduct?.type || loan.loanProduct?.name || 'Loan',
  remaining: loan.remainingBalance || 0,
  amount: loan.amount || 0,
  emi: loan.monthlyPayment || 0,
  nextEmiDate: loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString() : 'N/A'
});

const initialState = {
  loans: [],
  taxRefunds: [],
  loading: false,
  loanTypesLoading: false,
  error: null,
  loanEligibility: null,
  availableLoanTypes: [],
  pendingLoanApplication: null
};

// Get available loan types
export const getAvailableLoanTypes = createAsyncThunk(
  'loans/getTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/loans/types', {
        params: { _t: Date.now() }
      });
      return response.data?.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch loan types');
    }
  }
);

// Get user loans
export const getUserLoans = createAsyncThunk(
  'loans/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/loans', {
        params: { _t: Date.now() }
      });
      const formattedLoans = ((response.data?.data) || []).map(formatLoanForUI);
      return { loans: formattedLoans };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch loans');
    }
  }
);

// Calculate loan eligibility
export const calculateLoanEligibility = createAsyncThunk(
  'loans/calculateEligibility',
  async (eligibilityData, { rejectWithValue }) => {
    try {
      const response = await api.post('/loans/eligibility', eligibilityData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to calculate eligibility');
    }
  }
);

// Apply for new loan
export const applyForLoan = createAsyncThunk(
  'loans/apply',
  async (loanData, { rejectWithValue }) => {
    try {
      const response = await api.post('/loans', loanData);
      // Format the new loan for UI
      return formatLoanForUI(response.data.data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply for loan');
    }
  }
);

// Make loan payment
export const makeLoanPayment = createAsyncThunk(
  'loans/makePayment',
  async ({ id, paymentData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/loans/${id}/payment`, paymentData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to make payment');
    }
  }
);

// Submit IRS tax refund request
export const submitTaxRefundRequest = createAsyncThunk(
  'loans/submitTaxRefund',
  async (taxRefundData, { rejectWithValue }) => {
    try {
      const response = await api.post('/loans/tax-refund', taxRefundData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit tax refund request');
    }
  }
);

// Get user's tax refund requests
export const getUserTaxRefunds = createAsyncThunk(
  'loans/getUserTaxRefunds',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/loans/tax-refunds');
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tax refunds');
    }
  }
);

const loanSlice = createSlice({
  name: 'loans',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get available loan types cases
      .addCase(getAvailableLoanTypes.pending, (state) => {
        state.loanTypesLoading = true;
      })
      .addCase(getAvailableLoanTypes.fulfilled, (state, action) => {
        state.loanTypesLoading = false;
        state.availableLoanTypes = action.payload || [];
      })
      .addCase(getAvailableLoanTypes.rejected, (state, action) => {
        state.loanTypesLoading = false;
        state.error = action.payload;
      })
      // Get user loans cases
      .addCase(getUserLoans.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserLoans.fulfilled, (state, action) => {
        state.loading = false;
        state.loans = action.payload?.loans || [];
        state.pendingLoanApplication = null;
      })
      .addCase(getUserLoans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Calculate eligibility cases
      .addCase(calculateLoanEligibility.fulfilled, (state, action) => {
        state.loanEligibility = action.payload;
      })
      // Apply for loan cases - do NOT push pending loans into visible loans list
      .addCase(applyForLoan.pending, (state) => {
        state.pendingLoanApplication = null;
      })
      .addCase(applyForLoan.fulfilled, (state, action) => {
        state.pendingLoanApplication = action.payload;
      })
      .addCase(applyForLoan.rejected, (state, action) => {
        state.pendingLoanApplication = null;
        state.error = action.payload;
      })
      // Make payment case
      .addCase(makeLoanPayment.fulfilled, (state, action) => {
        const index = state.loans.findIndex(loan => loan.id === action.payload._id);
        if (index !== -1) {
          state.loans[index] = formatLoanForUI(action.payload);
        }
      })
      // Submit tax refund request cases
      .addCase(submitTaxRefundRequest.fulfilled, (state, action) => {
        state.taxRefunds.unshift(action.payload);
      })
      // Get user tax refunds cases
      .addCase(getUserTaxRefunds.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserTaxRefunds.fulfilled, (state, action) => {
        state.loading = false;
        state.taxRefunds = action.payload || [];
      })
      .addCase(getUserTaxRefunds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError } = loanSlice.actions;
export default loanSlice.reducer;