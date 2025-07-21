import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const useSocket = (serverPath) => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Создаем соединение
    socketRef.current = io(serverPath, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Cleanup при размонтировании
    return () => {
      socket.disconnect();
    };
  }, [serverPath]);

  // Функции для управления чатами
  const joinChat = (chatId) => {
    if (socketRef.current && chatId) {
      socketRef.current.emit('join-chat', chatId);
    }
  };

  const leaveChat = (chatId) => {
    if (socketRef.current && chatId) {
      socketRef.current.emit('leave-chat', chatId);
    }
  };

  // Функция для подписки на события
  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  // Функция для отписки от событий
  const off = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  return {
    socket: socketRef.current,
    joinChat,
    leaveChat,
    on,
    off
  };
};

export default useSocket; 