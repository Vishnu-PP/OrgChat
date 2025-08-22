import React, { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import ChatWindow from "./ChatWindow";

const socket = io(process.env.REACT_APP_SOCKET_URL, {
  auth: { token: localStorage.getItem("token") },
});

const ChatDashboard = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStatus, setUserStatus] = useState({});
  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    socket.emit("join", currentUser.id);

    const fetchUsers = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/users`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setUsers(res.data.filter((user) => user._id !== currentUser.id));
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();

    socket.on("userStatus", ({ userId, status }) => {
      setUserStatus((prev) => ({ ...prev, [userId]: status }));
    });

    return () => {
      socket.off("userStatus");
    };
  }, [currentUser.id]);

  return (
    <div className="flex h-screen bg-gray-100">
      
      <div className="w-full md:w-1/4 bg-white border-r p-4 overflow-y-auto"><div className="w-full bg-white p-4 flex justify-between items-center border-b">
        <h1 className="text-2xl font-bold text-gray-800">OrgChat</h1>
        <div className="flex items-center space-x-4">
          <button className="text-gray-600 hover:text-gray-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>
          <button className="text-gray-600 hover:text-gray-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/";
            }}
            className="text-gray-600 hover:text-gray-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
        <h2 className="text-xl font-bold mb-4 mt-4">Users</h2>
        {users.map((user) => (
          <div
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`p-2 mb-2 rounded cursor-pointer ${
              selectedUser?._id === user._id
                ? "bg-blue-100"
                : "hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center">
              <span
                className={`w-3 h-3 rounded-full mr-2 ${
                  userStatus[user._id] === "online"
                    ? "bg-green-500"
                    : "bg-gray-500"
                }`}
              ></span>
              <span>{user.name}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="w-full md:w-3/4 p-4">
        {selectedUser ? (
          <ChatWindow
            socket={socket}
            selectedUser={selectedUser}
            currentUser={currentUser}
          />
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
