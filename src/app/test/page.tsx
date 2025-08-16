"use client";

import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export default function TestPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState("disconnected");
  const [messages, setMessages] = useState<string[]>([]);
  const [testMessage, setTestMessage] = useState("");
  const socketRef = useRef<Socket | null>(null);

  const addMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    addMessage("🔄 Initializing Socket.io connection...");

    const socket = io("http://localhost:3001", {
      transports: ["polling", "websocket"],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      autoConnect: true,
    });

    socketRef.current = socket;

    // 连接事件
    socket.on("connect", () => {
      addMessage("✅ Connected to server");
      setIsConnected(true);
      setConnectionState("connected");

      // 发送连接测试
      socket.emit("connection-test");
    });

    socket.on("disconnect", (reason) => {
      addMessage(`❌ Disconnected: ${reason}`);
      setIsConnected(false);
      setConnectionState("disconnected");
    });

    socket.on("connect_error", (error) => {
      addMessage(`🔥 Connection error: ${error.message}`);
      setConnectionState("error");
    });

    socket.on("reconnect", (attemptNumber) => {
      addMessage(`🔄 Reconnected after ${attemptNumber} attempts`);
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      addMessage(`🔄 Reconnection attempt #${attemptNumber}`);
      setConnectionState("reconnecting");
    });

    socket.on("reconnect_error", (error) => {
      addMessage(`❌ Reconnection error: ${error.message}`);
    });

    socket.on("reconnect_failed", () => {
      addMessage("❌ Reconnection failed");
      setConnectionState("failed");
    });

    // 自定义事件
    socket.on("welcome", (data) => {
      addMessage(`🎉 Welcome message: ${data.message}`);
    });

    socket.on("test-response", (data) => {
      addMessage(`📥 Test response: ${JSON.stringify(data)}`);
    });

    socket.on("connection-confirmed", (data) => {
      addMessage(`✅ Connection confirmed: ${JSON.stringify(data)}`);
    });

    socket.on("ping", () => {
      addMessage("💓 Ping from server");
      socket.emit("pong");
    });

    socket.on("pong", () => {
      addMessage("💓 Pong from server");
    });

    // 调试发送的事件
    const originalEmit = socket.emit;
    socket.emit = function(event, ...args) {
      if (event !== 'pong') { // 避免心跳日志刷屏
        addMessage(`📤 Sending: ${event} ${args.length > 0 ? JSON.stringify(args) : ''}`);
      }
      return originalEmit.apply(socket, [event, ...args]);
    };

    return () => {
      addMessage("🔄 Cleaning up connection...");
      socket.disconnect();
    };
  }, []);

  const sendTestMessage = () => {
    if (socketRef.current && testMessage.trim()) {
      socketRef.current.emit("test-message", {
        text: testMessage,
        timestamp: new Date().toISOString()
      });
      setTestMessage("");
    }
  };

  const sendPing = () => {
    if (socketRef.current) {
      socketRef.current.emit("ping");
    }
  };

  const forceDisconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  const forceReconnect = () => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  };

  const clearLogs = () => {
    setMessages([]);
  };

  const getStatusColor = () => {
    switch (connectionState) {
      case "connected": return "bg-green-500";
      case "reconnecting": return "bg-yellow-500";
      case "error":
      case "failed":
      case "disconnected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Socket.io 连接测试
          </h1>

          {/* 连接状态 */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${getStatusColor()}`}></div>
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  连接状态: {connectionState}
                </span>
                <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">
                  {isConnected ? "已连接" : "未连接"}
                </span>
              </div>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={sendPing}
              disabled={!isConnected}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              发送 Ping
            </button>

            <button
              onClick={forceDisconnect}
              disabled={!isConnected}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              强制断开
            </button>

            <button
              onClick={forceReconnect}
              disabled={isConnected}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              重新连接
            </button>

            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              清空日志
            </button>
          </div>

          {/* 测试消息 */}
          <div className="mb-6">
            <div className="flex space-x-3">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendTestMessage()}
                placeholder="输入测试消息..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <button
                onClick={sendTestMessage}
                disabled={!isConnected || !testMessage.trim()}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                发送测试
              </button>
            </div>
          </div>

          {/* 日志区域 */}
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            <div className="mb-2 text-white font-bold">实时日志:</div>
            {messages.length === 0 ? (
              <div className="text-gray-500">等待日志...</div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className="mb-1">
                  {message}
                </div>
              ))
            )}
          </div>

          {/* 返回链接 */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← 返回主页
            </a>
          </div>

          {/* 调试信息 */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">调试信息:</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div>服务器地址: http://localhost:3001</div>
              <div>传输方式: polling → websocket</div>
              <div>超时时间: 20000ms</div>
              <div>重连尝试: 5次</div>
              <div>Socket ID: {socketRef.current?.id || "未连接"}</div>
              <div>当前传输: {socketRef.current?.io?.engine?.transport?.name || "未知"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
