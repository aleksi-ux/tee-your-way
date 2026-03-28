import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Circle, Settings, Lock, Unlock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChatMode, MeshMessage } from "@/types/mesh";
import { encryptMessage, decryptMessage } from "@/lib/crypto";
import { createPackets } from "@/lib/mesh";

interface ChatScreenProps {
  userId: string;
  messages: MeshMessage[];
  onSend: (msg: MeshMessage) => void;
  onOpenSettings: () => void;
  onOpenScanner?: () => void;
  onOpenDebug?: () => void;
  privacyCode: string;
  codeLocked: boolean;
  bleConnected?: boolean;
}

const MAX_CHARS = 80;

const getStatusColor = (len: number) => {
  if (len <= 30) return "bg-emerald-500";
  if (len <= 50) return "bg-amber-500";
  return "bg-red-500";
};

const getStatusLabel = (len: number) => {
  if (len <= 30) return "OK";
  if (len <= 50) return "!";
  return "!!";
};

const ChatScreen = ({
  userId,
  messages,
  onSend,
  onOpenSettings,
  onOpenScanner,
  onOpenDebug,
  privacyCode,
  codeLocked,
  bleConnected,
}: ChatScreenProps) => {
  const [mode, setMode] = useState<ChatMode>("public");
  const [input, setInput] = useState("");
  const [findIdInput, setFindIdInput] = useState("");
  const [findIdStatus, setFindIdStatus] = useState<string | null>(null);
  const [decryptedCache, setDecryptedCache] = useState<Record<string, string>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredMessages = messages.filter((m) => {
    if (mode === "findId") return m.mode === "findId";
    return m.mode === mode;
  });

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    const text = input.trim();

    let payload = text;
    let encrypted = false;

    if (mode === "private" && privacyCode && codeLocked) {
      payload = await encryptMessage(text, privacyCode);
      encrypted = true;
    }

    const packets = createPackets(userId, payload, encrypted, mode);
    const msg: MeshMessage = {
      id: packets[0].uniqueId,
      senderId: userId,
      text: payload,
      encrypted,
      timestamp: new Date(),
      hops: 0,
      mode,
    };
    onSend(msg);
    setInput("");
  }, [input, mode, privacyCode, codeLocked, userId, onSend]);

  const handleFindId = useCallback(() => {
    if (!findIdInput.trim()) return;
    const target = findIdInput.trim();
    setFindIdStatus("Etsitään...");

    const pingMsg: MeshMessage = {
      id: `ping-${Date.now()}`,
      senderId: userId,
      text: `PING ${target}`,
      encrypted: false,
      timestamp: new Date(),
      hops: 0,
      mode: "findId",
    };
    onSend(pingMsg);

    // Simulate response
    const found = Math.random() > 0.4;
    setTimeout(
      () => {
        if (found) {
          const reply: MeshMessage = {
            id: `pong-${Date.now()}`,
            senderId: target,
            text: "Found",
            encrypted: false,
            timestamp: new Date(),
            hops: Math.floor(Math.random() * 4) + 1,
            mode: "findId",
          };
          onSend(reply);
          setFindIdStatus(`${target} löytyi!`);
        } else {
          setFindIdStatus("Käyttäjää ei löytynyt");
        }
      },
      found ? 2000 + Math.random() * 3000 : 30000
    );
    setFindIdInput("");
  }, [findIdInput, userId, onSend]);

  const handleDecrypt = useCallback(
    async (msgId: string, ciphertext: string) => {
      if (!privacyCode) return;
      const result = await decryptMessage(ciphertext, privacyCode);
      if (result) {
        setDecryptedCache((prev) => ({ ...prev, [msgId]: result }));
      }
    },
    [privacyCode]
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-md">
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as ChatMode)}
          className="flex-1"
        >
          <TabsList className="bg-muted/50 h-9">
            <TabsTrigger value="public" className="text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Public
            </TabsTrigger>
            <TabsTrigger value="private" className="text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Lock className="w-3 h-3 mr-1" />
              Private
            </TabsTrigger>
            <TabsTrigger value="findId" className="text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Search className="w-3 h-3 mr-1" />
              Find ID
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          className="ml-2 text-muted-foreground hover:text-foreground"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Mode indicator */}
      <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border/50 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span>
          {mode === "public" && "Julkinen kanava – kaikki näkevät"}
          {mode === "private" &&
            (codeLocked
              ? "Salattu kanava – AES-256"
              : "⚠ Aseta salauskoodi asetuksista")}
          {mode === "findId" && "Etsi käyttäjä ID:llä"}
        </span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">
          {userId}
        </span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="flex flex-col gap-2.5 max-w-lg mx-auto">
          <AnimatePresence>
            {filteredMessages.map((msg) => {
              const isOwn = msg.senderId === userId;
              const decrypted = decryptedCache[msg.id];
              const showEncrypted = msg.encrypted && !isOwn && !decrypted;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                >
                  {/* Sender ID */}
                  {!isOwn && (
                    <span className="text-[10px] font-mono text-primary/70 mb-0.5 px-1">
                      {msg.senderId}
                    </span>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm break-words overflow-hidden ${
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card border border-border text-foreground rounded-bl-md"
                    }`}
                  >
                    {showEncrypted ? (
                      <div className="flex items-center gap-2">
                        <Lock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground italic">
                          [Salattu viesti]
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-primary"
                          onClick={() => handleDecrypt(msg.id, msg.text)}
                        >
                          <Unlock className="w-3 h-3 mr-1" />
                          Decrypt
                        </Button>
                      </div>
                    ) : (
                      <span>{decrypted || msg.text}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 px-1">
                    <span className="text-[10px] text-muted-foreground">
                      {msg.timestamp.toLocaleTimeString("fi", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {msg.hops > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        via {msg.hops} {msg.hops === 1 ? "hop" : "hops"}
                      </span>
                    )}
                    {msg.encrypted && (
                      <Lock className="w-2.5 h-2.5 text-primary/60" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Find ID input */}
      {mode === "findId" && (
        <div className="px-4 py-3 border-t border-border bg-card/80 backdrop-blur-md">
          <div className="flex gap-2 max-w-lg mx-auto">
            <Input
              value={findIdInput}
              onChange={(e) => setFindIdInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFindId()}
              placeholder="user#1234"
              className="rounded-xl bg-muted/40 border-border text-foreground font-mono"
            />
            <Button
              onClick={handleFindId}
              disabled={!findIdInput.trim()}
              className="rounded-xl bg-primary hover:bg-primary/80"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
          {findIdStatus && (
            <p className="text-xs text-center mt-2 text-muted-foreground">
              {findIdStatus}
            </p>
          )}
        </div>
      )}

      {/* Message input */}
      {mode !== "findId" && (
        <div className="px-4 py-3 border-t border-border bg-card/80 backdrop-blur-md">
          <div className="flex items-center gap-2 max-w-lg mx-auto">
            {/* Status indicator */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="relative flex-shrink-0">
                  <Circle
                    className={`w-5 h-5 ${getStatusColor(input.length)} rounded-full`}
                    fill="currentColor"
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-background">
                    {getStatusLabel(input.length)}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-[200px]">
                Lyhyet viestit ovat luotettavampia mesh-verkossa.
              </TooltipContent>
            </Tooltip>

            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) =>
                  setInput(e.target.value.slice(0, MAX_CHARS))
                }
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={
                  mode === "private" && !codeLocked
                    ? "Aseta salauskoodi ensin..."
                    : "Kirjoita viesti..."
                }
                disabled={mode === "private" && !codeLocked}
                className="rounded-xl bg-muted/40 border-border text-foreground pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/50 font-mono">
                {input.length}/{MAX_CHARS}
              </span>
            </div>

            <Button
              onClick={handleSend}
              disabled={!input.trim() || (mode === "private" && !codeLocked)}
              size="icon"
              className="w-10 h-10 rounded-xl bg-primary hover:bg-primary/80 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatScreen;
