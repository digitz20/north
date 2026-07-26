import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext();


export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user, token } = useSelector(state => state.auth);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [supportOnline, setSupportOnline] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const tokenFromStorage = sessionStorage.getItem('token');
    const userFromStorage = sessionStorage.getItem('user');
    
    // Prevent duplicate socket connections - only create if no existing socket and we have valid credentials
    if (tokenFromStorage && userFromStorage && !socketRef.current) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'https://established-vanny-digitz-b5fdc94b.koyeb.app';
      
      const newSocket = io(socketUrl, {
        auth: { token: tokenFromStorage },
        query: { token: tokenFromStorage },
        reconnection: true,
        reconnectionAttempts: 5, // Limit reconnection attempts to prevent infinite loops
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        setSocketError(null);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        setSocketError(reason === 'io server disconnect'
          ? 'Server disconnected the session. Please refresh or log in again.'
          : 'Live connection lost. Trying to reconnect automatically...');
        if (reason === 'io server disconnect') {
          socketRef.current = null;
          setSocket(null);
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
        setSocketError('Unable to reach the live support server. Please check your connection and try again.');
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log(`Reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
      });

      // Listen for support status updates
      newSocket.on('supportStatus', (data) => {
        setSupportOnline(data.online);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      return () => {
        if (newSocket) {
          newSocket.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [token, user]); // No dependencies - socket manages its own connection lifecycle

  // Join a chat room
  const joinChat = useCallback((ticketId) => {
    if (socket) {
      socket.emit('joinChat', ticketId);
    }
  }, [socket]);

  // Leave a chat room
  const leaveChat = useCallback((ticketId) => {
    if (socket) {
      socket.emit('leaveChat', ticketId);
    }
  }, [socket]);

  // Send a message
  const sendMessage = useCallback((data) => {
    if (socket) {
      socket.emit('sendMessage', data);
    }
  }, [socket]);

  // Emit typing event
  const emitTyping = useCallback((ticketId) => {
    if (socket) {
      socket.emit('typing', { ticketId });
    }
  }, [socket]);

  // Emit stop typing event
  const emitStopTyping = useCallback((ticketId) => {
    if (socket) {
      socket.emit('stopTyping', { ticketId });
    }
  }, [socket]);

  // Mark message as read
  const markMessageAsRead = useCallback((ticketId, messageId) => {
    if (socket) {
      socket.emit('messageRead', { ticketId, messageId });
    }
  }, [socket]);

  const clearSocketError = useCallback(() => setSocketError(null), []);

  const value = {
    socket,
    isConnected,
    supportOnline,
    socketError,
    clearSocketError,
    joinChat,
    leaveChat,
    sendMessage,
    emitTyping,
    emitStopTyping,
    markMessageAsRead
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;