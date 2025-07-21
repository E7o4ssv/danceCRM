import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import useSocket from '../hooks/useSocket';
import { 
  FaComments, FaSearch, FaPlus, FaPaperPlane, FaUser,
  FaArrowLeft, FaCircle
} from 'react-icons/fa';

const Chat = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showUserList, setShowUserList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  
  // Инициализируем Socket.io
  const socketUrl = process.env.NODE_ENV === 'production' 
    ? 'http://89.104.71.170:5000' 
    : 'http://localhost:3001';
  const { joinChat, leaveChat, on, off } = useSocket(socketUrl);

  useEffect(() => {
    fetchChats();
    fetchUsers();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket.io обработчики событий
  useEffect(() => {
    const handleNewMessage = (data) => {
      const { chatId, message, partnerId } = data;
      
      // Если получено сообщение для текущего выбранного чата
      if (selectedChat && selectedChat._id === chatId) {
        setMessages(prev => [...prev, message]);
      }
      
      // Обновляем список чатов для отображения нового сообщения
      fetchChats();
    };

    // Подписываемся на событие новых сообщений
    on('new-message', handleNewMessage);

    // Отписываемся при размонтировании
    return () => {
      off('new-message', handleNewMessage);
    };
  }, [selectedChat, on, off]);

  // Присоединяемся к комнате чата при выборе диалога
  useEffect(() => {
    if (selectedChat && selectedChat._id) {
      joinChat(selectedChat._id);
      
      // Покидаем комнату при смене чата
      return () => {
        leaveChat(selectedChat._id);
      };
    }
  }, [selectedChat, joinChat, leaveChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChats = async () => {
    try {
      const response = await api.get('/api/private-chat/chats');
      setChats(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChats([]);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/private-chat/users');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchMessages = async (partnerId) => {
    try {
      const response = await api.get(`/api/private-chat/chats/${partnerId}`);
      setSelectedChat(response.data);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat?.partner) return;

    const messageContent = newMessage.trim();
    
    // Оптимистичное обновление - показываем сообщение сразу
    const optimisticMessage = {
      _id: `temp-${Date.now()}`, // временный ID
      content: messageContent,
      timestamp: new Date().toISOString(),
      sender: {
        _id: user._id,
        name: user.name,
        isMe: true
      }
    };

    // Добавляем сообщение сразу для быстрого отклика
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      const response = await api.post(
        `/api/private-chat/chats/${selectedChat.partner._id}/messages`,
        { content: messageContent }
      );
      
      // Заменяем временное сообщение на реальное с сервера
      const newMsg = response.data;
      setMessages(prev => prev.map(msg => 
        msg._id === optimisticMessage._id ? newMsg : msg
      ));
      
      // Обновляем selectedChat тоже
      setSelectedChat(prev => ({
        ...prev,
        messages: prev.messages?.map(msg => 
          msg._id === optimisticMessage._id ? newMsg : msg
        ) || [newMsg]
      }));
      
      // Обновляем список чатов для корректного отображения последнего сообщения
      fetchChats();
    } catch (error) {
      console.error('Error sending message:', error);
      // В случае ошибки удаляем оптимистичное сообщение
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
    }
  };

  const startNewChat = (partner) => {
    setSelectedChat({
      _id: null,
      partner,
      messages: []
    });
    setMessages([]);
    setShowUserList(false);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  const filteredUsers = (users || []).filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChats = (chats || []).filter(chat =>
    chat.partner && chat.partner.name && chat.partner.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-card">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-white/70">Загрузка сообщений...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="container pt-8">
        <div className="flex h-[calc(100vh-12rem)] bg-dark-800/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          
          {/* Sidebar with chats list */}
          <div className={`w-80 border-r border-white/10 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FaComments className="w-5 h-5" />
                  Сообщения
                </h2>
                <button
                  onClick={() => setShowUserList(!showUserList)}
                  className="p-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-white transition-colors"
                  title="Новое сообщение"
                >
                  <FaPlus className="w-4 h-4" />
                </button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary-400"
                />
              </div>
            </div>

            {/* Chats/Users List */}
            <div className="flex-1 overflow-y-auto">
              {showUserList ? (
                /* Users list for new chat */
                <div className="p-2">
                  <div className="flex items-center gap-2 p-2 text-white/60 text-sm">
                    <FaUser className="w-3 h-3" />
                    Выберите собеседника
                  </div>
                  {filteredUsers.map((partner) => (
                    <button
                      key={partner._id}
                      onClick={() => startNewChat(partner)}
                      className="w-full p-3 text-left hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                          <FaUser className="w-4 h-4 text-white" />
                        </div>
          <div>
                          <div className="font-medium text-white text-sm">{partner.name}</div>
                          <div className="text-white/50 text-xs capitalize">{partner.role}</div>
          </div>
        </div>
                    </button>
                  ))}
                </div>
              ) : (
                /* Existing chats list */
                <div className="p-2">
                  {filteredChats.length === 0 ? (
                    <div className="text-center py-8">
                      <FaComments className="w-12 h-12 text-white/20 mx-auto mb-3" />
                      <p className="text-white/50">Нет диалогов</p>
                      <p className="text-white/30 text-sm">Нажмите + чтобы начать общение</p>
                    </div>
                  ) : (
                    filteredChats.map((chat) => (
                      <button
                        key={chat._id}
                        onClick={() => fetchMessages(chat.partner._id)}
                        className={`w-full p-3 text-left rounded-lg transition-colors ${
                          selectedChat?.partner?._id === chat.partner._id
                            ? 'bg-primary-500/20 border border-primary-500/30'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                              <FaUser className="w-4 h-4 text-white" />
                            </div>
                            {chat.unreadCount > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-xs text-white font-bold">{chat.unreadCount}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-white text-sm truncate">{chat.partner.name}</div>
                              {chat.lastMessage && (
                                <div className="text-white/40 text-xs">{formatTime(chat.lastMessage.timestamp)}</div>
                              )}
                            </div>
                            {chat.lastMessage ? (
                              <div className="text-white/50 text-xs truncate">
                                {chat.lastMessage.sender === 'me' ? 'Вы: ' : ''}{chat.lastMessage.content}
            </div>
          ) : (
                              <div className="text-white/30 text-xs">Начните общение</div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                      )}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="md:hidden p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                  >
                    <FaArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <FaUser className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{selectedChat.partner.name}</div>
                    <div className="text-white/50 text-sm capitalize">{selectedChat.partner.role}</div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <FaComments className="w-16 h-16 text-white/20 mx-auto mb-4" />
                      <p className="text-white/50 text-lg">Начните беседу</p>
                      <p className="text-white/30">Отправьте первое сообщение</p>
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const showDate = index === 0 || 
                        formatDate(messages[index - 1].timestamp) !== formatDate(message.timestamp);
                      
                      return (
                        <div key={message._id}>
                          {showDate && (
                            <div className="text-center my-4">
                              <span className="bg-white/10 px-3 py-1 rounded-full text-white/60 text-sm">
                                {formatDate(message.timestamp)}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${message.sender.isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              message.sender.isMe
                                ? 'bg-primary-500 text-white'
                                : 'bg-white/10 text-white'
                            }`}>
                              <div className="text-sm">{message.content}</div>
                              <div className={`text-xs mt-1 ${
                                message.sender.isMe ? 'text-white/70' : 'text-white/50'
                              }`}>
                                {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

      {/* Message Input */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Введите сообщение..."
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary-400"
            />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                    >
                      <FaPaperPlane className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Empty state */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FaComments className="w-24 h-24 text-white/20 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-white mb-2">Выберите диалог</h3>
                  <p className="text-white/50">Выберите существующий диалог или начните новый</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat; 