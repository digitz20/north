import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Helper to format investment data for UI
const formatInvestmentForUI = (investment) => ({
  ...investment,
  id: investment._id,
  returns: investment.currentValue && investment.amountInvested 
    ? `${(((investment.currentValue - investment.amountInvested) / investment.amountInvested) * 100).toFixed(1)}%` 
    : '0%',
  invested: investment.amountInvested || 0,
  currentValue: investment.currentValue || 0
});

const initialState = {
  investments: [],
  loading: false,
  error: null,
  investmentTypes: []
};

// Get user investments
export const getUserInvestments = createAsyncThunk(
  'investments/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/investments');
      const formattedInvestments = (response.data.data?.investments || []).map(formatInvestmentForUI);
      return { investments: formattedInvestments };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch investments');
    }
  }
);

// Get investment types
export const getInvestmentTypes = createAsyncThunk(
  'investments/getTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/investments/types');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch investment types');
    }
  }
);

// Create new investment
export const createInvestment = createAsyncThunk(
  'investments/create',
  async (investmentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/investments', investmentData);
      // Format the new investment for UI
      return formatInvestmentForUI(response.data.data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create investment');
    }
  }
);

// Sell investment
export const sellInvestment = createAsyncThunk(
  'investments/sell',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/investments/${id}/sell`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to sell investment');
    }
  }
);

const investmentSlice = createSlice({
  name: 'investments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get user investments cases
      .addCase(getUserInvestments.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserInvestments.fulfilled, (state, action) => {
        state.loading = false;
        state.investments = action.payload.investments;
      })
      .addCase(getUserInvestments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get investment types cases
      .addCase(getInvestmentTypes.fulfilled, (state, action) => {
        state.investmentTypes = action.payload;
      })
      // Create investment cases
      .addCase(createInvestment.fulfilled, (state, action) => {
        state.investments.push(action.payload);
      })
      // Sell investment case
      .addCase(sellInvestment.fulfilled, (state, action) => {
        const index = state.investments.findIndex(inv => inv.id === action.payload._id);
        if (index !== -1) {
          state.investments[index] = formatInvestmentForUI(action.payload);
        }
      });
  }
});

export const { clearError } = investmentSlice.actions;
export default investmentSlice.reducer;