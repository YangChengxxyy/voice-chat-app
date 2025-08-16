export interface User {
  id: string;
  name: string;
  isConnected: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  joinedAt: Date;
}

export interface Room {
  id: string;
  name: string;
  users: User[];
  maxUsers: number;
  createdAt: Date;
  isActive: boolean;
}

export interface PeerConnection {
  userId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export interface AudioSettings {
  inputDeviceId: string;
  outputDeviceId: string;
  volume: number;

  echoCancellation: boolean;
  noiseSuppression: boolean;
}

export interface VoiceState {
  isConnected: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  volume: number;
  audioLevel: number;
}

export interface SocketEvents {
  // Client to Server
  "join-room": (data: { roomId: string; userName: string }) => void;
  "leave-room": (data: { roomId: string; userId: string }) => void;
  "toggle-mute": (data: {
    roomId: string;
    userId: string;
    isMuted: boolean;
  }) => void;
  "webrtc-offer": (data: {
    roomId: string;
    targetUserId: string;
    offer: RTCSessionDescriptionInit;
  }) => void;
  "webrtc-answer": (data: {
    roomId: string;
    targetUserId: string;
    answer: RTCSessionDescriptionInit;
  }) => void;
  "webrtc-ice-candidate": (data: {
    roomId: string;
    targetUserId: string;
    candidate: RTCIceCandidateInit;
  }) => void;

  // Server to Client
  "room-joined": (data: { room: Room; user: User }) => void;
  "user-joined": (user: User) => void;
  "user-left": (userId: string) => void;
  "user-updated": (user: Partial<User> & { id: string }) => void;
  "room-updated": (room: Partial<Room>) => void;
  "webrtc-offer-received": (data: {
    fromUserId: string;
    offer: RTCSessionDescriptionInit;
  }) => void;
  "webrtc-answer-received": (data: {
    fromUserId: string;
    answer: RTCSessionDescriptionInit;
  }) => void;
  "webrtc-ice-candidate-received": (data: {
    fromUserId: string;
    candidate: RTCIceCandidateInit;
  }) => void;
  error: (error: { message: string; code?: string }) => void;
}

export interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: "audioinput" | "audiooutput";
}

export interface ConnectionState {
  socket: boolean;
  audio: boolean;
  webrtc: Record<
    string,
    "connecting" | "connected" | "disconnected" | "failed"
  >;
}

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
  timestamp: Date;
}

export interface RoomSettings {
  maxUsers: number;
  requireApproval: boolean;
  allowGuests: boolean;
  muteOnJoin: boolean;
}
