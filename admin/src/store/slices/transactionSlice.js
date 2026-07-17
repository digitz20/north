import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../services/api';

const initialState = {
  transactions: [],
  loading: false,
  error: null,
  totalTransactions: 0
};

// Get all transactions
export const getTransactions = createAsyncThunk(
  'transactions/getAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get('/transactions', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

// Create transaction
export const createTransaction = createAsyncThunk(
  'transactions/create',
  async (transactionData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/transactions', transactionData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create transaction');
    }
  }
);

// Update transaction status
export const updateTransactionStatus = createAsyncThunk(
  'transactions/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/transactions/${id}/status`, { status });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update transaction');
    }
  }
);

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get transactions cases
      .addCase(getTransactions.pending, (state) => {
        state.loading = true;
      })
      .addCase(getTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.transactions;
        state.totalTransactions = action.payload.total;
      })
      .addCase(getTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update transaction status
      .addCase(updateTransactionStatus.fulfilled, (state, action) => {
        const index = state.transactions.findIndex(tx => tx._id === action.payload._id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
      });
  }
});

export const { clearError } = transactionSlice.actions;
export default transactionSlice.reducer;