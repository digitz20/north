import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  accounts: [],
  wallet: null,
  loading: false,
  error: null
};

// Get user accounts
export const getUserAccounts = createAsyncThunk(
  'accounts/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/accounts');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch accounts');
    }
  }
);

// Alias for backward compatibility
export const fetchAccounts = getUserAccounts;

// Get wallet details
export const getWallet = createAsyncThunk(
  'accounts/getWallet',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/wallet');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wallet');
    }
  }
);

const accountSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get accounts cases
      .addCase(getUserAccounts.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload.accounts;
      })
      .addCase(getUserAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get wallet cases
      .addCase(getWallet.pending, (state) => {
        state.loading = true;
      })
      .addCase(getWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.wallet = action.payload;
      })
      .addCase(getWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError } = accountSlice.actions;
export default accountSlice.reducer;