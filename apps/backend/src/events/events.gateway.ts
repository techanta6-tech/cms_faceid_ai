import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    
    // Gửi sự kiện chào mừng
    client.emit('connection_status', { status: 'connected', clientId: client.id });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  private generateMockLog() {
    const names = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Hoàng C', 'Phạm Minh D', 'Vũ Thu E'];
    const departments = ['Phòng Ban 1', 'Phòng Ban 2', 'Phòng Nhân Sự', 'Ban Giám Đốc'];
    const areas = ['Cửa Ra Vào Chính', 'Cửa Phụ Tầng 1', 'Cổng Bảo Vệ', 'Phòng Server'];
    const deviceNames = ['Máy chấm công khuôn mặt FaceID-01', 'Đầu đọc vân tay FR-102', 'Máy quét thẻ Card-03'];
    
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomDept = departments[Math.floor(Math.random() * departments.length)];
    const randomArea = areas[Math.floor(Math.random() * areas.length)];
    const randomDevice = deviceNames[Math.floor(Math.random() * deviceNames.length)];
    
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];
    const dateString = now.toLocaleDateString('vi-VN');

    return {
      id: 'LOG_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      employeeId: 'EMP_' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      hoTen: randomName,
      phongBan: randomDept,
      areaName: randomArea,
      deviceName: randomDevice,
      time: timeString,
      date: dateString,
      status: Math.random() > 0.15 ? 'Thành công' : 'Thất bại',
      reason: Math.random() > 0.15 ? '' : (Math.random() > 0.5 ? 'Không đúng ca trực' : 'Thiết bị không xác nhận được thẻ')
    };
  }

  @SubscribeMessage('ping_server')
  handlePing(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log(`Received ping from client ${client.id}:`, data);
    return { event: 'pong_client', data: { message: 'Hello from NestJS WebSocket Server!', time: new Date() } };
  }

  broadcastRealtimeLog(log: any) {
    if (this.server) {
      this.server.emit('realtime_log', log);
      console.log('[EventsGateway] Broadcasted realtime_log to clients:', log.id);
    }
  }
}
