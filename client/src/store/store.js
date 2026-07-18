import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import accountReducer from './slices/accountSlice';
import transactionReducer from './slices/transactionSlice';
import notificationReducer from './slices/notificationSlice';
import cardReducer from './slices/cardSlice';
import investmentReducer from './slices/investmentSlice';
import loanReducer from './slices/loanSlice';

export default configureStore({
  reducer: {
    auth: authReducer,
    accounts: accountReducer,
    transactions: transactionReducer,
    notifications: notificationReducer,
    cards: cardReducer,
    investments: investmentReducer,
    loans: loanReducer
  }
});