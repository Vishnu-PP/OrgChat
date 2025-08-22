import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import ChatWindow from './ChatWindow';

const socket = io(process.env.REACT_APP_SOCKET_URL, {
  auth: { token: localStorage.getItem('token') },
});

const ChatDashboard = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStatus, setUserStatus] = useState({});
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    socket.emit('join', currentUser.id);

    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setUsers(res.data.filter((user) => user._id !== currentUser.id));
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();

    socket.on('userStatus', ({ userId, status }) => {
      setUserStatus((prev) => ({ ...prev, [userId]: status }));
    });

    return () => {
      socket.off('userStatus');
    };
  }, [currentUser.id]);

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-full md:w-1/4 bg-white border-r p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Users</h2>
        {users.map((user) => (
          <div
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`p-2 mb-2 rounded cursor-pointer ${
              selectedUser?._id === user._id ? 'bg-blue-100' : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center">
              <span
                className={`w-3 h-3 rounded-full mr-2 ${
                  userStatus[user._id] === 'online' ? 'bg-green-500' : 'bg-gray-500'
                }`}
              ></span>
              <span>{user.name}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="w-full md:w-3/4 p-4">
        {selectedUser ? (
          <ChatWindow socket={socket} selectedUser={selectedUser} currentUser={currentUser} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a user to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatDashboard;