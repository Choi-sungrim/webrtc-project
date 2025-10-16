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
      // RoomServiceClient.listRooms()가 실패하면 여기서 catch됩니다.
      return await this.roomService.listRooms();
    } catch (error) {
      console.error('LiveKit 서버에서 룸 목록 조회 실패:', error);
      // ⭐️ 오류 발생 시 빈 배열을 반환하거나, 적절한 HTTP 예외를 던집니다.
      // 여기서는 클라이언트에 빈 목록을 보여주기 위해 빈 배열을 반환합니다.
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
