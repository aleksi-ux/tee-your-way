import { MeshDevice, ChatConversation, ChatMessage, MeshStats, UserSettings } from "@/types/mesh";

export const mockDevices: MeshDevice[] = [
  { id: "d1", name: "Anon-7F3A", signal: 92, role: "relay", lastSeen: new Date() },
  { id: "d2", name: "Anon-B2C1", signal: 74, role: "receiver", lastSeen: new Date() },
  { id: "d3", name: "Anon-9E4D", signal: 58, role: "relay", lastSeen: new Date() },
  { id: "d4", name: "Anon-1A8F", signal: 35, role: "receiver", lastSeen: new Date() },
  { id: "d5", name: "Anon-C5E2", signal: 81, role: "relay", lastSeen: new Date() },
];

export const mockConversations: ChatConversation[] = [
  { id: "c1", name: "Anon-7F3A", lastMessage: "Sain viestin, kiitos! 🔒", lastTime: new Date(Date.now() - 60000), unread: 2, hops: 1, online: true },
  { id: "c2", name: "Anon-B2C1", lastMessage: "Mesh toimii hyvin täällä", lastTime: new Date(Date.now() - 300000), unread: 0, hops: 3, online: true },
  { id: "c3", name: "Anon-9E4D", lastMessage: "Kokeile lähettää kuva", lastTime: new Date(Date.now() - 3600000), unread: 1, hops: 2, online: false },
];

export const mockMessages: Record<string, ChatMessage[]> = {
  c1: [
    { id: "m1", text: "Hei! Oletko mesh-verkossa?", isOwn: false, timestamp: new Date(Date.now() - 120000), hops: 1, delivered: true },
    { id: "m2", text: "Jep, yhteys toimii! 🛡️", isOwn: true, timestamp: new Date(Date.now() - 90000), hops: 1, delivered: true },
    { id: "m3", text: "Sain viestin, kiitos! 🔒", isOwn: false, timestamp: new Date(Date.now() - 60000), hops: 1, delivered: true },
  ],
  c2: [
    { id: "m4", text: "Terve! Montako solmua näet?", isOwn: true, timestamp: new Date(Date.now() - 600000), hops: 3, delivered: true },
    { id: "m5", text: "Näen 4 laitetta, 3 hyppyä sinulle", isOwn: false, timestamp: new Date(Date.now() - 500000), hops: 3, delivered: true },
    { id: "m6", text: "Mesh toimii hyvin täällä", isOwn: false, timestamp: new Date(Date.now() - 300000), hops: 3, delivered: true },
  ],
  c3: [
    { id: "m7", text: "Kokeile lähettää kuva", isOwn: false, timestamp: new Date(Date.now() - 3600000), hops: 2, delivered: true },
  ],
};

export const mockStats: MeshStats = {
  nodesCount: 5,
  routeHops: 3,
  messagesSent: 24,
  messagesRelayed: 67,
};

export const defaultSettings: UserSettings = {
  nickname: "Anon-User",
  aesEnabled: true,
  visible: true,
};
