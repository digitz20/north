import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  beneficiaries: [],
  loading: false,
  error: null
};

export const fetchBeneficiaries = createAsyncThunk(
  'beneficiaries/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/beneficiaries');
      return response.data.data.beneficiaries;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch beneficiaries');
    }
  }
);

export const addBeneficiary = createAsyncThunk(
  'beneficiaries/add',
  async (beneficiaryData, { rejectWithValue }) => {
    try {
      const response = await api.post('/beneficiaries', beneficiaryData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add beneficiary');
    }
  }
);

export const deleteBeneficiary = createAsyncThunk(
  'beneficiaries/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/beneficiaries/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete beneficiary');
    }
  }
);

const beneficiarySlice = createSlice({
  name: 'beneficiaries',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBeneficiaries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBeneficiaries.fulfilled, (state, action) => {
        state.loading = false;
        state.beneficiaries = action.payload;
      })
      .addCase(fetchBeneficiaries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addBeneficiary.fulfilled, (state, action) => {
        state.beneficiaries.push(action.payload);
      })
      .addCase(addBeneficiary.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteBeneficiary.fulfilled, (state, action) => {
        state.beneficiaries = state.beneficiaries.filter(b => b._id !== action.payload);
      });
  }
});

export const { clearError } = beneficiarySlice.actions;
export default beneficiarySlice.reducer;
