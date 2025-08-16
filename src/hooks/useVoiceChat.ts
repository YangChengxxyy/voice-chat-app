import { useCallback, useEffect, useRef, useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import { WebRTCManager } from '@/utils/webrtc';
import { useSocket } from './useSocket';
import { User, Room, VoiceState, PeerConnection } from '@/types';

interface UseVoiceChatProps {
  roomId?: string;
  userName?: string;
  autoJoin?: boolean;
}

export function useVoiceChat({
  roomId,
  userName,
  autoJoin = false,
}: UseVoiceChatProps = {}) {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isConnected: false,
    isMuted: true,
    isDeafened: false,
    volume: 50,
    audioLevel: 0,
  });
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const webrtcRef = useRef<WebRTCManager | null>(null);
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const remoteAudioElements = useRef<Map<string, HTMLAudioElement>>(new Map());

  // 处理房间加入成功
  const handleRoomJoined = useMemoizedFn(async ({ room, user }: { room: Room; user: User }) => {
    setCurrentRoom(room);
    setCurrentUser(user);
    setUsers(room.users);

    try {
      // 初始化本地音频流
      await initializeLocalAudio();

      // 为房间中的其他用户创建WebRTC连接
      const otherUsers = room.users.filter(u => u.id !== user.id);
      for (const otherUser of otherUsers) {
        await createPeerConnection(otherUser.id);
      }

      setVoiceState(prev => ({ ...prev, isConnected: true }));
    } catch (error) {
      console.error('Failed to initialize voice chat:', error);
      setError('初始化语音聊天失败');
    }
  });

  // 处理新用户加入
  const handleUserJoined = useMemoizedFn(async (user: User) => {
    if (!currentUser || user.id === currentUser.id) return;

    setUsers(prev => [...prev, user]);

    try {
      // 为新用户创建WebRTC连接并发送offer
      await createPeerConnection(user.id, true);
    } catch (error) {
      console.error('Failed to create connection for new user:', error);
    }
  });

  // 处理用户离开
  const handleUserLeft = useMemoizedFn((userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));

    // 清理WebRTC连接
    if (webrtcRef.current) {
      webrtcRef.current.closePeerConnection(userId);
    }

    // 清理远程流
    setRemoteStreams(prev => {
      const newStreams = new Map(prev);
      newStreams.delete(userId);
      return newStreams;
    });

    // 清理音频元素
    const audioElement = remoteAudioElements.current.get(userId);
    if (audioElement) {
      audioElement.srcObject = null;
      remoteAudioElements.current.delete(userId);
    }
  });

  // 处理用户状态更新
  const handleUserUpdated = useMemoizedFn((updatedUser: Partial<User> & { id: string }) => {
    setUsers(prev =>
      prev.map(user =>
        user.id === updatedUser.id ? { ...user, ...updatedUser } : user
      )
    );

    if (currentUser && updatedUser.id === currentUser.id) {
      setCurrentUser(prev => prev ? { ...prev, ...updatedUser } : null);
    }
  });

  // 处理WebRTC Offer
  const handleWebRTCOffer = useMemoizedFn(async ({
    fromUserId,
    offer,
  }: {
    fromUserId: string;
    offer: RTCSessionDescriptionInit;
  }) => {
    if (!webrtcRef.current || !currentRoom) return;

    try {
      // 创建连接（如果不存在）
      await createPeerConnection(fromUserId);

      // 创建answer
      const answer = await webrtcRef.current.createAnswer(fromUserId, offer);

      // 发送answer
      sendWebRTCAnswer(currentRoom.id, fromUserId, answer);
    } catch (error) {
      console.error('Failed to handle WebRTC offer:', error);
    }
  });

  // 处理WebRTC Answer
  const handleWebRTCAnswer = useMemoizedFn(async ({
    fromUserId,
    answer,
  }: {
    fromUserId: string;
    answer: RTCSessionDescriptionInit;
  }) => {
    if (!webrtcRef.current) return;

    try {
      await webrtcRef.current.setRemoteAnswer(fromUserId, answer);
    } catch (error) {
      console.error('Failed to handle WebRTC answer:', error);
    }
  });

  // 处理ICE候选
  const handleWebRTCIceCandidate = useMemoizedFn(async ({
    fromUserId,
    candidate,
  }: {
    fromUserId: string;
    candidate: RTCIceCandidateInit;
  }) => {
    if (!webrtcRef.current) return;

    try {
      await webrtcRef.current.addIceCandidate(fromUserId, candidate);
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error);
    }
  });

  // 清理资源
  const cleanup = useMemoizedFn(() => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }

    if (webrtcRef.current) {
      webrtcRef.current.cleanup();
    }

    // 清理音频元素
    remoteAudioElements.current.forEach(audioElement => {
      audioElement.srcObject = null;
    });
    remoteAudioElements.current.clear();

    setRemoteStreams(new Map());
    setCurrentRoom(null);
    setCurrentUser(null);
    setUsers([]);
    setVoiceState({
      isConnected: false,
      isMuted: true,
      isDeafened: false,
      volume: 50,
      audioLevel: 0,
    });
  });

  // 初始化WebRTC管理器
  useEffect(() => {
    if (!WebRTCManager.isSupported()) {
      setError('您的浏览器不支持WebRTC语音通话功能');
      return;
    }

    webrtcRef.current = new WebRTCManager();

    return () => {
      cleanup();
    };
  }, []);

  // Socket.io事件处理
  const {
    isConnected: socketConnected,
    joinRoom: socketJoinRoom,
    leaveRoom: socketLeaveRoom,
    toggleMute: socketToggleMute,
    sendWebRTCOffer,
    sendWebRTCAnswer,
    sendWebRTCIceCandidate,
    notifications,
    addNotification,
    isClient,
  } = useSocket({
    onRoomJoined: handleRoomJoined,
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
    onUserUpdated: handleUserUpdated,
    onWebRTCOffer: handleWebRTCOffer,
    onWebRTCAnswer: handleWebRTCAnswer,
    onWebRTCIceCandidate: handleWebRTCIceCandidate,
    onError: (error) => setError(error.message),
  });

  // 初始化本地音频
  const initializeLocalAudio = async () => {
    if (!webrtcRef.current) throw new Error('WebRTC manager not initialized');

    try {
      await webrtcRef.current.initializeLocalStream();

      // 开始音频级别监测
      startAudioLevelMonitoring();
    } catch (error) {
      throw new Error('无法访问麦克风，请检查权限设置');
    }
  };

  // 创建与其他用户的WebRTC连接
  const createPeerConnection = async (userId: string, shouldCreateOffer = false) => {
    if (!webrtcRef.current || !currentRoom) return;

    try {
      const peerConnection = await webrtcRef.current.createPeerConnection(
        userId,
        // ICE候选回调
        (candidate) => {
          sendWebRTCIceCandidate(currentRoom.id, userId, candidate.toJSON());
        },
        // 远程流回调
        (stream) => {
          handleRemoteStream(userId, stream);
        }
      );

      // 如果需要创建offer（通常是对新加入的用户）
      if (shouldCreateOffer) {
        const offer = await webrtcRef.current.createOffer(userId);
        sendWebRTCOffer(currentRoom.id, userId, offer);
      }
    } catch (error) {
      console.error(`Failed to create peer connection with ${userId}:`, error);
      throw error;
    }
  };

  // 处理远程音频流
  const handleRemoteStream = (userId: string, stream: MediaStream) => {
    setRemoteStreams(prev => new Map(prev).set(userId, stream));

    // 创建或更新音频元素
    let audioElement = remoteAudioElements.current.get(userId);
    if (!audioElement) {
      audioElement = new Audio();
      audioElement.autoplay = true;
      remoteAudioElements.current.set(userId, audioElement);
    }

    audioElement.srcObject = stream;
    audioElement.volume = voiceState.volume / 100;
  };

  // 开始音频级别监测
  const startAudioLevelMonitoring = () => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
    }

    audioLevelIntervalRef.current = setInterval(() => {
      if (webrtcRef.current && !voiceState.isMuted) {
        const level = webrtcRef.current.getAudioLevel();
        setVoiceState(prev => ({ ...prev, audioLevel: level }));
      } else {
        setVoiceState(prev => ({ ...prev, audioLevel: 0 }));
      }
    }, 100);
  };

  // 加入房间
  const joinRoom = useMemoizedFn(async (roomId: string, userName: string) => {
    if (!isClient) {
      setError('客户端尚未准备就绪');
      return;
    }

    if (!socketConnected) {
      setError('未连接到服务器');
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      // 检查媒体权限
      const permissions = await WebRTCManager.checkMediaPermissions();
      if (!permissions.audio) {
        throw new Error(permissions.error || '无法访问麦克风');
      }

      socketJoinRoom(roomId, userName);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsInitializing(false);
    }
  });

  // 离开房间
  const leaveRoom = useMemoizedFn(() => {
    if (currentRoom && currentUser) {
      socketLeaveRoom(currentRoom.id, currentUser.id);
    }
    cleanup();
  });

  // 切换静音状态
  const toggleMute = useMemoizedFn(() => {
    if (!webrtcRef.current || !currentRoom || !currentUser) return;

    const newMutedState = !voiceState.isMuted;

    // 更新本地静音状态
    webrtcRef.current.setMuted(newMutedState);
    setVoiceState(prev => ({ ...prev, isMuted: newMutedState }));

    // 通知服务器
    socketToggleMute(currentRoom.id, currentUser.id, newMutedState);
  });

  // 设置音量
  const setVolume = useMemoizedFn((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, volume));
    setVoiceState(prev => ({ ...prev, volume: clampedVolume }));

    // 更新所有远程音频元素的音量
    remoteAudioElements.current.forEach(audioElement => {
      audioElement.volume = clampedVolume / 100;
    });
  });

  // 获取可用的音频设备
  const getAudioDevices = useMemoizedFn(async () => {
    if (!webrtcRef.current) return { inputDevices: [], outputDevices: [] };
    return await webrtcRef.current.getAudioDevices();
  });

  // 切换音频输入设备
  const setAudioInputDevice = useMemoizedFn(async (deviceId: string) => {
    if (!webrtcRef.current) return;

    try {
      await webrtcRef.current.setAudioInputDevice(deviceId);
      addNotification('success', '音频输入设备已切换');
    } catch (error: any) {
      setError(error.message);
    }
  });

  // 获取连接状态
  const getConnectionStates = useMemoizedFn(() => {
    if (!webrtcRef.current) return {};
    return webrtcRef.current.getAllConnectionStates();
  });

  // 自动加入房间
  useEffect(() => {
    if (autoJoin && roomId && userName && socketConnected && isClient && !currentRoom) {
      joinRoom(roomId, userName);
    }
  }, [autoJoin, roomId, userName, socketConnected, isClient, currentRoom, joinRoom]);

  return {
    // 状态
    currentRoom,
    currentUser,
    users,
    voiceState,
    remoteStreams,
    isInitializing,
    error,
    socketConnected,
    isClient,
    notifications,

    // 方法
    joinRoom,
    leaveRoom,
    toggleMute,
    setVolume,
    getAudioDevices,
    setAudioInputDevice,
    getConnectionStates,
    cleanup,

    // 工具方法
    isWebRTCSupported: WebRTCManager.isSupported(),
  };
}

export default useVoiceChat;
