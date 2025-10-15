export interface ConnectedSocket {
  socketId: string;
  userName: string;
}

export interface Offer {
  offererUserName: string;
  offer: any;
  offerIceCandidates: any[];
  answererUserName: string | null;
  answer: any | null;
  answererIceCandidates: any[];
  socketId: string;
  answererSocketId?: string;
}
