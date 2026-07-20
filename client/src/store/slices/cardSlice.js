import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  cards: [],
  loading: false,
  error: null
};

// Helper to format card data for UI
const formatCardForUI = (card) => ({
  ...card,
  id: card._id,
  maskedNumber: card.lastFourDigits ? `**** **** **** ${card.lastFourDigits}` : '**** **** **** ****',
  holder: card.cardholderName || 'Card Holder',
  expiry: card.formattedExpiry || card.expiryMonth && card.expiryYear 
    ? `${String(card.expiryMonth).padStart(2, '0')}/${String(card.expiryYear).slice(-2)}` 
    : '12/28',
  cvv: '***',
  gradient: card.cardType === 'credit' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
           card.cardType === 'prepaid' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 
           'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  status: card.isLocked ? 'Locked' : (card.isActive ? 'Active' : 'Inactive'),
  type: card.cardType ? card.cardType.charAt(0).toUpperCase() + card.cardType.slice(1) + ' Card' : 'Card',
  network: card.cardNetwork || 'VISA'
});

// Get user cards
export const getUserCards = createAsyncThunk(
  'cards/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/cards');
      const formattedCards = (response.data.data || []).map(formatCardForUI);
      return { cards: formattedCards };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cards');
    }
  }
);

// Create new card
export const createCard = createAsyncThunk(
  'cards/create',
  async (cardData, { rejectWithValue }) => {
    try {
      const response = await api.post('/cards', cardData);
      // Format the new card for UI
      return formatCardForUI(response.data.data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create card');
    }
  }
);

// Freeze card
export const freezeCard = createAsyncThunk(
  'cards/freeze',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.put(`/cards/${id}/freeze`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to freeze card');
    }
  }
);

// Unfreeze card
export const unfreezeCard = createAsyncThunk(
  'cards/unfreeze',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.put(`/cards/${id}/unfreeze`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unfreeze card');
    }
  }
);

// Delete card
export const deleteCard = createAsyncThunk(
  'cards/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/cards/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete card');
    }
  }
);

const cardSlice = createSlice({
  name: 'cards',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get user cards cases
      .addCase(getUserCards.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserCards.fulfilled, (state, action) => {
        state.loading = false;
        state.cards = action.payload.cards;
      })
      .addCase(getUserCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create card cases
      .addCase(createCard.fulfilled, (state, action) => {
        state.cards.push(action.payload);
      })
      // Freeze/unfreeze card cases
      .addCase(freezeCard.fulfilled, (state, action) => {
        const index = state.cards.findIndex(card => card.id === action.payload._id);
        if (index !== -1) {
          state.cards[index] = formatCardForUI(action.payload);
        }
      })
      .addCase(unfreezeCard.fulfilled, (state, action) => {
        const index = state.cards.findIndex(card => card.id === action.payload._id);
        if (index !== -1) {
          state.cards[index] = formatCardForUI(action.payload);
        }
      })
      // Delete card case
      .addCase(deleteCard.fulfilled, (state, action) => {
        state.cards = state.cards.filter(card => card._id !== action.payload);
      });
  }
});

export const { clearError } = cardSlice.actions;
export default cardSlice.reducer;