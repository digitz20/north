import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [supportOnlineAgents, setSupportOnlineAgents] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    const createSocket = () => {
      const token = localStorage.getItem('adminToken');
      if (token && token !== 'undefined' && token !== 'null' && !socketRef.current) {
        const socketUrl = 'https://established-vanny-digitz-b5fdc94b.koyeb.app';
        const newSocket = io(socketUrl, {
          auth: { token },
          query: { token },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000
        });

        newSocket.on('connect', () => {
          console.log('Admin socket connected:', newSocket.id);
          setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
          console.log('Admin socket disconnected:', reason);
          setIsConnected(false);
          if (reason === 'io server disconnect') {
            socketRef.current = null;
            setSocket(null);
          }
        });

        newSocket.on('connect_error', (error) => {
          console.error('Admin socket connection error:', error);
          setIsConnected(false);
        });

        newSocket.on('reconnect', (attemptNumber) => {
          console.log(`Admin reconnected after ${attemptNumber} attempts`);
          setIsConnected(true);
        });

        newSocket.on('supportStatus', (data) => {
          setSupportOnlineAgents(data.agentCount || 0);
        });

        socketRef.current = newSocket;
        setSocket(newSocket);
      }
    };

    createSocket();

    const interval = setInterval(createSocket, 3000);

    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Join a chat room
  const joinChat = useCallback((ticketId) => {
    if (socket) {
      socket.emit('joinChat', ticketId);
    }
  }, [socket]);

  // Leave chat room
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
    supportOnlineAgents,
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