import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ChatWindow = ({ socket, selectedUser, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/messages`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          params: { userId: selectedUser._id },
        });
        setMessages(res.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    socket.on('receiveMessage', (newMessage) => {
      if (
        (newMessage.sender === selectedUser._id && newMessage.receiver === currentUser.id) ||
        (newMessage.sender === currentUser.id && newMessage.receiver === selectedUser._id)
      ) {
        setMessages((prev) => [...prev, newMessage]);
      }
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [socket, selectedUser._id, currentUser.id]);
  useEffect(() => {
    // ...existing code for socket connection and message handling...
    const bc = new window.BroadcastChannel('orgchat_notifications');
    socket.on('message', (message) => {
      // ...existing code to update chat UI...

      // Show notification only if window is not focused
      if (document.visibilityState !== 'visible') {
        // Notify other tabs to avoid duplicate notifications
        bc.postMessage({ type: 'new-message', message });
      }
    });

    // Listen for notification events from other tabs
    bc.onmessage = (event) => {
      if (event.data.type === 'new-message') {
        if (document.visibilityState !== 'visible' && Notification.permission === 'granted') {
          const { message } = event.data;
          new Notification(`New message from ${message.senderName || 'Someone'}`, {
            body: message.text || '',
            icon: '/favicon.ico',
          });
        }
      }
    };

    // ...existing code...
    return () => {
      bc.close();
      // ...existing cleanup code...
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const newMessage = {
        sender: currentUser.id,
        receiver: selectedUser._id,
        content: message,
      };
      socket.emit('sendMessage', newMessage);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white p-4 border-b">
        <h2 className="text-xl font-bold">{selectedUser.name}</h2>
      </div>
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 flex ${
              msg.sender === currentUser.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`p-2 rounded-lg max-w-xs ${
                msg.sender === currentUser.id ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              <p>{msg.content}</p>
              <p className="text-xs text-gray-400">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
        <div className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-l"
          />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded-r hover:bg-blue-600">
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;