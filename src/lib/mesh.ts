import { MeshPacket } from "@/types/mesh";
import { generatePacketId, encryptMessage, decryptMessage } from "./crypto";

const MAX_HOPS = 5;
const CHUNK_SIZE = 30;
// Encrypted payloads are longer (base64), so use a smaller chunk size for plaintext before encryption
const ENCRYPTED_CHUNK_SIZE = 20;
const seenPackets = new Set<string>();

/**
 * Create mesh packets with automatic AES-256-GCM encryption when privacyCode is provided.
 * Encryption happens at the mesh layer so ALL packets are encrypted before transmission.
 */
export async function createPackets(
  senderId: string,
  text: string,
  mode: "public" | "private" | "findId",
  privacyCode?: string
): Promise<MeshPacket[]> {
  const shouldEncrypt = !!privacyCode && mode === "private";
  const chunkSize = shouldEncrypt ? ENCRYPTED_CHUNK_SIZE : CHUNK_SIZE;

  if (text.length <= chunkSize) {
    const payload = shouldEncrypt ? await encryptMessage(text, privacyCode) : text;
    return [
      {
        uniqueId: generatePacketId(),
        senderId,
        payload,
        encrypted: shouldEncrypt,
        hopCount: MAX_HOPS,
        maxHops: MAX_HOPS,
        mode,
        timestamp: Date.now(),
      },
    ];
  }

  // Chunk the plaintext first, then encrypt each chunk individually
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  const batchId = generatePacketId();
  const packets = await Promise.all(
    chunks.map(async (chunk, i) => {
      const payload = shouldEncrypt ? await encryptMessage(chunk, privacyCode) : chunk;
      return {
        uniqueId: `${batchId}-${i}`,
        senderId,
        payload,
        encrypted: shouldEncrypt,
        hopCount: MAX_HOPS,
        maxHops: MAX_HOPS,
        mode,
        chunk: { index: i, total: chunks.length },
        timestamp: Date.now(),
      };
    })
  );

  return packets;
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

/**
 * Reassemble chunked packets and optionally decrypt.
 * Each chunk is decrypted individually before joining.
 */
export async function reassembleChunks(
  packets: MeshPacket[],
  privacyCode?: string
): Promise<string | null> {
  if (!packets[0]) return null;

  const isEncrypted = packets[0].encrypted;

  if (!packets[0].chunk) {
    const payload = packets[0].payload;
    if (isEncrypted && privacyCode) {
      return await decryptMessage(payload, privacyCode);
    }
    return payload;
  }

  const total = packets[0].chunk.total;
  if (packets.length < total) return null;

  const sorted = [...packets].sort(
    (a, b) => (a.chunk?.index ?? 0) - (b.chunk?.index ?? 0)
  );

  if (isEncrypted && privacyCode) {
    const decryptedChunks = await Promise.all(
      sorted.map((p) => decryptMessage(p.payload, privacyCode))
    );
    // If any chunk fails to decrypt, return null
    if (decryptedChunks.some((c) => c === null)) return null;
    return decryptedChunks.join("");
  }

  return sorted.map((p) => p.payload).join("");
}
