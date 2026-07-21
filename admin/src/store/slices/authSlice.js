import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../services/api';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('adminToken'),
  refreshToken: localStorage.getItem('adminRefreshToken'),
  isAuthenticated: false,
  loading: false,
  error: null,
  restoring: true
};

// Admin login
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post('/admin/login', credentials);
      const { token, refreshToken, user } = response.data.data;
      
      // Ensure user has admin privileges
      if (user.role !== 'admin' && user.role !== 'super-admin') {
        return rejectWithValue('Unauthorized: Admin access required');
      }
      
      // Store tokens in localStorage
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminRefreshToken', refreshToken);
      
      return { token, refreshToken, user };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Admin login failed');
    }
  }
);

// Logout admin
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axios.post('/auth/logout');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
    } catch (error) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// Get current admin user
export const getCurrentAdmin = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/auth/me');
      const user = response.data.data.user;
      
      // Verify admin privileges
      if (user.role !== 'admin' && user.role !== 'super-admin') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        return rejectWithValue('Unauthorized: Admin access required');
      }
      
      return user;
    } catch (error) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Logout cases
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      
      // Get current user cases
      .addCase(getCurrentAdmin.pending, (state) => {
        state.loading = true;
        state.restoring = true;
      })
      .addCase(getCurrentAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.restoring = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(getCurrentAdmin.rejected, (state, action) => {
        state.loading = false;
        state.restoring = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = action.payload;
      });
  }
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;