import { useState } from 'react';
import api from '../services/api';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/transactions', { params });
      setTransactions(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transactions');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTransactionById = async (id) => {
    try {
      const response = await api.get(`/admin/transactions/${id}`);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transaction');
      throw err;
    }
  };

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    getTransactionById
  };
};

export default useTransactions;