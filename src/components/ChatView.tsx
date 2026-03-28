import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Send, Lock, Radio } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/types/mesh";

interface ChatViewProps {
  chatId: string;
  name: string;
  messages: ChatMessage[];
  onBack: () => void;
  onSend: (chatId: string, text: string) => void;
}

const formatTime = (date: Date) =>
  date.toLocaleTimeString("fi", { hour: "2-digit", minute: "2-digit" });

const ChatView = ({ chatId, name, messages, onBack, onSend }: ChatViewProps) => {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(chatId, input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-card/80 backdrop-blur-md">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
          <Radio className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-foreground">{name}</h1>
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-secondary" />
            <span className="text-xs text-secondary font-medium">E2E-salattu</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-3 max-w-lg mx-auto">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.15 }}
                className={`flex flex-col ${msg.isOwn ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.isOwn
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.text}
                </div>
                <div className="flex items-center gap-2 mt-1 px-1">
                  <span className="text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
                  <span className="text-[10px] text-muted-foreground">
                    via {msg.hops} {msg.hops === 1 ? "hop" : "hops"}
                  </span>
                  {msg.isOwn && msg.delivered && (
                    <span className="text-[10px] text-secondary">✓✓</span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-4 border-t border-border bg-card/80 backdrop-blur-md">
        <div className="flex gap-2 max-w-lg mx-auto">
          <div className="flex items-center gap-2 flex-1 bg-muted/40 border border-border rounded-2xl px-4">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Kirjoita viesti..."
              className="border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button
            onClick={handleSend}
            size="icon"
            className="w-11 h-11 rounded-xl bg-primary hover:bg-primary/80"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
