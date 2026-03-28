export type ChatMode = "public" | "private" | "findId";

export interface MeshMessage {
  id: string;
  senderId: string;
  text: string;
  encrypted: boolean;
  timestamp: Date;
  hops: number;
  mode: ChatMode;
  chunk?: { index: number; total: number };
}

export interface MeshPacket {
  uniqueId: string;
  senderId: string;
  payload: string;
  encrypted: boolean;
  hopCount: number;
  maxHops: number;
  mode: ChatMode;
  chunk?: { index: number; total: number };
  timestamp: number;
}

export interface UserSettings {
  privacyCode: string;
  channelFingerprint: string;
  codeLocked: boolean;
  wipeOnClose: boolean;
}

export interface PeerDevice {
  id: string;
  lastSeen: Date;
  signalStrength: number;
}
