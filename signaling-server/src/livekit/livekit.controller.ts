import { Controller, Get, Query } from '@nestjs/common';
import { LivekitService } from './livekit.service';
import { AccessToken } from 'livekit-server-sdk';

@Controller('livekit')
export class LivekitController {
  constructor(private readonly livekitService: LivekitService) {}

  @Get('token')
  getLivekitToken(
    @Query('room') room: string,
    @Query('username') username: string,
  ) {
    if (!room || !username) {
      return { error: 'Room and username are required.' };
    }
    const token = this.livekitService.getAccessToken(room, username);
    console.log(token);
    return { token };
  }
}
