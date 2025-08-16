'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMemoizedFn } from 'ahooks';

export default function TestHooksPage() {
  const [count, setCount] = useState(0);
  const [messages, setMessages] = useState<string[]>([]);
  const renderCountRef = useRef(0);
  const callbackCallCountRef = useRef(0);

  // 增加渲染计数
  renderCountRef.current += 1;

  const addMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // 测试普通函数 - 每次渲染都会重新创建
  const normalCallback = (data: string) => {
    callbackCallCountRef.current += 1;
    addMessage(`普通函数调用: ${data} (第${callbackCallCountRef.current}次)`);
  };

  // 测试useMemoizedFn - 应该保持引用稳定
  const memoizedCallback = useMemoizedFn((data: string) => {
    callbackCallCountRef.current += 1;
    addMessage(`Memoized函数调用: ${data} (第${callbackCallCountRef.current}次)`);
  });

  // 模拟子组件，检测函数引用是否变化
  const ChildComponent = ({ callback, type }: { callback: (data: string) => void; type: string }) => {
    const prevCallbackRef = useRef(callback);
    const [referenceChanges, setReferenceChanges] = useState(0);

    useEffect(() => {
      if (prevCallbackRef.current !== callback) {
        setReferenceChanges(prev => prev + 1);
        addMessage(`${type}函数引用发生变化 (第${referenceChanges + 1}次)`);
      }
      prevCallbackRef.current = callback;
    }, [callback, type, referenceChanges]);

    return (
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-2">{type}组件</h3>
        <p className="text-sm mb-2">引用变化次数: {referenceChanges}</p>
        <button
          onClick={() => callback(`来自${type}组件`)}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          调用{type}函数
        </button>
      </div>
    );
  };

  // useEffect测试 - 检查是否会触发不必要的重新执行
  useEffect(() => {
    addMessage('useEffect with memoizedCallback dependency executed');
  }, [memoizedCallback]);

  useEffect(() => {
    addMessage('useEffect with normalCallback dependency executed');
  }, [normalCallback]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            useMemoizedFn 稳定性测试
          </h1>

          {/* 控制面板 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                控制面板
              </h2>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCount(prev => prev + 1)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  增加计数 ({count})
                </button>

                <button
                  onClick={() => {
                    setMessages([]);
                    callbackCallCountRef.current = 0;
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  清空日志
                </button>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>组件渲染次数: {renderCountRef.current}</p>
                <p>函数调用总次数: {callbackCallCountRef.current}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                测试说明
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p>• 点击"增加计数"会触发组件重新渲染</p>
                <p>• 普通函数每次渲染都会创建新引用</p>
                <p>• useMemoizedFn应该保持引用稳定</p>
                <p>• 观察useEffect的执行次数</p>
              </div>
            </div>
          </div>

          {/* 子组件测试 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <ChildComponent callback={normalCallback} type="普通" />
            <ChildComponent callback={memoizedCallback} type="Memoized" />
          </div>

          {/* 直接调用测试 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              直接调用测试
            </h2>
            <div className="flex space-x-4">
              <button
                onClick={() => normalCallback('直接调用')}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                调用普通函数
              </button>
              <button
                onClick={() => memoizedCallback('直接调用')}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                调用Memoized函数
              </button>
            </div>
          </div>

          {/* 日志区域 */}
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            <div className="mb-2 text-white font-bold">执行日志:</div>
            {messages.length === 0 ? (
              <div className="text-gray-500">等待操作...</div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className="mb-1">
                  {message}
                </div>
              ))
            )}
          </div>

          {/* 期望结果说明 */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              期望测试结果:
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• 普通函数组件应该显示多次"引用变化"</li>
              <li>• Memoized函数组件应该只有1次"引用变化"</li>
              <li>• "normalCallback dependency"的useEffect应该多次执行</li>
              <li>• "memoizedCallback dependency"的useEffect应该只执行1次</li>
              <li>• 这证明useMemoizedFn成功避免了无限递归问题</li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← 返回主页
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
