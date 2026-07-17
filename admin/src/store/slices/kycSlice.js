import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../services/api';

const initialState = {
  kycSubmissions: [],
  loading: false,
  error: null,
  totalSubmissions: 0
};

// Get all KYC submissions
export const getKYCSubmissions = createAsyncThunk(
  'kyc/getAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get('/kyc', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch KYC submissions');
    }
  }
);

// Approve KYC
export const approveKYC = createAsyncThunk(
  'kyc/approve',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/kyc/${id}/approve`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve KYC');
    }
  }
);

// Reject KYC
export const rejectKYC = createAsyncThunk(
  'kyc/reject',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/kyc/${id}/reject`, { reason });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject KYC');
    }
  }
);

const kycSlice = createSlice({
  name: 'kyc',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get KYC submissions cases
      .addCase(getKYCSubmissions.pending, (state) => {
        state.loading = true;
      })
      .addCase(getKYCSubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.kycSubmissions = action.payload.submissions;
        state.totalSubmissions = action.payload.total;
      })
      .addCase(getKYCSubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Approve KYC
      .addCase(approveKYC.fulfilled, (state, action) => {
        const index = state.kycSubmissions.findIndex(sub => sub._id === action.payload._id);
        if (index !== -1) {
          state.kycSubmissions[index] = action.payload;
        }
      })
      // Reject KYC
      .addCase(rejectKYC.fulfilled, (state, action) => {
        const index = state.kycSubmissions.findIndex(sub => sub._id === action.payload._id);
        if (index !== -1) {
          state.kycSubmissions[index] = action.payload;
        }
      });
  }
});

export const { clearError } = kycSlice.actions;
export default kycSlice.reducer;