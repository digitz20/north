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
  const socketRef = useRef(null);

  useEffect(() => {
    // Prevent duplicate socket connections - only create if no existing socket and we have valid credentials
    if (token && user && !socketRef.current) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'https://established-vanny-digitz-b5fdc94b.koyeb.app';
      
      const newSocket = io(socketUrl, {
        auth: { token },
        query: { token },
        reconnection: true,
        reconnectionAttempts: 5, // Limit reconnection attempts to prevent infinite loops
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        // If server disconnected us intentionally, clear the socket ref to allow reconnection later
        if (reason === 'io server disconnect') {
          socketRef.current = null;
          setSocket(null);
        }
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
          newSocket.disconnect();
          socketRef.current = null;
        }
      };
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