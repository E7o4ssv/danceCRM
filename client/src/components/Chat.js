import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaComments, FaPaperPlane, FaSmile } from 'react-icons/fa';

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock messages for demo
  useEffect(() => {
    setMessages([
      {
        id: 1,
        user: 'Анна Петрова',
        message: 'Привет всем! Как дела с подготовкой к выступлению?',
        timestamp: new Date(Date.now() - 3600000),
        isCurrentUser: false
      },
      {
        id: 2,
        user: user?.name || 'Вы',
        message: 'Привет! Все отлично, репетируем каждый день.',
        timestamp: new Date(Date.now() - 1800000),
        isCurrentUser: true
      }
    ]);
  }, [user]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      user: user?.name || 'Вы',
      message: newMessage,
      timestamp: new Date(),
      isCurrentUser: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="container py-8">
          <h1 className="page-title flex items-center gap-3">
            <FaComments />
            Чат группы
          </h1>
          <p className="page-subtitle">
            Общение с участниками группы
          </p>
        </div>
      </div>

      <div className="container">
        <div className="card max-w-4xl mx-auto">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4 border-b border-white/20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.isCurrentUser
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  {!msg.isCurrentUser && (
                    <div className="text-xs text-white/70 mb-1">{msg.user}</div>
                  )}
                  <div className="text-sm">{msg.message}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Введите сообщение..."
                className="form-control flex-1"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !newMessage.trim()}
                className="btn btn-primary px-4"
              >
                <FaPaperPlane />
              </button>
            </div>
          </form>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-white/60">
            <FaSmile />
            <span>Будьте вежливы и уважительны в общении</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat; 