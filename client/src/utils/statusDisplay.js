// Maps raw status values from the API (e.g. 'pending', 'completed', 'failed')
// to user-friendly display labels + colors for status chips.
const getStatusDisplay = (status) => {
  const s = String(status || 'pending').toLowerCase();
  if (s === 'completed' || s === 'approved') {
    return { label: 'Completed', bgcolor: 'rgba(0,200,150,0.1)', color: '#00C896', chipColor: 'success' };
  }
  if (s === 'failed' || s === 'rejected' || s === 'cancelled') {
    return { label: 'Rejected', bgcolor: 'rgba(255,107,107,0.1)', color: '#FF6B6B', chipColor: 'error' };
  }
  return { label: 'Pending', bgcolor: 'rgba(255,200,87,0.1)', color: '#FFC857', chipColor: 'warning' };
};

export default getStatusDisplay;
