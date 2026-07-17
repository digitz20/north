import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../services/api';

const initialState = {
  tickets: [],
  loading: false,
  error: null,
  totalTickets: 0
};

// Get all support tickets
export const getSupportTickets = createAsyncThunk(
  'support/getAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get('/support', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch support tickets');
    }
  }
);

// Update ticket status
export const updateTicketStatus = createAsyncThunk(
  'support/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/support/${id}/status`, { status });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update ticket');
    }
  }
);

// Add response to ticket
export const addTicketResponse = createAsyncThunk(
  'support/addResponse',
  async ({ id, message }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/support/${id}/responses`, { message });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add response');
    }
  }
);

const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get tickets cases
      .addCase(getSupportTickets.pending, (state) => {
        state.loading = true;
      })
      .addCase(getSupportTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload.tickets;
        state.totalTickets = action.payload.total;
      })
      .addCase(getSupportTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update ticket status
      .addCase(updateTicketStatus.fulfilled, (state, action) => {
        const index = state.tickets.findIndex(ticket => ticket._id === action.payload._id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
      })
      // Add ticket response
      .addCase(addTicketResponse.fulfilled, (state, action) => {
        const index = state.tickets.findIndex(ticket => ticket._id === action.payload._id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
      });
  }
});

export const { clearError } = supportSlice.actions;
export default supportSlice.reducer;