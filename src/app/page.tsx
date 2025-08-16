'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function HomePage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // 创建新房间
  const handleCreateRoom = () => {
    setIsCreating(true);
    const newRoomId = uuidv4().slice(0, 8); // 使用短ID
    router.push(`/room/${newRoomId}`);
  };

  // 加入现有房间
  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      alert('请输入房间ID');
      return;
    }
    router.push(`/room/${roomId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 导航栏 */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                VoiceChat Mini
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 标题和描述 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            实时语音聊天
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            基于WebRTC技术的高质量语音通话，支持最多4人同时在线，无需下载任何软件。
          </p>

          {/* 特性列表 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">高质量音频</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                采用先进的回声消除和噪声抑制技术
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">即时连接</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                无需注册，创建或加入房间即可开始聊天
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">安全私密</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                点对点加密传输，保护您的隐私安全
              </p>
            </div>
          </div>
        </div>

        {/* 操作卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* 创建房间 */}
          <div className="card">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  创建新房间
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  创建一个新的语音聊天房间，邀请朋友加入
                </p>
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="btn-primary w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner w-5 h-5 border-2 mr-2"></div>
                    创建中...
                  </div>
                ) : (
                  '创建房间'
                )}
              </button>

              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>• 房间创建后会自动生成唯一ID</p>
                <p>• 分享房间ID给朋友即可邀请加入</p>
                <p>• 房间支持最多4人同时在线</p>
              </div>
            </div>
          </div>

          {/* 加入房间 */}
          <div className="card">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  加入房间
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  输入房间ID加入现有的语音聊天房间
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    房间ID
                  </label>
                  <input
                    type="text"
                    id="roomId"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                    placeholder="请输入8位房间ID"
                    maxLength={8}
                    className="input text-center font-mono"
                    autoComplete="off"
                  />
                </div>

                <button
                  onClick={handleJoinRoom}
                  disabled={!roomId.trim()}
                  className="btn-success w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  加入房间
                </button>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>• 房间ID由创建者提供</p>
                <p>• 确保输入正确的8位ID</p>
                <p>• 加入前请准备好麦克风</p>
              </div>
            </div>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-16">
          <div className="card">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              使用说明
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  系统要求
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>现代浏览器（Chrome、Firefox、Safari、Edge）</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>稳定的网络连接</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>麦克风和扬声器/耳机</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>允许浏览器访问麦克风权限</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  快捷键
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex justify-between items-center">
                    <span>切换静音/取消静音</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                      空格键
                    </kbd>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>离开房间</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                      Ctrl+L
                    </kbd>
                  </li>
                </ul>

                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 pt-4">
                  注意事项
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• 建议使用耳机以获得最佳音质</li>
                  <li>• 确保网络连接稳定</li>
                  <li>• 首次使用需要授权麦克风权限</li>
                  <li>• 房间空闲30分钟后会自动清理</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              基于 Next.js + WebRTC + Socket.io 构建
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <span>支持最多4人同时在线</span>
              <span>•</span>
              <span>端到端加密通信</span>
              <span>•</span>
              <span>无需下载应用</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
