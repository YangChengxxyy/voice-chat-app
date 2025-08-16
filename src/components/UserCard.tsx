'use client';

import React from 'react';
import { User } from '@/types';

interface UserCardProps {
  user: User;
  isCurrentUser?: boolean;
  audioLevel?: number;
  connectionState?: 'connected' | 'connecting' | 'disconnected';
  onToggleMute?: () => void;
}

export function UserCard({
  user,
  isCurrentUser = false,
  audioLevel = 0,
  connectionState = 'disconnected',
  onToggleMute,
}: UserCardProps) {
  // 生成用户头像背景颜色
  const getAvatarColor = (userId: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500',
    ];

    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  };

  // 获取用户名首字母
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // 获取连接状态颜色
  const getConnectionStateColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 计算音频级别的可视化
  const getAudioLevelHeight = () => {
    return Math.max(2, (audioLevel / 100) * 100);
  };

  return (
    <div className="card relative">
      <div className="flex flex-col items-center space-y-4">
        {/* 用户头像 */}
        <div className="relative">
          <div
            className={`
              user-avatar
              ${getAvatarColor(user.id)}
              ${user.isSpeaking && !user.isMuted ? 'speaking' : ''}
              ${user.isMuted ? 'muted' : ''}
            `}
          >
            {getInitials(user.name)}

            {/* 连接状态指示器 */}
            <div
              className={`
                connection-indicator
                ${getConnectionStateColor()}
                ${connectionState}
              `}
            />
          </div>

          {/* 音频级别可视化 */}
          {!user.isMuted && user.isSpeaking && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="flex items-end space-x-1 h-6">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="audio-level-bar bg-green-400 w-1 rounded-t"
                    style={{
                      height: `${Math.min(
                        getAudioLevelHeight(),
                        20 * (i + 1)
                      )}%`,
                      opacity: audioLevel > i * 20 ? 1 : 0.3,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 用户信息 */}
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
            {user.name}
            {isCurrentUser && (
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                (你)
              </span>
            )}
          </h3>

          {/* 状态标签 */}
          <div className="flex flex-wrap justify-center gap-2">
            {user.isMuted && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full dark:bg-red-900 dark:text-red-200">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0 8.97 8.97 0 010 12.728 1 1 0 11-1.414-1.414 6.97 6.97 0 000-9.9 1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0 4.978 4.978 0 010 7.072 1 1 0 11-1.415-1.415 2.978 2.978 0 000-4.242 1 1 0 010-1.415z"
                    clipRule="evenodd"
                  />
                  <path d="M3.293 3.293a1 1 0 011.414 0L18 16.586a1 1 0 01-1.414 1.414L3.293 4.707a1 1 0 010-1.414z" />
                </svg>
                静音
              </span>
            )}

            {user.isSpeaking && !user.isMuted && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-200">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                    clipRule="evenodd"
                  />
                </svg>
                正在说话
              </span>
            )}

            {connectionState === 'connecting' && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full dark:bg-yellow-900 dark:text-yellow-200">
                <div className="w-3 h-3 mr-1">
                  <div className="spinner w-3 h-3 border-2"></div>
                </div>
                连接中
              </span>
            )}

            {connectionState === 'disconnected' && !isCurrentUser && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full dark:bg-gray-900 dark:text-gray-200">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                未连接
              </span>
            )}
          </div>

          {/* 加入时间 */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            加入时间: {new Date(user.joinedAt).toLocaleTimeString()}
          </div>
        </div>

        {/* 当前用户控制按钮 */}
        {isCurrentUser && onToggleMute && (
          <div className="flex justify-center">
            <button
              onClick={() => onToggleMute?.()}
              className={`
                audio-control-button
                ${user.isMuted ? 'muted' : 'unmuted'}
              `}
              aria-label={user.isMuted ? '取消静音' : '静音'}
              title={user.isMuted ? '点击取消静音' : '点击静音'}
            >
              {user.isMuted ? (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M3.293 3.293a1 1 0 011.414 0L18 16.586a1 1 0 01-1.414 1.414L3.293 4.707a1 1 0 010-1.414z" />
                  <path
                    fillRule="evenodd"
                    d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserCard;
