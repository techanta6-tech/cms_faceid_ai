import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as WebSocket from 'ws';
import { EventsGateway } from '../events/events.gateway';

export interface LovadEvent {
  eventId: string;
  cameraId: string;
  cameraName?: string;
  timestamp: string;
  personId?: string;
  personName?: string;
  imageUrl?: string; // base64 or source url
  imageType?: string; // 'base64' or 'url'
  rawEvent?: any;
  receivedAt: string;
}

@Injectable()
export class LovadIntegrationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('LovadIntegrationService');
  private socket: WebSocket | null = null;
  private signalrConnectionToken: string | null = null;
  private keepAliveTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  
  // Map to store VideoAccessToken per CameraId
  private readonly channelsMap = new Map<string, { cameraName: string; videoAccessToken: string }>();

  constructor(private readonly eventsGateway: EventsGateway) {}

  // Connection states
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private lcmsServerId: string | null = null;
  private connectionToken: string | null = null;
  private connectionStatus: 'disconnected' | 'authenticating' | 'connecting_signalr' | 'subscribed' | 'failed' = 'disconnected';
  private lastError: string | null = null;

  // In-memory RAM storage for received events
  private eventsRam: LovadEvent[] = [];
  private readonly MAX_EVENTS_RAM = 200;

  onModuleInit() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    this.logger.log('LovadIntegrationService initialized. Starting connection to LOVAD system...');
    this.connectToLovad();
  }

  onModuleDestroy() {
    this.stopKeepAlive();
    this.disconnectSignalR();
  }

  // Get status for API exposure
  getStatus() {
    const activeCameras = Array.from(this.channelsMap.entries()).map(([cameraId, info]) => ({
      cameraId,
      cameraName: info.cameraName,
    }));

    return {
      status: this.connectionStatus,
      lcmsServerId: this.lcmsServerId,
      hasAccessToken: !!this.accessToken,
      hasConnectionToken: !!this.connectionToken,
      signalrConnected: this.socket?.readyState === WebSocket.OPEN,
      lastError: this.lastError,
      eventsCount: this.eventsRam.length,
      activeCameras,
    };
  }

  // Get RAM events list
  getEvents() {
    return this.eventsRam;
  }

  // Clear events in RAM
  clearEvents() {
    this.eventsRam = [];
    this.logger.log('Cleared RAM events storage');
  }

  // Trigger manual reconnect
  async forceReconnect() {
    this.logger.log('Manual reconnection triggered');
    this.stopKeepAlive();
    await this.disconnectSignalR();
    this.connectionStatus = 'disconnected';
    this.lastError = null;
    // Don't await, run asynchronously
    this.connectToLovad();
    return { message: 'Reconnection process started' };
  }

  private async connectToLovad() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      // 1. Authentication & Session Manager (Module 1)
      this.connectionStatus = 'authenticating';
      const authenticated = await this.authenticateAndEstablishSession();
      if (!authenticated) {
        this.connectionStatus = 'failed';
        return;
      }

      // Start KeepAlive timer every 40 seconds
      this.startKeepAlive();

      // 2. Establish Real-time Listener (Module 2)
      this.connectionStatus = 'connecting_signalr';
      const signalRConnected = await this.connectSignalR();
      if (!signalRConnected) {
        this.connectionStatus = 'failed';
        return;
      }

      // 3. Subscribe to the Hub
      const subscribed = await this.subscribeToHub();
      if (subscribed) {
        this.connectionStatus = 'subscribed';
        this.logger.log('Successfully subscribed to DVMS events! Listening for face detection...');
      } else {
        this.connectionStatus = 'failed';
      }
    } catch (error) {
      this.lastError = error.message;
      this.connectionStatus = 'failed';
      this.logger.error(`Error in LOVAD connection flow: ${error.message}`, error.stack);
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Module 1: Auth & Session Manager
   */
  private async authenticateAndEstablishSession(): Promise<boolean> {
    const lcmsUrl = process.env.LOVAD_LCMS_URL || 'https://localhost:18000';
    const dvmsUrl = process.env.LOVAD_DVMS_URL || 'https://localhost:10180';
    const username = process.env.LOVAD_USERNAME || 'admin';
    const password = process.env.LOVAD_PASSWORD || 'admin@123';

    this.logger.log(`Authenticating with LCMS Server at: ${lcmsUrl} (User: ${username})`);

    try {
      // Step A: Login to LCMS
      const loginPayload = {
        ClientPlatform: 7, // THIRD_PARTY
        ClientType: 2,
      };

      const loginRes = await fetch(`${lcmsUrl}/LAPI/Login/login-v2`, {
        method: 'POST',
        headers: {
          'Username': username,
          'Password': password,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginPayload),
      });

      if (!loginRes.ok) {
        throw new Error(`LCMS Login failed with HTTP status ${loginRes.status}`);
      }

      const loginData: any = await loginRes.json();
      this.logger.log(`LCMS Login response: ${JSON.stringify(loginData)}`);

      // Extract tokens depending on backend API shape
      // Try multiple possible paths since API shapes can vary (especially capitalized Data field)
      this.accessToken = loginData?.Data?.Token || loginData?.data?.token || loginData?.token || loginData?.data?.AccessToken || loginData?.AccessToken;
      this.refreshToken = loginData?.Data?.RefreshToken || loginData?.data?.refresh_token || loginData?.refresh_token || loginData?.data?.RefreshToken || loginData?.RefreshToken;
      this.lcmsServerId = loginData?.Data?.LCMSServerId || loginData?.data?.lcms_server_id || loginData?.lcms_server_id || loginData?.data?.LCMSServerId || loginData?.LCMSServerId || 'default-lcms-server-id';

      if (!this.accessToken) {
        throw new Error('Access Token not found in login response');
      }

      this.logger.log(`LCMS Authenticated successfully. LCMSServerId: ${this.lcmsServerId}`);

      // Step B: Connect to local DVMS to fetch ConnectionToken
      this.logger.log(`Connecting to DVMS Server at: ${dvmsUrl}`);
      
      const connectPayload = {
        ClientPlatform: 7, // THIRD_PARTY
        ClientVersion: 6100,
        UserName: username,
        AcceptEventSetting: [
          {
            IsAcceptCameraStatusEvents: true,
            IsAcceptDeviceStatusEvents: true,
            IsAcceptOtherEvents: true,
            IsAcceptAllOtherEvents: true,
            ListEventAccept: [],
          },
        ],
      };

      const connectRes = await fetch(`${dvmsUrl}/LAPI/Connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Token': this.accessToken,
          'LCMSServerId': this.lcmsServerId,
        },
        body: JSON.stringify(connectPayload),
      });

      if (!connectRes.ok) {
        throw new Error(`DVMS Connect failed with HTTP status ${connectRes.status}`);
      }

      const connectData: any = await connectRes.json();
      this.logger.log(`DVMS Connect response: ${JSON.stringify(connectData)}`);

      // DVMS sometimes returns the payload data as a JSON string within the "Data" field.
      let dvmsPayload = connectData?.Data || connectData?.data;
      if (typeof dvmsPayload === 'string') {
        try {
          dvmsPayload = JSON.parse(dvmsPayload);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }

      this.connectionToken = dvmsPayload?.ConnectionToken || dvmsPayload?.connection_token || connectData?.connection_token || connectData?.data?.connection_token || connectData?.ConnectionToken;
      if (!this.connectionToken) {
        throw new Error('Connection Token not found in DVMS Connect response');
      }

      // Clear and populate the channelsMap
      this.channelsMap.clear();
      const listChannel = dvmsPayload?.ListChannel || dvmsPayload?.list_channel || [];
      if (Array.isArray(listChannel)) {
        for (const channel of listChannel) {
          const cid = channel?.CameraId || channel?.camera_id;
          const cname = channel?.CameraName || channel?.camera_name || 'Camera';
          const token = channel?.VideoAccessToken || channel?.video_access_token;
          if (cid) {
            this.channelsMap.set(cid, { cameraName: cname, videoAccessToken: token || '' });
          }
        }
        this.logger.log(`Populated channelsMap with ${this.channelsMap.size} cameras`);
      }

      this.logger.log(`DVMS Session established. ConnectionToken: ${this.connectionToken}`);
      return true;
    } catch (error) {
      this.lastError = `Auth Error: ${error.message}`;
      this.logger.error(`Authentication & Session setup failed: ${error.message}`);
      return false;
    }
  }

  private startKeepAlive() {
    this.stopKeepAlive();
    const dvmsUrl = process.env.LOVAD_DVMS_URL || 'https://localhost:10180';

    this.logger.log('Starting KeepAlive timer (every 40 seconds)');
    this.keepAliveTimer = setInterval(async () => {
      try {
        if (!this.accessToken || !this.lcmsServerId) return;
        const queryParams = new URLSearchParams({
          LCMSServerId: this.lcmsServerId,
          ConnectionToken: this.connectionToken || '',
        });

        const keepAliveRes = await fetch(`${dvmsUrl}/LAPI/KeepAlive?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Token': this.accessToken,
            'LCMSServerId': this.lcmsServerId,
          },
        });

        if (!keepAliveRes.ok) {
          this.logger.warn(`KeepAlive failed with status ${keepAliveRes.status}. Re-initiating connection...`);
          this.forceReconnect().catch((err) => {
            this.logger.error(`Failed to reconnect after KeepAlive failure: ${err.message}`);
          });
        } else {
          this.logger.log('DVMS Session KeepAlive succeeded');
        }
      } catch (error) {
        this.logger.warn(`KeepAlive request failed: ${error.message}. Re-initiating connection...`);
        this.forceReconnect().catch((err) => {
          this.logger.error(`Failed to reconnect after KeepAlive error: ${err.message}`);
        });
      }
    }, 40000); // 40 seconds
  }

  private stopKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
      this.logger.log('KeepAlive timer stopped');
    }
  }

  private async connectSignalR(): Promise<boolean> {
    const dvmsUrl = process.env.LOVAD_DVMS_URL || 'https://localhost:10180';
    this.logger.log(`Negotiating SignalR connection at: ${dvmsUrl}/signalr/negotiate`);

    try {
      // Step 1: Perform the negotiation request for SignalR 2.x
      const negotiateRes = await fetch(`${dvmsUrl}/signalr/negotiate?clientProtocol=1.5`, {
        method: 'GET',
      });

      if (!negotiateRes.ok) {
        throw new Error(`SignalR negotiation failed with status ${negotiateRes.status}`);
      }

      const negotiateData: any = await negotiateRes.json();
      this.logger.log(`SignalR negotiation response: ${JSON.stringify(negotiateData)}`);

      this.signalrConnectionToken = negotiateData?.ConnectionToken;
      if (!this.signalrConnectionToken) {
        throw new Error('ConnectionToken not found in SignalR negotiation response');
      }

      // Step 2: Establish the WebSocket connection
      const wsProtocolUrl = dvmsUrl.replace(/^http/, 'ws');
      const wsUrlParams = new URLSearchParams({
        transport: 'webSockets',
        clientProtocol: '1.5',
        connectionToken: this.signalrConnectionToken,
        connectionData: JSON.stringify([{ name: 'DvmsServerHub' }]),
      });

      const wsConnectUrl = `${wsProtocolUrl.replace(/\/$/, '')}/signalr/connect?${wsUrlParams.toString()}`;
      this.logger.log(`Connecting WebSocket to SignalR: ${wsConnectUrl}`);

      this.socket = new WebSocket(wsConnectUrl, {
        rejectUnauthorized: false, // Ignores self-signed certificate errors
      });

      return new Promise<boolean>((resolve) => {
        let isResolved = false;

        this.socket.on('open', () => {
          this.logger.log('SignalR WebSocket connection opened successfully');
          if (!isResolved) {
            isResolved = true;
            resolve(true);
          }
        });

        this.socket.on('message', (rawData: WebSocket.RawData) => {
          const dataStr = rawData.toString();
          this.logger.debug(`SignalR WebSocket message received: ${dataStr}`);

          try {
            const data = JSON.parse(dataStr);
            // Handle hub messages pushed by legacy SignalR 2.x (wrapped in array 'M')
            if (data?.M && Array.isArray(data.M)) {
              for (const msg of data.M) {
                if (msg.H === 'DvmsServerHub') {
                  if (msg.M === 'NewEventCome') {
                    this.logger.log('[SignalR WebSocket] NewEventCome callback triggered');
                    const event = msg.A?.[0];
                    const eventEx = msg.A?.[1];

                    // Process event asynchronously
                    this.processNewEvent(event, eventEx).catch((err) => {
                      this.logger.error(`Error processing new event: ${err.message}`, err.stack);
                    });
                  } else if (msg.M === 'Resubscribe') {
                    this.logger.warn('[SignalR WebSocket] Resubscribe requested by server! Re-initiating connection flow...');
                    this.forceReconnect().catch((err) => {
                      this.logger.error(`Failed to handle resubscribe request: ${err.message}`);
                    });
                  } else if (msg.M === 'UpdateRecordStatus') {
                    this.logger.log(`[SignalR WebSocket] UpdateRecordStatus: ${JSON.stringify(msg.A)}`);
                    try {
                      const recStatus = msg.A?.[0] || {};
                      const channels = Object.keys(recStatus);
                      for (const cid of channels) {
                        const statusObj = recStatus[cid];
                        const channelInfo = this.channelsMap.get(cid);
                        const cname = channelInfo?.cameraName || `Camera ${cid.substring(0, 8)}`;
                        const isRec = statusObj?.IsRecordingFine;
                        
                        this.eventsGateway.broadcastRealtimeLog({
                          id: `REC_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                          employeeId: 'SYSTEM',
                          hoTen: isRec ? 'Ghi hình hoạt động' : 'Ghi hình bị lỗi/dừng',
                          phongBan: 'Hệ thống LOVAD',
                          areaName: cname,
                          deviceName: cname,
                          time: new Date().toTimeString().split(' ')[0],
                          date: new Date().toLocaleDateString('vi-VN'),
                          status: 'Thông tin',
                          reason: isRec ? 'Camera đang ghi hình bình thường' : 'Camera bị dừng hoặc lỗi ghi hình',
                          cameraId: cid,
                          hlsUrl: `http://${new URL(process.env.LOVAD_DVMS_URL || 'https://localhost:10180').hostname}:10090/HLS/Play/${cid}/main/StartStream?clientToken=${this.connectionToken || ''}&videoAccessToken=${channelInfo?.videoAccessToken || ''}`,
                          imageUrl: null,
                          imageType: null,
                        });
                      }
                    } catch (err) {
                      this.logger.error(`Error broadcasting UpdateRecordStatus: ${err.message}`);
                    }
                  } else if (msg.M === 'UpdateVideoLostMask') {
                    this.logger.log(`[SignalR WebSocket] UpdateVideoLostMask: ${JSON.stringify(msg.A)}`);
                    try {
                      const lostMask = msg.A?.[0] || {};
                      const channels = Object.keys(lostMask);
                      for (const cid of channels) {
                        const isLost = lostMask[cid];
                        const channelInfo = this.channelsMap.get(cid);
                        const cname = channelInfo?.cameraName || `Camera ${cid.substring(0, 8)}`;
                        
                        this.eventsGateway.broadcastRealtimeLog({
                          id: `LOST_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                          employeeId: 'SYSTEM',
                          hoTen: isLost ? 'Mất tín hiệu camera' : 'Khôi phục tín hiệu',
                          phongBan: 'Hệ thống LOVAD',
                          areaName: cname,
                          deviceName: cname,
                          time: new Date().toTimeString().split(' ')[0],
                          date: new Date().toLocaleDateString('vi-VN'),
                          status: isLost ? 'Cảnh báo' : 'Thông tin',
                          reason: isLost ? 'Camera bị mất kết nối video' : 'Tín hiệu camera đã trực tuyến trở lại',
                          cameraId: cid,
                          hlsUrl: isLost ? null : `http://${new URL(process.env.LOVAD_DVMS_URL || 'https://localhost:10180').hostname}:10090/HLS/Play/${cid}/main/StartStream?clientToken=${this.connectionToken || ''}&videoAccessToken=${channelInfo?.videoAccessToken || ''}`,
                          imageUrl: null,
                          imageType: null,
                        });
                      }
                    } catch (err) {
                      this.logger.error(`Error broadcasting UpdateVideoLostMask: ${err.message}`);
                    }
                  }
                }
              }
            }
          } catch (err) {
            // Ignore non-JSON or heartbeat frames
          }
        });

        this.socket.on('error', (error) => {
          this.lastError = `SignalR WebSocket Error: ${error.message}`;
          this.logger.error(`SignalR WebSocket error: ${error.message}`);
          if (!isResolved) {
            isResolved = true;
            resolve(false);
          }
        });

        this.socket.on('close', (code, reason) => {
          const wasIntentional = this.connectionStatus === 'disconnected';
          this.connectionStatus = 'disconnected';
          this.logger.warn(`SignalR WebSocket closed: code=${code}, reason=${reason.toString()}`);
          
          if (!isResolved) {
            isResolved = true;
            resolve(false);
          }

          if (!wasIntentional) {
            this.logger.log('Automatic reconnection scheduled in 5 seconds...');
            setTimeout(() => {
              this.logger.log('Attempting automatic LOVAD reconnect...');
              this.forceReconnect().catch((err) => {
                this.logger.error(`Auto-reconnect failed: ${err.message}`);
              });
            }, 5000);
          }
        });
      });
    } catch (error) {
      this.lastError = `SignalR Connection failed: ${error.message}`;
      this.logger.error(`SignalR Connection failed: ${error.message}`);
      return false;
    }
  }

  private async subscribeToHub(): Promise<boolean> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.logger.error('Cannot subscribe: SignalR WebSocket is not open');
      return false;
    }

    try {
      this.logger.log('Sending subscription command to DvmsServerHub via WebSocket...');
      // Invoke command structure for SignalR 2.x
      const payload = {
        H: 'DvmsServerHub',
        M: 'Subscribe',
        A: [
          this.lcmsServerId,
          this.connectionToken,
          this.accessToken,
          3, // RemindMinutes (as per flow diagram)
        ],
        I: 1, // Invocation ID
      };

      this.socket.send(JSON.stringify(payload));
      this.logger.log('Subscription command sent successfully.');
      return true;
    } catch (error) {
      this.lastError = `Hub Subscribe Error: ${error.message}`;
      this.logger.error(`Failed to subscribe on DvmsServerHub: ${error.message}`);
      return false;
    }
  }

  private async disconnectSignalR() {
    if (this.socket) {
      try {
        this.socket.close();
        this.logger.log('SignalR WebSocket connection closed');
      } catch (err) {
        this.logger.warn(`Error closing SignalR WebSocket: ${err.message}`);
      } finally {
        this.socket = null;
      }
    }
  }

  /**
   * Module 3: Event Parser & Routing
   * Module 4: Image Handler (RAM only)
   */
  private async processNewEvent(event: any, eventEx: any) {
    try {
      this.logger.log('Parsing face detection event...');

      // Extract properties safely from event or eventEx (with nested VMSEvent support)
      const eventId = event?.VMSEvent?.Id || event?.EventId || event?.id || eventEx?.VMSEvent?.Id || eventEx?.EventId || `EVT_${Date.now()}`;
      
      const rawCameraId = event?.VMSEvent?.CameraId || event?.VMSEvent?.ChannelId || event?.CameraId || event?.source_id || eventEx?.VMSEvent?.CameraId || eventEx?.CameraId || 'unknown_camera';

      let finalCameraId = rawCameraId;
      if ((finalCameraId === 'unknown_camera' || !this.channelsMap.has(finalCameraId)) && this.channelsMap.size > 0) {
        const firstCameraId = this.channelsMap.keys().next().value;
        if (firstCameraId) {
          finalCameraId = firstCameraId;
          this.logger.log(`Camera ID '${rawCameraId}' not found in channelsMap. Falling back to first active camera: '${finalCameraId}'`);
        }
      }

      const channelInfo = this.channelsMap.get(finalCameraId);
      const cameraName = channelInfo?.cameraName || event?.VMSEvent?.CameraName || event?.CameraName || eventEx?.VMSEvent?.CameraName || eventEx?.CameraName || 'Camera';
      const timestamp = event?.VMSEvent?.CreateTime || event?.VMSEvent?.EventTime || event?.EventTime || event?.time_start || eventEx?.VMSEvent?.CreateTime || eventEx?.EventTime || new Date().toISOString();

      // Person details (face detection features)
      const personId = event?.VMSEvent?.ObjectId || event?.ObjectId || event?.human_id || eventEx?.VMSEvent?.ObjectId || eventEx?.ObjectId || '';
      const personName = event?.VMSEvent?.ObjectName || event?.ObjectName || event?.full_name || eventEx?.VMSEvent?.ObjectName || eventEx?.ObjectName || 'Khách vãng lai';

      const parsedEvent: LovadEvent = {
        eventId,
        cameraId: finalCameraId,
        cameraName,
        timestamp,
        personId,
        personName,
        receivedAt: new Date().toISOString(),
        rawEvent: { event, eventEx },
      };

      // Module 4: Image handling
      // Check if image data is directly present in base64 format (Path A)
      const base64JpgData = event?.ImgJpgData || eventEx?.ImgJpgData;

      if (base64JpgData && base64JpgData.trim().length > 0) {
        this.logger.log(`Found direct Base64 image in event payload`);
        parsedEvent.imageUrl = `data:image/jpeg;base64,${base64JpgData}`;
        parsedEvent.imageType = 'base64';
      } else {
        // Path B: Check for event images lists to pull via HTTP GET
        const listImages = event?.ListEventImages || eventEx?.ListEventImages || [];
        if (listImages.length > 0) {
          const firstImage = listImages[0];
          const statisticId = firstImage?.StatisticId || event?.StatisticId || eventEx?.StatisticId;
          const createdTime = firstImage?.CreatedTime || timestamp;

          if (statisticId) {
            this.logger.log(`Triggering HTTP Pull for Image. StatisticId: ${statisticId}`);
            const base64Image = await this.downloadImage(statisticId, createdTime);
            if (base64Image) {
              parsedEvent.imageUrl = `data:image/jpeg;base64,${base64Image}`;
              parsedEvent.imageType = 'base64';
            }
          }
        }
      }

      // Add to RAM memory (acting as in-memory cache)
      this.eventsRam.unshift(parsedEvent); // Add new events to the top of the array

      // Cap size to prevent leaks
      if (this.eventsRam.length > this.MAX_EVENTS_RAM) {
        this.eventsRam.pop();
      }

      this.logger.log(`Parsed and stored event ${eventId} in RAM. Current size: ${this.eventsRam.length}`);

      // Broadcast to Socket.io clients
      try {
        const dvmsUrl = process.env.LOVAD_DVMS_URL || 'https://localhost:10180';
        const hostname = new URL(dvmsUrl).hostname;
        const channelInfo = this.channelsMap.get(parsedEvent.cameraId);
        const videoAccessToken = channelInfo?.videoAccessToken || '';
        
        // Build HLS Stream URL
        const hlsUrl = `http://${hostname}:10090/HLS/Play/${parsedEvent.cameraId}/main/StartStream?clientToken=${this.connectionToken || ''}&videoAccessToken=${videoAccessToken}`;

        // Format dates and times
        let timeString = new Date().toTimeString().split(' ')[0];
        let dateString = new Date().toLocaleDateString('vi-VN');
        if (timestamp) {
          try {
            const dateObj = new Date(timestamp);
            if (!isNaN(dateObj.getTime())) {
              timeString = dateObj.toTimeString().split(' ')[0];
              dateString = dateObj.toLocaleDateString('vi-VN');
            }
          } catch (e) {
            // Keep default
          }
        }

        const wsPayload = {
          id: eventId,
          employeeId: personId || `EMP_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          hoTen: personName || 'Khách vãng lai',
          phongBan: 'Hệ thống LOVAD',
          areaName: cameraName || 'LOVAD Area',
          deviceName: cameraName || 'LOVAD Device',
          time: timeString,
          date: dateString,
          status: 'Thành công',
          cameraId: parsedEvent.cameraId,
          hlsUrl: hlsUrl,
          imageUrl: parsedEvent.imageUrl || null,
          imageType: parsedEvent.imageType || null,
        };

        this.eventsGateway.broadcastRealtimeLog(wsPayload);
      } catch (err) {
        this.logger.error(`Failed to broadcast realtime event to gateway: ${err.message}`);
      }
    } catch (error) {
      this.logger.error(`Failed to parse/route event: ${error.message}`);
    }
  }

  /**
   * Module 4: Image Downloader (Download and keep as Base64 in RAM)
   */
  private async downloadImage(statisticId: string, createdTime: string): Promise<string | null> {
    const dvmsUrl = process.env.LOVAD_DVMS_URL || 'https://localhost:10180';

    try {
      // Standard pull URL structure from design doc
      // GET /LAPI/GetEventImages?StatisticId={StatisticId}&CreatedTime={CreatedTime}&Token={Token}&LCMSServerId={LCMSServerId}
      const queryParams = new URLSearchParams({
        StatisticId: statisticId,
        CreatedTime: createdTime,
        Token: this.connectionToken || '',
        LCMSServerId: this.lcmsServerId || '',
        Type: '4', // Let's pull Face Crop (type 4) or Full View (type 1). Default to face crop.
      });

      const downloadUrl = `${dvmsUrl}/LAPI/GetEventImages?${queryParams.toString()}`;
      this.logger.log(`Fetching image from: ${downloadUrl}`);

      const res = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Token': this.accessToken || '',
          'LCMSServerId': this.lcmsServerId || '',
        }
      });

      if (!res.ok) {
        this.logger.warn(`Failed to download image. Status: ${res.status}`);
        return null;
      }

      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      this.logger.log(`Image downloaded successfully. Size: ${buffer.byteLength} bytes`);
      return base64;
    } catch (error) {
      this.logger.error(`Error downloading event image: ${error.message}`);
      return null;
    }
  }

  getStreamUrl(cameraId: string) {
    const dvmsUrl = process.env.LOVAD_DVMS_URL || 'https://localhost:10180';
    const hostname = new URL(dvmsUrl).hostname;
    
    // Fallback to first active camera if not found or unknown
    let finalCameraId = cameraId;
    if ((finalCameraId === 'unknown_camera' || !this.channelsMap.has(finalCameraId)) && this.channelsMap.size > 0) {
      const firstCameraId = this.channelsMap.keys().next().value;
      if (firstCameraId) {
        finalCameraId = firstCameraId;
      }
    }

    const channelInfo = this.channelsMap.get(finalCameraId);
    const videoAccessToken = channelInfo?.videoAccessToken || '';
    const hlsUrl = `http://${hostname}:10090/HLS/Play/${finalCameraId}/main/StartStream?clientToken=${this.connectionToken || ''}&videoAccessToken=${videoAccessToken}`;
    
    return {
      cameraId: finalCameraId,
      cameraName: channelInfo?.cameraName || 'Camera',
      hlsUrl: hlsUrl,
    };
  }
}
