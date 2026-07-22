import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, token } = useSelector(state => state.auth);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [supportOnline, setSupportOnline] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || 'https://established-vanny-digitz-b5fdc94b.koyeb.app';
    
    let newSocket;
    try {
      newSocket = io(socketUrl, {
        auth: { token },
        query: { token },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
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
          try {
            newSocket.disconnect();
          } catch (e) {
            console.warn('Error disconnecting socket:', e);
          }
        }
      };
    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  }, [token, user]);

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

  const value = {
    socket,
    isConnected,
    supportOnline,
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