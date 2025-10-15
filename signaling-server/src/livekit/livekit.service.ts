import { Injectable } from '@nestjs/common';
import { AccessToken, Room, RoomServiceClient } from 'livekit-server-sdk';

@Injectable()
export class LivekitService {
  private readonly roomService: RoomServiceClient;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor() {
    this.apiKey = process.env.LIVEKIT_API_KEY as string;
    this.apiSecret = process.env.LIVEKIT_API_SECRET as string;
    this.roomService = new RoomServiceClient(
      process.env.LIVEKIT_URL as string,
      this.apiKey,
      this.apiSecret,
    );
  }

  getAccessToken(roomName: string, participantName: string): Promise<string> {
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantName,
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: false,
      canSubscribe: true,
    });

    return at.toJwt();
  }

  // Optional: Add methods to manage rooms, e.g., for creating a room
  async createRoom(roomName: string) {
    const opts = {
      name: roomName,
      emptyTimeout: 10 * 60, // 10 minutes
      maxParticipants: 20,
    };
    this.roomService.createRoom(opts).then((room: Room) => {
      console.log('room created', room);
    });
  }

  async listRoom() {
    this.roomService.listRooms().then((rooms: Room[]) => {
      console.log('existing rooms', rooms);
    });
  }

  async deleteRoom(roomName: string) {
    this.roomService.deleteRoom(roomName).then(() => {
      console.log('room deleted');
    });
  }
}
