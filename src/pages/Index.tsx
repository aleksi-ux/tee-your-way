import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ChatScreen from "@/components/ChatScreen";
import SettingsPanel from "@/components/SettingsPanel";
import DeviceScanner from "@/components/DeviceScanner";
import DebugPanel from "@/components/DebugPanel";
import ConnectionStatusBar from "@/components/ConnectionStatusBar";
import BluetoothPermissionDialog from "@/components/BluetoothPermissionDialog";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import { MeshMessage, UserSettings } from "@/types/mesh";
import { generateUserId } from "@/lib/crypto";
import { useBle } from "@/hooks/use-ble";
import { BleMessage } from "@/lib/ble-service";

type View = "chat" | "settings" | "scanner" | "debug";

const pageVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

const STORAGE_KEY = "bluemesh-userid";
const ONBOARDING_KEY = "bluemesh-onboarded";

const Index = () => {
  const [view, setView] = useState<View>("chat");
  const [messages, setMessages] = useState<MeshMessage[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem(ONBOARDING_KEY);
  });
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
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

  const ble = useBle(userId);

  // Handle incoming BLE messages
  useEffect(() => {
    ble.setMessageCallback(
      (bleMsg: BleMessage) => {
        const msg: MeshMessage = {
          id: bleMsg.id,
          senderId: bleMsg.senderId,
          text: bleMsg.text,
          encrypted: false,
          timestamp: new Date(bleMsg.timestamp),
          hops: 1,
          mode: "public",
        };
        setMessages((prev) => [...prev, msg]);
      },
      (messageId: string) => {
        // Mark message as delivered - could update UI
        console.log(`Message delivered: ${messageId}`);
      }
    );
  }, [ble.setMessageCallback]);

  // Wipe on close
  useEffect(() => {
    if (!settings.wipeOnClose) return;
    const handleUnload = () => setMessages([]);
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [settings.wipeOnClose]);

  const handleSend = useCallback(async (msg: MeshMessage) => {
    setMessages((prev) => [...prev, msg]);
    // Try to send via BLE if connected
    if (ble.state === 'connected') {
      await ble.sendMessage(msg.text, msg.id);
    }
  }, [ble.state, ble.sendMessage]);

  const handleOnboardingDismiss = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowPermissionDialog(true);
  }, []);

  const handlePermissionAllow = useCallback(async () => {
    setShowPermissionDialog(false);
    const support = await ble.checkSupport();
    if (!support.supported) {
      // Will show unsupported state in connection bar
      return;
    }
    await ble.initialize();
  }, [ble.checkSupport, ble.initialize]);

  const handleConnectionBarTap = useCallback(() => {
    if (ble.state === 'idle' || ble.state === 'disconnected' || ble.state === 'error') {
      setView("scanner");
    }
  }, [ble.state]);

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto">
      {/* Onboarding */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingOverlay onDismiss={handleOnboardingDismiss} />
        )}
      </AnimatePresence>

      {/* Bluetooth Permission Dialog */}
      <BluetoothPermissionDialog
        open={showPermissionDialog}
        onAllow={handlePermissionAllow}
        onClose={() => setShowPermissionDialog(false)}
        unsupported={ble.supported === false}
        unsupportedReason={ble.supportMessage}
      />

      <AnimatePresence mode="wait">
        {view === "chat" && (
          <motion.div key="chat" {...pageVariants} transition={{ duration: 0.2 }}>
            <div className="flex flex-col h-screen">
              <ConnectionStatusBar
                state={ble.state}
                connectedCount={ble.connectedDevices.length}
                error={ble.error}
                onTap={handleConnectionBarTap}
              />
              <div className="flex-1 overflow-hidden">
                <ChatScreen
                  userId={userId}
                  messages={messages}
                  onSend={handleSend}
                  onOpenSettings={() => setView("settings")}
                  onOpenScanner={() => setView("scanner")}
                  onOpenDebug={() => setView("debug")}
                  privacyCode={settings.privacyCode}
                  codeLocked={settings.codeLocked}
                  bleConnected={ble.state === 'connected'}
                />
              </div>
            </div>
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
        {view === "scanner" && (
          <motion.div key="scanner" {...pageVariants} transition={{ duration: 0.2 }}>
            <DeviceScanner
              state={ble.state}
              devices={ble.devices}
              error={ble.error}
              onScan={() => ble.startScan()}
              onConnect={async (deviceId) => {
                const ok = await ble.connect(deviceId);
                if (ok) setView("chat");
              }}
              onBack={() => setView("chat")}
            />
          </motion.div>
        )}
        {view === "debug" && (
          <motion.div key="debug" {...pageVariants} transition={{ duration: 0.2 }}>
            <DebugPanel
              logs={ble.logs}
              diagnostics={ble.getDiagnostics()}
              onBack={() => setView("chat")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
