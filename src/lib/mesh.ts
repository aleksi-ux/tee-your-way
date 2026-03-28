import { MeshPacket } from "@/types/mesh";
import { generatePacketId } from "./crypto";

const MAX_HOPS = 5;
const CHUNK_SIZE = 30;
const seenPackets = new Set<string>();

export function createPackets(
  senderId: string,
  text: string,
  encrypted: boolean,
  mode: "public" | "private" | "findId"
): MeshPacket[] {
  if (text.length <= CHUNK_SIZE) {
    return [
      {
        uniqueId: generatePacketId(),
        senderId,
        payload: text,
        encrypted,
        hopCount: MAX_HOPS,
        maxHops: MAX_HOPS,
        mode,
        timestamp: Date.now(),
      },
    ];
  }

  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }

  const batchId = generatePacketId();
  return chunks.map((chunk, i) => ({
    uniqueId: `${batchId}-${i}`,
    senderId,
    payload: chunk,
    encrypted,
    hopCount: MAX_HOPS,
    maxHops: MAX_HOPS,
    mode,
    chunk: { index: i, total: chunks.length },
    timestamp: Date.now(),
  }));
}

export function shouldRelay(packet: MeshPacket): boolean {
  if (seenPackets.has(packet.uniqueId)) return false;
  if (packet.hopCount <= 0) return false;
  seenPackets.add(packet.uniqueId);
  // Clean old packets periodically
  if (seenPackets.size > 1000) {
    const arr = Array.from(seenPackets);
    arr.slice(0, 500).forEach((id) => seenPackets.delete(id));
  }
  return true;
}

export function getRelayDelay(): number {
  return 100 + Math.random() * 400;
}

export function reassembleChunks(
  packets: MeshPacket[]
): string | null {
  if (!packets[0]?.chunk) return packets[0]?.payload ?? null;
  const total = packets[0].chunk.total;
  if (packets.length < total) return null;
  const sorted = [...packets].sort((a, b) => (a.chunk?.index ?? 0) - (b.chunk?.index ?? 0));
  return sorted.map((p) => p.payload).join("");
}
