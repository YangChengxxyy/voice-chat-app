export class WebRTCManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;

  // ICE服务器配置
  private iceServers: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
    ],
  };

  // 媒体约束
  private mediaConstraints: MediaStreamConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 44100,
      channelCount: 1,
    },
    video: false,
  };

  // 获取本地音频流
  async initializeLocalStream(): Promise<MediaStream> {
    try {
      if (this.localStream) {
        return this.localStream;
      }

      this.localStream = await navigator.mediaDevices.getUserMedia(
        this.mediaConstraints,
      );

      // 初始化音频分析器
      this.initializeAudioAnalyzer();

      return this.localStream;
    } catch (error) {
      console.error("Failed to get local stream:", error);
      throw new Error("无法访问麦克风，请检查权限设置");
    }
  }

  // 初始化音频分析器（用于检测音量）
  private initializeAudioAnalyzer() {
    if (!this.localStream) return;

    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    const source = this.audioContext.createMediaStreamSource(this.localStream);
    source.connect(this.analyser);

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  // 获取音频音量级别
  getAudioLevel(): number {
    if (!this.analyser || !this.dataArray) return 0;

    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    const average =
      Array.from(data).reduce((sum, value) => sum + value, 0) / data.length;
    return Math.round((average / 255) * 100);
  }

  // 创建与指定用户的连接
  async createPeerConnection(
    userId: string,
    onIceCandidate: (candidate: RTCIceCandidate) => void,
    onTrack: (stream: MediaStream) => void,
  ): Promise<RTCPeerConnection> {
    if (this.peerConnections.has(userId)) {
      this.closePeerConnection(userId);
    }

    const peerConnection = new RTCPeerConnection(this.iceServers);

    // 处理ICE候选
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };

    // 处理远程流
    peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        onTrack(event.streams[0]);
      }
    };

    // 连接状态变化
    peerConnection.onconnectionstatechange = () => {
      console.log(
        `Connection state with ${userId}: ${peerConnection.connectionState}`,
      );

      if (peerConnection.connectionState === "failed") {
        console.log(`Connection failed with ${userId}, attempting restart`);
        peerConnection.restartIce();
      }
    };

    // ICE连接状态变化
    peerConnection.oniceconnectionstatechange = () => {
      console.log(
        `ICE connection state with ${userId}: ${peerConnection.iceConnectionState}`,
      );
    };

    // 添加本地流
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    this.peerConnections.set(userId, peerConnection);
    return peerConnection;
  }

  // 创建Offer
  async createOffer(userId: string): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.peerConnections.get(userId);
    if (!peerConnection) {
      throw new Error(`No peer connection found for user ${userId}`);
    }

    try {
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });

      await peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error(`Failed to create offer for ${userId}:`, error);
      throw error;
    }
  }

  // 创建Answer
  async createAnswer(
    userId: string,
    offer: RTCSessionDescriptionInit,
  ): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.peerConnections.get(userId);
    if (!peerConnection) {
      throw new Error(`No peer connection found for user ${userId}`);
    }

    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error(`Failed to create answer for ${userId}:`, error);
      throw error;
    }
  }

  // 设置远程Answer
  async setRemoteAnswer(
    userId: string,
    answer: RTCSessionDescriptionInit,
  ): Promise<void> {
    const peerConnection = this.peerConnections.get(userId);
    if (!peerConnection) {
      throw new Error(`No peer connection found for user ${userId}`);
    }

    try {
      await peerConnection.setRemoteDescription(answer);
    } catch (error) {
      console.error(`Failed to set remote answer for ${userId}:`, error);
      throw error;
    }
  }

  // 添加ICE候选
  async addIceCandidate(
    userId: string,
    candidate: RTCIceCandidateInit,
  ): Promise<void> {
    const peerConnection = this.peerConnections.get(userId);
    if (!peerConnection) {
      console.warn(
        `No peer connection found for user ${userId} when adding ICE candidate`,
      );
      return;
    }

    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error(`Failed to add ICE candidate for ${userId}:`, error);
    }
  }

  // 静音/取消静音
  setMuted(muted: boolean): void {
    if (!this.localStream) return;

    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }

  // 检查是否静音
  isMuted(): boolean {
    if (!this.localStream) return true;

    const audioTracks = this.localStream.getAudioTracks();
    return audioTracks.length === 0 || !audioTracks[0].enabled;
  }

  // 设置音频输入设备
  async setAudioInputDevice(deviceId: string): Promise<void> {
    try {
      // 停止当前流
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => track.stop());
      }

      // 使用新设备创建流
      const newConstraints: MediaStreamConstraints = {
        ...this.mediaConstraints,
        audio: {
          ...(this.mediaConstraints.audio as MediaTrackConstraints),
          deviceId: { exact: deviceId },
        },
      };

      this.localStream =
        await navigator.mediaDevices.getUserMedia(newConstraints);

      // 重新初始化音频分析器
      this.initializeAudioAnalyzer();

      // 更新所有现有连接的轨道
      this.peerConnections.forEach(async (peerConnection, userId) => {
        const senders = peerConnection.getSenders();
        const audioTrack = this.localStream?.getAudioTracks()[0];

        if (audioTrack) {
          const audioSender = senders.find(
            (sender) => sender.track?.kind === "audio",
          );

          if (audioSender) {
            await audioSender.replaceTrack(audioTrack);
          }
        }
      });
    } catch (error) {
      console.error("Failed to set audio input device:", error);
      throw new Error("无法切换音频输入设备");
    }
  }

  // 获取可用的音频设备
  async getAudioDevices(): Promise<{
    inputDevices: MediaDeviceInfo[];
    outputDevices: MediaDeviceInfo[];
  }> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      return {
        inputDevices: devices.filter((device) => device.kind === "audioinput"),
        outputDevices: devices.filter(
          (device) => device.kind === "audiooutput",
        ),
      };
    } catch (error) {
      console.error("Failed to get audio devices:", error);
      return { inputDevices: [], outputDevices: [] };
    }
  }

  // 关闭与指定用户的连接
  closePeerConnection(userId: string): void {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(userId);
    }
  }

  // 获取连接状态
  getConnectionState(userId: string): RTCPeerConnectionState | null {
    const peerConnection = this.peerConnections.get(userId);
    return peerConnection ? peerConnection.connectionState : null;
  }

  // 获取所有连接状态
  getAllConnectionStates(): Record<string, RTCPeerConnectionState> {
    const states: Record<string, RTCPeerConnectionState> = {};
    this.peerConnections.forEach((connection, userId) => {
      states[userId] = connection.connectionState;
    });
    return states;
  }

  // 清理所有连接
  cleanup(): void {
    // 关闭所有peer连接
    this.peerConnections.forEach((connection) => {
      connection.close();
    });
    this.peerConnections.clear();

    // 停止本地流
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // 关闭音频上下文
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.dataArray = null;
  }

  // 检查浏览器支持
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function" &&
      window.RTCPeerConnection
    );
  }

  // 检查是否有媒体权限
  static async checkMediaPermissions(): Promise<{
    audio: boolean;
    error?: string;
  }> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return { audio: true };
    } catch (error: any) {
      return {
        audio: false,
        error:
          error.name === "NotAllowedError"
            ? "麦克风权限被拒绝"
            : "无法访问麦克风",
      };
    }
  }
}

