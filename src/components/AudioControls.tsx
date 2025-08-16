'use client';

import { useEffect, useState } from 'react';

interface AudioControlsProps {
  isMuted: boolean;
  volume: number;
  audioLevel: number;
  onToggleMute?: () => void;
  onVolumeChange?: (volume: number) => void;
  onDeviceChange?: (deviceId: string) => void;
  disabled?: boolean;
}

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}

export function AudioControls({
  isMuted,
  volume,
  audioLevel,
  onToggleMute,
  onVolumeChange,
  onDeviceChange,
  disabled = false,
}: AudioControlsProps) {
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedInputDevice, setSelectedInputDevice] = useState<string>('');
  const [showDevices, setShowDevices] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 获取音频设备列表
  useEffect(() => {
    const getAudioDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices
          .filter(device => device.kind === 'audioinput' || device.kind === 'audiooutput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `${device.kind === 'audioinput' ? '麦克风' : '扬声器'} ${device.deviceId.slice(0, 8)}`,
            kind: device.kind as 'audioinput' | 'audiooutput',
          }));

        setAudioDevices(audioDevices);

        // 设置默认选中的输入设备
        const defaultInput = audioDevices.find(device => device.kind === 'audioinput');
        if (defaultInput && !selectedInputDevice) {
          setSelectedInputDevice(defaultInput.deviceId);
        }
      } catch (error) {
        console.error('Failed to get audio devices:', error);
      }
    };

    getAudioDevices();

    // 监听设备变化
    navigator.mediaDevices.addEventListener('devicechange', getAudioDevices);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getAudioDevices);
    };
  }, [selectedInputDevice]);

  // 处理设备切换
  const handleDeviceChange = async (deviceId: string) => {
    if (!onDeviceChange) return;

    setIsLoading(true);
    try {
      await onDeviceChange(deviceId);
      setSelectedInputDevice(deviceId);
    } catch (error) {
      console.error('Failed to change device:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取音频级别的可视化条
  const renderAudioLevelBars = () => {
    const bars = 8;
    const barsArray = Array.from({ length: bars }, (_, i) => {
      const threshold = (i + 1) * (100 / bars);
      const isActive = audioLevel >= threshold && !isMuted;

      return (
        <div
          key={i}
          className={`
            w-1 rounded-full transition-all duration-100
            ${isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}
          `}
          style={{
            height: `${8 + i * 3}px`,
          }}
        />
      );
    });

    return (
      <div className="flex items-end space-x-1 h-8 px-2">
        {barsArray}
      </div>
    );
  };

  const inputDevices = audioDevices.filter(device => device.kind === 'audioinput');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="space-y-4">
        {/* 标题 */}
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          音频控制
        </h3>

        {/* 主要控制按钮 */}
        <div className="flex items-center justify-between">
          {/* 静音/取消静音按钮 */}
          <button
            onClick={() => onToggleMute?.()}
            disabled={disabled}
            className={`
              audio-control-button
              ${isMuted ? 'muted' : 'unmuted'}
              ${disabled ? 'disabled' : ''}
            `}
            aria-label={isMuted ? '取消静音' : '静音'}
            title={isMuted ? '点击取消静音' : '点击静音'}
          >
            {isMuted ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.293 3.293a1 1 0 011.414 0L18 16.586a1 1 0 01-1.414 1.414L3.293 4.707a1 1 0 010-1.414z" />
                <path
                  fillRule="evenodd"
                  d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          {/* 音频级别可视化 */}
          <div className="flex-1 mx-4">
            {renderAudioLevelBars()}
          </div>

          {/* 设备设置按钮 */}
          <button
            onClick={() => setShowDevices(!showDevices)}
            disabled={disabled}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
              ${disabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200'
              }
            `}
            aria-label="音频设备设置"
            title="音频设备设置"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* 音量控制 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              音量
            </label>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {volume}%
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onVolumeChange?.(Number(e.target.value))}
              disabled={disabled}
              className={`
                flex-1 volume-slider
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              aria-label="调节音量"
            />
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.972 7.972 0 0017 10c0-1.664-.508-3.205-1.379-4.486a1 1 0 010-1.171z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* 设备选择面板 */}
        {showDevices && (
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                音频输入设备
              </h4>

              {isLoading && (
                <div className="flex items-center justify-center py-2">
                  <div className="spinner w-5 h-5 border-2"></div>
                  <span className="ml-2 text-sm text-gray-500">切换设备中...</span>
                </div>
              )}

              <div className="space-y-2">
                {inputDevices.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    未找到音频输入设备
                  </p>
                ) : (
                  inputDevices.map((device) => (
                    <label
                      key={device.deviceId}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="audioInput"
                        value={device.deviceId}
                        checked={selectedInputDevice === device.deviceId}
                        onChange={() => handleDeviceChange(device.deviceId)}
                        disabled={disabled || isLoading}
                        className="w-4 h-4 text-primary-500 focus:ring-primary-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {device.label}
                      </span>
                    </label>
                  ))
                )}
              </div>

              {inputDevices.length > 0 && (
                <button
                  onClick={() => navigator.mediaDevices.enumerateDevices().then(() => window.location.reload())}
                  className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  刷新设备列表
                </button>
              )}
            </div>
          </div>
        )}

        {/* 状态指示器 */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                disabled ? 'bg-gray-400' : isMuted ? 'bg-red-500' : 'bg-green-500'
              }`}
            />
            <span>
              {disabled ? '未连接' : isMuted ? '已静音' : '正常'}
            </span>
          </div>

          {!disabled && (
            <span>
              音频级别: {audioLevel}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default AudioControls;
