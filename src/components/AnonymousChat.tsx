import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Send, Lock, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: number;
  sender: string;
  text: string;
  isOwn: boolean;
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: 0,
    sender: "System",
    text: "Message Decrypted! Secret key shared successfully. 🔐",
    isOwn: false,
    timestamp: new Date(),
  },
  {
    id: 1,
    sender: "You",
    text: "Hey! Here's the secret info you asked for... 🔒🛡️",
    isOwn: true,
    timestamp: new Date(),
  },
  {
    id: 2,
    sender: "Anon42",
    text: "Got it! Thanks so much! 🤫🔒",
    isOwn: false,
    timestamp: new Date(),
  },
];

const AnonymousChat = ({ onBack }: { onBack: () => void }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length,
        sender: "You",
        text: input,
        isOwn: true,
        timestamp: new Date(),
      },
    ]);
    setInput("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-card to-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-card/80 backdrop-blur-md">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-secondary" />
          <h1 className="text-xl font-bold text-foreground">Anonymous Chat</h1>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-3 max-w-lg mx-auto">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col ${msg.isOwn ? "items-start" : "items-end"}`}
              >
                {/* System message */}
                {msg.sender === "System" ? (
                  <div className="w-full rounded-xl bg-secondary/20 border border-secondary/30 p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <ShieldCheck className="w-5 h-5 text-secondary" />
                      <span className="font-semibold text-foreground text-sm">Message Decrypted!</span>
                    </div>
                    <p className="text-muted-foreground text-xs">Secret key shared successfully.</p>
                  </div>
                ) : (
                  <>
                    <span className="text-xs text-muted-foreground mb-1 px-1">{msg.sender}</span>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.isOwn
                          ? "bg-muted/60 text-foreground rounded-bl-md"
                          : "bg-primary text-primary-foreground rounded-br-md"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-4 border-t border-border bg-card/80 backdrop-blur-md">
        <div className="flex gap-2 max-w-lg mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a secret message..."
            className="flex-1 bg-muted/40 border-border text-foreground placeholder:text-muted-foreground"
          />
          <Button onClick={sendMessage} className="bg-primary hover:bg-primary/80 text-primary-foreground px-5">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnonymousChat;
