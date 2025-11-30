import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { FlowrunService } from './flowrun.service';
import { RunFlowDto } from './dto/flow-run.dto';

@WebSocketGateway({
  cors: { origin: '*' },           // tùy chỉnh theo domain của bạn
  transports: ['websocket'],       // optional: ép dùng websocket thuần
  namespace: '/flow-run',                  // mặc định "/"
})
export class FlowrunGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly flowrunService: FlowrunService) {}

  handleConnection(client: Socket) {
    console.log('WS connected:', client.id);
    client.emit('hello', { msg: 'Welcome!' });
  }

  handleDisconnect(client: Socket) {
    console.log('WS disconnected:', client.id);
  }

  @SubscribeMessage('run:start')
  async handleRunStart(
    @MessageBody() payload: RunFlowDto,
    @ConnectedSocket() client: Socket,
  ) {
    // ủy quyền cho service thực thi và stream lên chính socket này
    return this.flowrunService.runFlowInSocket(client, payload);
  }
}
