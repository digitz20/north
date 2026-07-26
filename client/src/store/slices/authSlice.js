import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../services/api';

// Initial state
const initialState = {
  user: null,
  token: sessionStorage.getItem('token'),
  refreshToken: sessionStorage.getItem('refreshToken'),
  isAuthenticated: false,
  loading: false,
  error: null
};

// Check if session has expired
const isSessionExpired = () => {
  const sessionExpiry = sessionStorage.getItem('sessionExpiry');
  if (!sessionExpiry) return false;
  return Date.now() > parseInt(sessionExpiry);
};

// Clear session data
const clearSession = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('sessionExpiry');
};

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/login', credentials, { timeout: 15000 });
      const { token, refreshToken, user } = response.data.data;
      
      // Store tokens in sessionStorage
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('refreshToken', refreshToken);
      sessionStorage.setItem('sessionExpiry', Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      return { token, refreshToken, user };
    } catch (error) {
      if (!error.response) {
        return rejectWithValue('Network error: Unable to reach the server. Please check your connection and try again.');
      }
      const status = error.response?.status;
      const message = error.response?.data?.message || 'Login failed';
      if (status === 400) {
        return rejectWithValue(message);
      }
      if (status === 401) {
        return rejectWithValue(message || 'Invalid credentials');
      }
      if (status === 403) {
        return rejectWithValue(message);
      }
      if (status === 404) {
        return rejectWithValue('Login service is temporarily unavailable. Please try again later.');
      }
      return rejectWithValue(message);
    }
  }
);

// Logout user
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axios.post('/auth/logout');
      clearSession();
    } catch (error) {
      clearSession();
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// Get current user
export const getCurrentUser = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      if (isSessionExpired()) {
        clearSession();
        return rejectWithValue('Session expired');
      }
      const response = await axios.get('/auth/me');
      return response.data.data;
    } catch (error) {
      clearSession();
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// Verify email
export const verifyEmail = createAsyncThunk(
  'auth/verify-email',
  async ({ otpId, code }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/verify-email', { otpId, code: String(code).trim() });
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || 'Email verification failed';
      if (status === 400) {
        return rejectWithValue(message || 'Invalid verification code. Please check and try again.');
      }
      if (status === 404) {
        return rejectWithValue('Verification session not found. Please register again or request a new code.');
      }
      return rejectWithValue(message);
    }
  }
);

// Resend verification email
export const resendVerificationEmail = createAsyncThunk(
  'auth/resend-verification',
  async (email, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/resend-verification', { email });
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || 'Failed to resend verification email';
      if (status === 404) {
        return rejectWithValue(message || 'Email verification service is temporarily unavailable. Please contact support or try again later.');
      }
      if (status === 429) {
        return rejectWithValue('Too many requests. Please wait a few minutes before trying again.');
      }
      return rejectWithValue(message);
    }
  }
);

// Update user settings
export const updateSettings = createAsyncThunk(
  'auth/updateSettings',
  async (settingsData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/settings', settingsData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update settings');
    }
  }
);

// Forgot password
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send reset email');
    }
  }
);

// Reset password
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ otpId, code, newPassword }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/reset-password', { otpId, code, newPassword });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reset password');
    }
  }
);

// Change password
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/change-password', { currentPassword, newPassword });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change password');
    }
  }
);

// Setup transaction PIN
export const setupTransactionPin = createAsyncThunk(
  'auth/setupTransactionPin',
  async ({ pin, confirmPin }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/setup-transaction-pin', { pin, confirmPin });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to setup PIN');
    }
  }
);

// Verify transaction PIN
export const verifyTransactionPin = createAsyncThunk(
  'auth/verifyTransactionPin',
  async (pin, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/verify-transaction-pin', { pin });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'PIN verification failed');
    }
  }
);

// Change transaction PIN
export const changeTransactionPin = createAsyncThunk(
  'auth/changeTransactionPin',
  async ({ currentPin, newPin, confirmNewPin }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/change-transaction-pin', { currentPin, newPin, confirmNewPin });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change PIN');
    }
  }
);

// Forgot transaction PIN
export const forgotTransactionPin = createAsyncThunk(
  'auth/forgotTransactionPin',
  async (email, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/forgot-transaction-pin', { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reset PIN');
    }
  }
);

// Reset transaction PIN via reset token
export const resetTransactionPin = createAsyncThunk(
  'auth/resetTransactionPin',
  async ({ token, newPin, confirmNewPin }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/reset-transaction-pin', { token, newPin, confirmNewPin });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reset PIN');
    }
  }
);

// Get PIN status
export const getPinStatus = createAsyncThunk(
  'auth/getPinStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/auth/pin-status');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get PIN status');
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
      // Register cases
      .addCase(register.pending, (state) => {
        state.loading = true;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
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
        clearSession();
      })
      
      // Logout cases
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      
      // Get current user cases
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = action.payload;
      })
      
      // Verify email cases
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Resend verification email cases
      .addCase(resendVerificationEmail.pending, (state) => {
        state.loading = true;
      })
      .addCase(resendVerificationEmail.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resendVerificationEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update settings cases
      .addCase(updateSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateSettings.fulfilled, (state) => {
        state.loading = false;
        state.user.settings = action.payload.settings || state.user.settings;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Forgot password cases
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Reset password cases
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Change password cases
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Setup transaction PIN cases
      .addCase(setupTransactionPin.pending, (state) => {
        state.loading = true;
      })
      .addCase(setupTransactionPin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user, pinSetupRequired: false };
      })
      .addCase(setupTransactionPin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Verify transaction PIN cases
      .addCase(verifyTransactionPin.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyTransactionPin.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(verifyTransactionPin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Change transaction PIN cases
      .addCase(changeTransactionPin.pending, (state) => {
        state.loading = true;
      })
      .addCase(changeTransactionPin.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changeTransactionPin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Forgot transaction PIN cases
      .addCase(forgotTransactionPin.pending, (state) => {
        state.loading = true;
      })
      .addCase(forgotTransactionPin.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgotTransactionPin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Reset transaction PIN cases
      .addCase(resetTransactionPin.pending, (state) => {
        state.loading = true;
      })
      .addCase(resetTransactionPin.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetTransactionPin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get PIN status cases
      .addCase(getPinStatus.fulfilled, (state, action) => {
        state.user = { ...state.user, pinSetupRequired: action.payload.pinSetupRequired };
      });
  }
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;