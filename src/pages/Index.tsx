import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WelcomeScreen from "@/components/WelcomeScreen";
import ChatList from "@/components/ChatList";
import ChatView from "@/components/ChatView";
import MeshStatusView from "@/components/MeshStatusView";
import SettingsView from "@/components/SettingsView";
import { mockConversations, mockMessages, mockDevices, mockStats, defaultSettings } from "@/data/mockData";
import { ChatMessage, UserSettings } from "@/types/mesh";

type View = "welcome" | "chatList" | "chat" | "meshStatus" | "settings";

const pageVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

const Index = () => {
  const [view, setView] = useState<View>("welcome");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState(mockMessages);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  const openChat = (id: string) => {
    setActiveChatId(id);
    setView("chat");
  };

  const sendMessage = (chatId: string, text: string) => {
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      text,
      isOwn: true,
      timestamp: new Date(),
      hops: Math.floor(Math.random() * 3) + 1,
      delivered: true,
    };
    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMsg],
    }));
  };

  const activeConv = mockConversations.find((c) => c.id === activeChatId);

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {view === "welcome" && (
          <motion.div key="welcome" {...pageVariants} transition={{ duration: 0.25 }}>
            <WelcomeScreen onStart={() => setView("chatList")} />
          </motion.div>
        )}
        {view === "chatList" && (
          <motion.div key="chatList" {...pageVariants} transition={{ duration: 0.25 }}>
            <ChatList
              conversations={mockConversations}
              stats={mockStats}
              onSelectChat={openChat}
              onOpenMeshStatus={() => setView("meshStatus")}
              onOpenSettings={() => setView("settings")}
              onNewChat={() => {}}
            />
          </motion.div>
        )}
        {view === "chat" && activeChatId && activeConv && (
          <motion.div key="chat" {...pageVariants} transition={{ duration: 0.25 }}>
            <ChatView
              chatId={activeChatId}
              name={activeConv.name}
              messages={messages[activeChatId] || []}
              onBack={() => setView("chatList")}
              onSend={sendMessage}
            />
          </motion.div>
        )}
        {view === "meshStatus" && (
          <motion.div key="meshStatus" {...pageVariants} transition={{ duration: 0.25 }}>
            <MeshStatusView
              devices={mockDevices}
              stats={mockStats}
              onBack={() => setView("chatList")}
            />
          </motion.div>
        )}
        {view === "settings" && (
          <motion.div key="settings" {...pageVariants} transition={{ duration: 0.25 }}>
            <SettingsView
              settings={settings}
              stats={mockStats}
              onBack={() => setView("chatList")}
              onUpdateSettings={setSettings}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