// 工具函数：音频可视化
export function createAudioVisualizer(
  stream: MediaStream,
  canvas: HTMLCanvasElement,
): () => void {
  const audioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaStreamSource(stream);

  source.connect(analyser);
  analyser.fftSize = 256;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const canvasCtx = canvas.getContext("2d")!;
  let animationId: number;

  function draw() {
    animationId = requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);

    canvasCtx.fillStyle = "rgb(20, 20, 20)";
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = (dataArray[i] / 255) * canvas.height;

      const r = barHeight + 25 * (i / bufferLength);
      const g = 250 * (i / bufferLength);
      const b = 50;

      canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
      canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  }

  draw();

  // 返回清理函数
  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    audioContext.close();
  };
}

// 音频处理工具
export class AudioProcessor {
  private gainNode: GainNode | null = null;
  private audioContext: AudioContext | null = null;

  constructor(private stream: MediaStream) {
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
  }

  // 设置音量
  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  // 应用噪声抑制
  applyNoiseGate(threshold: number = 0.1): void {
    if (!this.audioContext || !this.gainNode) return;

    const analyser = this.audioContext.createAnalyser();
    const source = this.audioContext.createMediaStreamSource(this.stream);

    source.connect(analyser);
    analyser.connect(this.gainNode);

    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkNoise = () => {
      analyser.getByteFrequencyData(dataArray);
      const average =
        dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const normalizedLevel = average / 255;

      if (normalizedLevel < threshold) {
        this.gainNode!.gain.value = 0;
      } else {
        this.gainNode!.gain.value = 1;
      }

      requestAnimationFrame(checkNoise);
    };

    checkNoise();
  }

  cleanup(): void {
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
    }
  }
}
