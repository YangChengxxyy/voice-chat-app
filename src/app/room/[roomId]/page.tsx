"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import UserCard from "@/components/UserCard";
import AudioControls from "@/components/AudioControls";
import NotificationContainer from "@/components/NotificationContainer";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [userName, setUserName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const {
    currentRoom,
    currentUser,
    users,
    voiceState,
    isInitializing,
    error,
    socketConnected,
    isClient,
    notifications,
    joinRoom,
    leaveRoom,
    toggleMute,
    setVolume,
    getAudioDevices,
    setAudioInputDevice,
    getConnectionStates,
    isWebRTCSupported,
  } = useVoiceChat();

  // 检查浏览器支持
  useEffect(() => {
    if (!isWebRTCSupported) {
      alert(
        "您的浏览器不支持WebRTC，无法使用语音聊天功能。请使用现代浏览器如Chrome、Firefox或Safari。",
      );
      router.push("/");
    }
  }, [isWebRTCSupported, router]);

  // 处理加入房间
  const handleJoinRoom = async () => {
    if (!userName.trim()) {
      alert("请输入您的姓名");
      return;
    }

    try {
      await joinRoom(roomId, userName.trim());
      setHasJoined(true);
    } catch (error) {
      console.error("Failed to join room:", error);
    }
  };

  // 处理离开房间
  const handleLeaveRoom = () => {
    leaveRoom();
    setHasJoined(false);
    router.push("/");
  };

  // 获取连接状态
  const getConnectionState = (userId: string) => {
    if (userId === currentUser?.id) {
      return socketConnected ? "connected" : "disconnected";
    }

    const states = getConnectionStates();
    const state = states[userId];

    if (state === "connected") return "connected";
    if (state === "connecting") return "connecting";
    return "disconnected";
  };

  // 渲染加入房间表单
  const renderJoinForm = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="card max-w-md w-full">
        <div className="text-center space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              加入语音聊天
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              房间 ID: <span className="font-mono font-semibold">{roomId}</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">错误</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="userName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                您的姓名
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleJoinRoom()}
                placeholder="请输入您的姓名"
                maxLength={20}
                className="input"
                disabled={isInitializing}
                autoFocus
              />
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={isInitializing || !userName.trim() || !socketConnected || !isClient}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!isClient ? (
                "初始化中..."
              ) : isInitializing ? (
                <div className="flex items-center justify-center">
                  <div className="spinner w-5 h-5 border-2 mr-2"></div>
                  连接中...
                </div>
              ) : !socketConnected ? (
                "连接服务器中..."
              ) : (
                "加入房间"
              )}
            </button>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-2">
            <p>* 加入房间需要麦克风权限</p>
            <p>* 最多支持4人同时语音通话</p>
            <p>* 请确保您的网络连接稳定</p>
            {!isClient && <p className="text-yellow-600">* 正在初始化客户端...</p>}
          </div>

          <button
            onClick={() => router.push("/")}
            className="btn-secondary w-full"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );

  // 渲染房间界面
  const renderRoom = () => (
    <div className="room-container">
      {/* 头部信息栏 */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentRoom?.name || `房间 ${roomId}`}
              </h1>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${socketConnected ? "bg-green-500" : "bg-red-500"}`}
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {socketConnected ? "已连接" : "连接中断"}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {users.length} / {currentRoom?.maxUsers || 4} 人
              </span>
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="btn-danger"
              >
                离开房间
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 用户列表 */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                参与者 ({users.length})
              </h2>

              {users.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">
                    暂无其他参与者
                  </p>
                </div>
              ) : (
                <div className="users-grid">
                  {users.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      isCurrentUser={user.id === currentUser?.id}
                      audioLevel={
                        user.id === currentUser?.id ? voiceState.audioLevel : 0
                      }
                      connectionState={getConnectionState(user.id)}
                      onToggleMute={
                        user.id === currentUser?.id ? toggleMute : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 音频控制面板 */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <AudioControls
                isMuted={voiceState.isMuted}
                volume={voiceState.volume}
                audioLevel={voiceState.audioLevel}
                onToggleMute={toggleMute}
                onVolumeChange={setVolume}
                onDeviceChange={setAudioInputDevice}
                disabled={!voiceState.isConnected}
              />

              {/* 房间信息 */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  房间信息
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      房间 ID:
                    </span>
                    <span className="font-mono font-medium">{roomId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      创建时间:
                    </span>
                    <span>
                      {currentRoom?.createdAt
                        ? new Date(currentRoom.createdAt).toLocaleString()
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      最大人数:
                    </span>
                    <span>{currentRoom?.maxUsers || 4} 人</span>
                  </div>
                </div>
              </div>

              {/* 快捷键说明 */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  快捷键
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>切换静音:</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      空格
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>离开房间:</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      Ctrl+L
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 离开确认对话框 */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="card max-w-md w-full">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                确认离开房间？
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                离开后您需要重新加入房间才能继续参与语音聊天。
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button onClick={handleLeaveRoom} className="btn-danger flex-1">
                  确认离开
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 空格键切换静音
      if (
        event.code === "Space" &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        const target = event.target as HTMLElement;
        // 只有在不是输入框时才响应
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          event.preventDefault();
          toggleMute();
        }
      }

      // Ctrl+L 离开房间
      if (event.ctrlKey && event.key === "l") {
        event.preventDefault();
        setShowLeaveConfirm(true);
      }
    };

    if (hasJoined) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [hasJoined, toggleMute]);

  // 页面可见性变化处理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Page hidden, maintaining voice connection");
      } else {
        console.log("Page visible, voice connection active");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return (
    <>
      {hasJoined && currentRoom ? renderRoom() : renderJoinForm()}
      <NotificationContainer
        notifications={notifications}
      />
    </>
  );
}
