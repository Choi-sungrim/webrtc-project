import { Controller, Get, Query } from '@nestjs/common';
import { LivekitService } from './livekit.service';

@Controller('livekit')
export class LivekitController {
  constructor(private readonly livekitService: LivekitService) {}

  @Get('token')
  async getToken(
    @Query('room') roomName: string,
    @Query('username') username: string,
  ): Promise<{ token: string }> {
    const jwtTokenString = await this.livekitService.getAccessToken(
      roomName,
      username,
    );

    return {
      token: jwtTokenString,
    };
  }

  @Get('rooms')
  async listRooms() {
    return await this.livekitService.listRooms();
  }
}
