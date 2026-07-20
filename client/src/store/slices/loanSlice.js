import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Helper to format loan data for UI
const formatLoanForUI = (loan) => ({
  ...loan,
  id: loan._id,
  remaining: loan.remainingBalance || 0,
  amount: loan.amount || 0,
  emi: loan.monthlyPayment || 0,
  nextEmiDate: loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString() : 'N/A'
});

const initialState = {
  loans: [],
  loading: false,
  error: null,
  loanEligibility: null,
  availableLoanTypes: [] // Store available loan types for application
};

// Get available loan types
export const getAvailableLoanTypes = createAsyncThunk(
  'loans/getTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/loans/types');
      return response.data.data;
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
      const response = await api.get('/loans');
      const formattedLoans = (response.data.data || []).map(formatLoanForUI);
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
        state.loading = true;
      })
      .addCase(getAvailableLoanTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.availableLoanTypes = action.payload;
      })
      .addCase(getAvailableLoanTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get user loans cases
      .addCase(getUserLoans.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserLoans.fulfilled, (state, action) => {
        state.loading = false;
        state.loans = action.payload.loans;
      })
      .addCase(getUserLoans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Calculate eligibility cases
      .addCase(calculateLoanEligibility.fulfilled, (state, action) => {
        state.loanEligibility = action.payload;
      })
      // Apply for loan cases
      .addCase(applyForLoan.fulfilled, (state, action) => {
        state.loans.push(action.payload);
      })
      // Make payment case
      .addCase(makeLoanPayment.fulfilled, (state, action) => {
        const index = state.loans.findIndex(loan => loan.id === action.payload._id);
        if (index !== -1) {
          state.loans[index] = formatLoanForUI(action.payload);
        }
      });
  }
});

export const { clearError } = loanSlice.actions;
export default loanSlice.reducer;