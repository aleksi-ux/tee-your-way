import { motion } from "framer-motion";
import { Plus, Radio, Settings, Wifi, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatConversation, MeshStats } from "@/types/mesh";

interface ChatListProps {
  conversations: ChatConversation[];
  stats: MeshStats;
  onSelectChat: (id: string) => void;
  onOpenMeshStatus: () => void;
  onOpenSettings: () => void;
  onNewChat: () => void;
}

const formatTime = (date: Date) => {
  const now = Date.now();
  const diff = now - date.getTime();
  if (diff < 60000) return "juuri nyt";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} h`;
  return date.toLocaleDateString("fi");
};

const ChatList = ({ conversations, stats, onSelectChat, onOpenMeshStatus, onOpenSettings, onNewChat }: ChatListProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">MeshTalk</h1>
          <Button variant="ghost" size="icon" onClick={onOpenSettings} className="text-muted-foreground">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Mesh status bar */}
        <motion.button
          onClick={onOpenMeshStatus}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-card border border-border"
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-primary animate-pulse-glow" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Mesh-verkko aktiivinen</p>
              <p className="text-xs text-muted-foreground">
                {stats.nodesCount} solmua · {stats.routeHops} hyppyä
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 px-5">
        <div className="flex flex-col gap-2">
          {conversations.map((conv, i) => (
            <motion.button
              key={conv.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelectChat(conv.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-card transition-colors text-left"
            >
              {/* Avatar */}
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">
                  <Radio className="w-5 h-5 text-primary" />
                </div>
                {conv.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-secondary border-2 border-background" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-sm">{conv.name}</span>
                  <span className="text-xs text-muted-foreground">{formatTime(conv.lastTime)}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-sm text-muted-foreground truncate pr-2">{conv.lastMessage}</p>
                  {conv.unread > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full min-w-[20px] flex items-center justify-center">
                      {conv.unread}
                    </Badge>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* New message FAB */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={onNewChat}
          size="icon"
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-[0_0_20px_4px_hsl(var(--primary)/0.3)] hover:opacity-90"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default ChatList;
