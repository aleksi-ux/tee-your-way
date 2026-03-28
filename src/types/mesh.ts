export interface MeshDevice {
  id: string;
  name: string;
  signal: number; // 0-100
  role: "relay" | "receiver";
  lastSeen: Date;
}

export interface ChatConversation {
  id: string;
  name: string;
  lastMessage: string;
  lastTime: Date;
  unread: number;
  hops: number;
  online: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  isOwn: boolean;
  timestamp: Date;
  hops: number;
  delivered: boolean;
}

export interface MeshStats {
  nodesCount: number;
  routeHops: number;
  messagesSent: number;
  messagesRelayed: number;
}

export interface UserSettings {
  nickname: string;
  aesEnabled: boolean;
  visible: boolean;
}
