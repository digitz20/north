import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import transactionReducer from './slices/transactionSlice';
import kycReducer from './slices/kycSlice';
import supportReducer from './slices/supportSlice';

export default configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    transactions: transactionReducer,
    kyc: kycReducer,
    support: supportReducer
  }
});