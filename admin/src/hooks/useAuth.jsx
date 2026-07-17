import { useSelector } from 'react-redux';

export const useAuth = () => {
  const { isAuthenticated, user, token } = useSelector((state) => state.auth);
  
  return {
    isAuthenticated,
    user,
    token,
    isAdmin: user?.role === 'admin' || user?.role === 'super-admin'
  };
};

export default useAuth;