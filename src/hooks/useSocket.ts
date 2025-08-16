'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMemoizedFn } from 'ahooks';
import { User, Room, Notification } from '@/types';

interface UseSocketFixedProps {
  onRoomJoined?: (data: { room: Room; user: User }) => void;
  onUserJoined?: (user: User) => void;
  onUserLeft?: (userId: string) => void;
  onUserUpdated?: (user: Partial<User> & { id: string }) => void;
  onWebRTCOffer?: (data: { fromUserId: string; offer: RTCSessionDescriptionInit }) => void;
  onWebRTCAnswer?: (data: { fromUserId: string; answer: RTCSessionDescriptionInit }) => void;
  onWebRTCIceCandidate?: (data: { fromUserId: string; candidate: RTCIceCandidateInit }) => void;
  onError?: (error: { message: string; code?: string }) => void;
}

export function useSocket({
  onRoomJoined,
  onUserJoined,
  onUserLeft,
  onUserUpdated,
  onWebRTCOffer,
  onWebRTCAnswer,
  onWebRTCIceCandidate,
  onError,
}: UseSocketFixedProps = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isClient, setIsClient] = useState(false);

  const socketRef = useRef<any>(null);
  const mountedRef = useRef(true);

  // 确保只在客户端运行
  useEffect(() => {
    setIsClient(true);
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const addNotification = useMemoizedFn((
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    duration = 5000
  ) => {
    if (!mountedRef.current) return;

    const notification: Notification = {
      id: Date.now().toString() + Math.random(),
      type,
      message,
      duration,
      timestamp: new Date(),
    };

    setNotifications(prev => [...prev, notification]);

    setTimeout(() => {
      if (mountedRef.current) {
        removeNotification(notification.id);
      }
    }, duration);
  });

  const removeNotification = useMemoizedFn((id: string) => {
    if (!mountedRef.current) return;
    setNotifications(prev => prev.filter(n => n.id !== id));
  });

  // 创建 memoized 版本的回调函数
  const memoizedOnRoomJoined = useMemoizedFn((data: { room: Room; user: User }) => {
    onRoomJoined?.(data);
  });

  const memoizedOnUserJoined = useMemoizedFn((user: User) => {
    onUserJoined?.(user);
  });

  const memoizedOnUserLeft = useMemoizedFn((userId: string) => {
    onUserLeft?.(userId);
  });

  const memoizedOnUserUpdated = useMemoizedFn((user: Partial<User> & { id: string }) => {
    onUserUpdated?.(user);
  });

  const memoizedOnWebRTCOffer = useMemoizedFn((data: { fromUserId: string; offer: RTCSessionDescriptionInit }) => {
    onWebRTCOffer?.(data);
  });

  const memoizedOnWebRTCAnswer = useMemoizedFn((data: { fromUserId: string; answer: RTCSessionDescriptionInit }) => {
    onWebRTCAnswer?.(data);
  });

  const memoizedOnWebRTCIceCandidate = useMemoizedFn((data: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
    onWebRTCIceCandidate?.(data);
  });

  const memoizedOnError = useMemoizedFn((error: { message: string; code?: string }) => {
    onError?.(error);
  });

  // Socket.io 连接初始化
  useEffect(() => {
    if (!isClient) return;

    let socket: any = null;

    const initSocket = async () => {
      try {
        const { io } = await import('socket.io-client');

        const serverUrl = process.env.NODE_ENV === 'production'
          ? process.env.NEXT_PUBLIC_SERVER_URL || window.location.origin
          : 'http://localhost:3001';

        console.log('🔌 Connecting to Socket.io server:', serverUrl);

        socket = io(serverUrl, {
          transports: ['polling', 'websocket'],
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          randomizationFactor: 0.5,
          autoConnect: true,
        });

        socketRef.current = socket;

        // === 连接事件 ===
        socket.on('connect', () => {
          if (!mountedRef.current) return;
          console.log('✅ Socket connected:', socket.id);
          setIsConnected(true);
          setConnectionError(null);
          addNotification('success', '已连接到服务器');
        });

        socket.on('connection-confirmed', (data: any) => {
          console.log('🎯 Connection confirmed:', data);
        });

        socket.on('disconnect', (reason: string) => {
          if (!mountedRef.current) return;
          console.log('❌ Socket disconnected:', reason);
          setIsConnected(false);

          if (reason === 'io server disconnect') {
            addNotification('error', '服务器主动断开连接');
          } else if (reason !== 'io client disconnect') {
            addNotification('warning', '与服务器连接中断，正在重连...');
          }
        });

        socket.on('connect_error', (error: any) => {
          if (!mountedRef.current) return;
          console.error('❌ Connection error:', error);
          setConnectionError(error.message);
          addNotification('error', '连接服务器失败');
        });

        socket.on('reconnect', (attemptNumber: number) => {
          if (!mountedRef.current) return;
          console.log('🔄 Reconnected after', attemptNumber, 'attempts');
          addNotification('success', '已重新连接到服务器');
        });

        socket.on('reconnect_error', (error: any) => {
          if (!mountedRef.current) return;
          console.error('❌ Reconnection error:', error);
        });

        socket.on('reconnect_failed', () => {
          if (!mountedRef.current) return;
          console.error('❌ Failed to reconnect');
          setConnectionError('无法重新连接到服务器');
          addNotification('error', '重新连接失败，请刷新页面');
        });

        // === 房间事件 ===
        socket.on('room-joined', (data: { room: Room; user: User }) => {
          if (!mountedRef.current) return;
          console.log('🏠 Room joined:', data);
          memoizedOnRoomJoined(data);
          addNotification('success', `已加入房间: ${data.room.name}`);
        });

        socket.on('user-joined', (user: User) => {
          if (!mountedRef.current) return;
          console.log('👤 User joined:', user);
          memoizedOnUserJoined(user);
          addNotification('info', `${user.name} 加入了房间`);
        });

        socket.on('user-left', (userId: string) => {
          if (!mountedRef.current) return;
          console.log('👤 User left:', userId);
          memoizedOnUserLeft(userId);
          addNotification('info', '有用户离开了房间');
        });

        socket.on('user-updated', (user: Partial<User> & { id: string }) => {
          if (!mountedRef.current) return;
          console.log('👤 User updated:', user);
          memoizedOnUserUpdated(user);
        });

        socket.on('webrtc-offer-received', (data: { fromUserId: string; offer: RTCSessionDescriptionInit }) => {
          if (!mountedRef.current) return;
          console.log('📞 WebRTC offer received from:', data.fromUserId);
          memoizedOnWebRTCOffer(data);
        });

        socket.on('webrtc-answer-received', (data: { fromUserId: string; answer: RTCSessionDescriptionInit }) => {
          if (!mountedRef.current) return;
          console.log('📞 WebRTC answer received from:', data.fromUserId);
          memoizedOnWebRTCAnswer(data);
        });

        socket.on('webrtc-ice-candidate-received', (data: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
          if (!mountedRef.current) return;
          console.log('🧊 ICE candidate received from:', data.fromUserId);
          memoizedOnWebRTCIceCandidate(data);
        });

        socket.on('error', (error: { message: string; code?: string }) => {
          if (!mountedRef.current) return;
          console.error('❌ Socket error:', error);
          memoizedOnError(error);
          addNotification('error', error.message);
        });

      } catch (error: any) {
        if (!mountedRef.current) return;
        console.error('❌ Failed to initialize socket:', error);
        setConnectionError(error.message);
        addNotification('error', '初始化连接失败');
      }
    };

    initSocket();

    return () => {
      if (socket) {
        console.log('🔌 Disconnecting socket...');
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [isClient]);

  // === Socket 操作方法 ===
  const joinRoom = useMemoizedFn((roomId: string, userName: string) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      addNotification('error', '未连接到服务器');
      return;
    }

    console.log('🏠 Joining room:', roomId, 'as', userName);
    socket.emit('join-room', { roomId, userName });
  });

  const leaveRoom = useMemoizedFn((roomId: string, userId: string) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;

    console.log('🏠 Leaving room:', roomId);
    socket.emit('leave-room', { roomId, userId });
  });

  const toggleMute = useMemoizedFn((roomId: string, userId: string, isMuted: boolean) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;

    console.log('🔇 Toggle mute:', isMuted);
    socket.emit('toggle-mute', { roomId, userId, isMuted });
  });

  const sendWebRTCOffer = useMemoizedFn((
    roomId: string,
    targetUserId: string,
    offer: RTCSessionDescriptionInit
  ) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;

    console.log('📞 Sending WebRTC offer to:', targetUserId);
    socket.emit('webrtc-offer', { roomId, targetUserId, offer });
  });

  const sendWebRTCAnswer = useMemoizedFn((
    roomId: string,
    targetUserId: string,
    answer: RTCSessionDescriptionInit
  ) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;

    console.log('📞 Sending WebRTC answer to:', targetUserId);
    socket.emit('webrtc-answer', { roomId, targetUserId, answer });
  });

  const sendWebRTCIceCandidate = useMemoizedFn((
    roomId: string,
    targetUserId: string,
    candidate: RTCIceCandidateInit
  ) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;

    console.log('🧊 Sending ICE candidate to:', targetUserId);
    socket.emit('webrtc-ice-candidate', { roomId, targetUserId, candidate });
  });

  const getConnectionStats = useMemoizedFn(() => {
    const socket = socketRef.current;
    if (!socket) return null;

    return {
      connected: socket.connected,
      id: socket.id,
      transport: socket.io?.engine?.transport?.name,
    };
  });

  const reconnect = useMemoizedFn(() => {
    const socket = socketRef.current;
    if (!socket) return;

    console.log('🔄 Manual reconnection...');
    if (socket.connected) {
      socket.disconnect();
    }
    socket.connect();
  });

  return {
    // 状态
    isConnected,
    connectionError,
    notifications,
    socket: socketRef.current,
    isClient,

    // 方法
    joinRoom,
    leaveRoom,
    toggleMute,
    sendWebRTCOffer,
    sendWebRTCAnswer,
    sendWebRTCIceCandidate,
    addNotification,
    removeNotification,
    getConnectionStats,
    reconnect,
  };
}

export default useSocket;
