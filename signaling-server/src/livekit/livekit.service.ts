import { Injectable } from '@nestjs/common';
import { AccessToken, Room, RoomServiceClient } from 'livekit-server-sdk';

@Injectable()
export class LivekitService {
  private readonly roomService: RoomServiceClient;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly host: string;

  constructor() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    this.apiKey = process.env.LIVEKIT_API_KEY as string;
    this.apiSecret = process.env.LIVEKIT_API_SECRET as string;
    this.host = process.env.LIVEKIT_URL as string;

    if (!this.host || !this.apiKey || !this.apiSecret) {
      throw new Error(
        `LiveKit environment variables (URL${this.host}, KEY${this.apiKey}, SECRET ${this.apiSecret}) must be set.`,
      );
    }

    this.roomService = new RoomServiceClient(
      this.host,
      this.apiKey,
      this.apiSecret,
    );
  }

  async getAccessToken(
    roomName: string,
    participantName: string,
  ): Promise<string> {
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantName,
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    return await at.toJwt();
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

  async listRooms(): Promise<Room[]> {
    try {
      return await this.roomService.listRooms();
    } catch (error) {
      console.error('LiveKit 서버에서 룸 목록 조회 실패:', error);
      return [];
    }
  }

  async deleteRoom(roomName: string) {
    this.roomService.deleteRoom(roomName).then(() => {
      console.log('room deleted');
    });
  }

  async listParticipant(roomName: string) {
    await this.roomService.listParticipants(roomName).then((ts) => {
      console.log(`Participant list ${ts.toString}`);
    });
  }

  async getParticipant(roomName: string, participants: string) {
    await this.roomService.getParticipant(roomName, participants).then((ts) => {
      console.log(`${ts}`);
    });
  }

  async updateParticipantGrant(
    roomName: string,
    participants: string,
    pubGrant: boolean,
    pubDataGrant: boolean,
    subGrant: boolean,
  ) {
    await this.roomService.updateParticipant(
      roomName,
      participants,
      undefined,
      {
        canPublish: pubGrant,
        canSubscribe: subGrant,
        canPublishData: pubDataGrant,
      },
    );
  }

  async moveParticipant(
    roomName: string,
    participants: string,
    destinationRoom: string,
  ) {
    await this.roomService.moveParticipant(
      roomName,
      participants,
      destinationRoom,
    );
  }

  async removeParticipant(roomName: string, participants: string) {
    await this.roomService.removeParticipant(roomName, participants);
  }

  async muteParticipant(
    roomName: string,
    participants: string,
    options: boolean,
  ) {
    await this.roomService.mutePublishedTrack(
      roomName,
      participants,
      'track_sid',
      options,
    );
  }
}
