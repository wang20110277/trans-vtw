export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private signalingServer: WebSocket | null = null;
  
  constructor() {
    // 初始化WebRTC连接
    this.initPeerConnection();
  }
  
  // 初始化RTCPeerConnection
  private initPeerConnection(): void {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };
    
    this.peerConnection = new RTCPeerConnection(configuration);
    
    // 添加事件监听器
    this.peerConnection.onicecandidate = this.handleICECandidate.bind(this);
    this.peerConnection.ontrack = this.handleTrack.bind(this);
    this.peerConnection.onconnectionstatechange = this.handleConnectionStateChange.bind(this);
  }
  
  // 获取本地媒体流
  public async getLocalStream(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      // 将本地流添加到peerConnection
      if (this.localStream && this.peerConnection) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }
      
      return this.localStream;
    } catch (error) {
      console.error('获取本地媒体流失败:', error);
      throw error;
    }
  }
  
  // 连接信令服务器
  public connectSignalingServer(url: string): void {
    this.signalingServer = new WebSocket(url);
    
    this.signalingServer.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'offer':
          this.handleOffer(message.sdp);
          break;
        case 'answer':
          this.handleAnswer(message.sdp);
          break;
        case 'ice-candidate':
          this.handleICECandidate(message.candidate);
          break;
        default:
          console.log('未知消息类型:', message.type);
      }
    };
    
    this.signalingServer.onopen = () => {
      console.log('信令服务器连接已建立');
    };
    
    this.signalingServer.onclose = () => {
      console.log('信令服务器连接已断开');
    };
    
    this.signalingServer.onerror = (error) => {
      console.error('信令服务器连接错误:', error);
    };
  }
  
  // 获取本地媒体流
  public getLocalStreamObject(): MediaStream | null {
    return this.localStream;
  }
  
  // 获取远程媒体流
  public getRemoteStreamObject(): MediaStream | null {
    return this.remoteStream;
  }
  
  // 启动视频通话
  public async startCall(): Promise<void> {
    try {
      // 获取本地媒体流
      await this.getLocalStream();
      
      // 创建并发送offer
      await this.createOffer();
    } catch (error) {
      console.error('启动视频通话失败:', error);
      throw error;
    }
  }
  
  // 处理信令消息
  public handleSignalingMessage(data: any): void {
    switch (data.type) {
      case 'offer':
        this.handleOffer(data.sdp);
        break;
      case 'answer':
        this.handleAnswer(data.sdp);
        break;
      case 'ice-candidate':
        this.handleICECandidate(data.candidate);
        break;
      default:
        console.log('未知信令消息类型:', data.type);
    }
  }
  
  // 处理ICE候选
  private handleICECandidate(event: RTCPeerConnectionIceEvent): void {
    if (event.candidate && this.signalingServer) {
      this.signalingServer.send(JSON.stringify({
        type: 'ice-candidate',
        candidate: event.candidate
      }));
    }
  }
  
  // 处理远程媒体流
  private handleTrack(event: RTCTrackEvent): void {
    this.remoteStream = event.streams[0];
    
    // 将远程视频流显示在页面上
    const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement;
    if (remoteVideo) {
      remoteVideo.srcObject = this.remoteStream;
      remoteVideo.style.display = 'block';
      
      // 隐藏数字人图片
      const avatarImage = document.getElementById('avatar-image') as HTMLImageElement;
      if (avatarImage) {
        avatarImage.style.display = 'none';
      }
    }
  }
  
  // 处理连接状态变化
  private handleConnectionStateChange(): void {
    if (this.peerConnection) {
      console.log('连接状态:', this.peerConnection.connectionState);
      
      if (this.peerConnection.connectionState === 'disconnected' || 
          this.peerConnection.connectionState === 'failed') {
        // 连接断开或失败时的处理
        this.close();
      }
    }
  }
  
  // 创建offer
  private async createOffer(): Promise<void> {
    if (!this.peerConnection || !this.signalingServer) return;
    
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      this.signalingServer.send(JSON.stringify({
        type: 'offer',
        sdp: offer
      }));
    } catch (error) {
      console.error('创建offer失败:', error);
    }
  }
  
  // 处理offer
  private async handleOffer(sdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection || !this.signalingServer) return;
    
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      
      // 获取本地媒体流
      await this.getLocalStream();
      
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      
      this.signalingServer.send(JSON.stringify({
        type: 'answer',
        sdp: answer
      }));
    } catch (error) {
      console.error('处理offer失败:', error);
    }
  }
  
  // 处理answer
  private async handleAnswer(sdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;
    
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    } catch (error) {
      console.error('处理answer失败:', error);
    }
  }
  
  // 关闭连接
  public close(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    if (this.signalingServer) {
      this.signalingServer.close();
      this.signalingServer = null;
    }
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    this.remoteStream = null;
  }
}