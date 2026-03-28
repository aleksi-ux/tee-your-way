import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ChatScreen from "@/components/ChatScreen";
import SettingsPanel from "@/components/SettingsPanel";
import { MeshMessage, UserSettings } from "@/types/mesh";
import { generateUserId } from "@/lib/crypto";

type View = "chat" | "settings";

const pageVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

const STORAGE_KEY = "bluemesh-userid";

const Index = () => {
  const [view, setView] = useState<View>("chat");
  const [messages, setMessages] = useState<MeshMessage[]>([]);
  const [userId] = useState<string>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    const id = generateUserId();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  });
  const [settings, setSettings] = useState<UserSettings>({
    privacyCode: "",
    channelFingerprint: "",
    codeLocked: false,
    wipeOnClose: false,
  });

  // Wipe on close
  useEffect(() => {
    if (!settings.wipeOnClose) return;
    const handleUnload = () => {
      setMessages([]);
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [settings.wipeOnClose]);

  // Simulate incoming messages for demo
  useEffect(() => {
    const demoMessages: MeshMessage[] = [
      {
        id: "demo-1",
        senderId: "user#8821",
        text: "Moro! Kuuluuko mesh-verkossa?",
        encrypted: false,
        timestamp: new Date(Date.now() - 120000),
        hops: 2,
        mode: "public",
      },
      {
        id: "demo-2",
        senderId: "user#3347",
        text: "Joo kuuluu! 3 hoppia tänne 🎉",
        encrypted: false,
        timestamp: new Date(Date.now() - 60000),
        hops: 3,
        mode: "public",
      },
    ];
    setMessages(demoMessages);
  }, []);

  const handleSend = useCallback((msg: MeshMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {view === "chat" && (
          <motion.div key="chat" {...pageVariants} transition={{ duration: 0.2 }}>
            <ChatScreen
              userId={userId}
              messages={messages}
              onSend={handleSend}
              onOpenSettings={() => setView("settings")}
              privacyCode={settings.privacyCode}
              codeLocked={settings.codeLocked}
            />
          </motion.div>
        )}
        {view === "settings" && (
          <motion.div key="settings" {...pageVariants} transition={{ duration: 0.2 }}>
            <SettingsPanel
              settings={settings}
              userId={userId}
              onUpdate={setSettings}
              onBack={() => setView("chat")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
