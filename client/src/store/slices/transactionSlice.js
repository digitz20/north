import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  transactions: [],
  filteredTransactions: [],
  totalTransactions: 0,
  loading: false,
  error: null
};

// Get all transactions
export const getTransactions = createAsyncThunk(
  'transactions/getAll',
  async ({ page = 1, limit = 10, filters = {} } = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams({
        page,
        limit,
        ...filters
      }).toString();
      
      const response = await api.get(`/transactions?${queryString}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

// Alias for backward compatibility
export const fetchTransactions = getTransactions;

// Create new transaction (deposit/withdraw)
export const createTransaction = createAsyncThunk(
  'transactions/create',
  async (transactionData, { rejectWithValue }) => {
    try {
      const response = await api.post('/transactions', transactionData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create transaction');
    }
  }
);

// Create transfer
export const createTransfer = createAsyncThunk(
  'transactions/createTransfer',
  async (transferData, { rejectWithValue }) => {
    try {
      const response = await api.post('/transfers', transferData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Transfer failed');
    }
  }
);

// Process withdrawal
export const processWithdrawal = createAsyncThunk(
  'transactions/withdraw',
  async (withdrawalData, { rejectWithValue }) => {
    try {
      const response = await api.post('/transactions/withdraw', withdrawalData);
      // Send email notification
      await api.post('/notifications/send-email', {
        email: withdrawalData.recipientEmail,
        type: 'withdrawal_confirmation',
        transactionDetails: response.data.data
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Withdrawal failed');
    }
  }
);

// Process crypto deposit
export const processCryptoDeposit = createAsyncThunk(
  'transactions/crypto-deposit',
  async (depositData, { rejectWithValue }) => {
    try {
      const response = await api.post('/transactions/crypto-deposit', depositData);
      await api.post('/notifications/send-email', {
        email: depositData.userEmail,
        type: 'deposit_confirmation',
        transactionDetails: response.data.data
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Deposit failed');
    }
  }
);

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    filterTransactions: (state, action) => {
      const { search, type, startDate, endDate } = action.payload;
      state.filteredTransactions = state.transactions.filter(transaction => {
        let matches = true;
        if (search) {
          matches = matches && (
            transaction.description?.toLowerCase().includes(search.toLowerCase()) ||
            transaction.reference?.toLowerCase().includes(search.toLowerCase())
          );
        }
        if (type) {
          matches = matches && transaction.type === type;
        }
        if (startDate) {
          matches = matches && new Date(transaction.createdAt) >= new Date(startDate);
        }
        if (endDate) {
          matches = matches && new Date(transaction.createdAt) <= new Date(endDate);
        }
        return matches;
      });
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
        state.filteredTransactions = action.payload.transactions;
        state.totalTransactions = action.payload.total;
      })
      .addCase(getTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create transaction cases
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
        state.filteredTransactions.unshift(action.payload);
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Create transfer cases
      .addCase(createTransfer.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
        state.filteredTransactions.unshift(action.payload);
      })
      .addCase(createTransfer.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Process withdrawal cases
      .addCase(processWithdrawal.pending, (state) => {
        state.loading = true;
      })
      .addCase(processWithdrawal.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions.unshift(action.payload);
        state.filteredTransactions.unshift(action.payload);
      })
      .addCase(processWithdrawal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Process crypto deposit cases
      .addCase(processCryptoDeposit.pending, (state) => {
        state.loading = true;
      })
      .addCase(processCryptoDeposit.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions.unshift(action.payload);
        state.filteredTransactions.unshift(action.payload);
      })
      .addCase(processCryptoDeposit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, filterTransactions } = transactionSlice.actions;
export default transactionSlice.reducer;