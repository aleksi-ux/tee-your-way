import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Lock, Unlock, Trash2, Eye, EyeOff, Fingerprint, ShieldCheck, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { UserSettings } from "@/types/mesh";
import { generateFingerprint } from "@/lib/crypto";
import { bleService } from "@/lib/ble-service";

interface SettingsPanelProps {
  settings: UserSettings;
  userId: string;
  onUpdate: (settings: UserSettings) => void;
  onBack: () => void;
}

const SettingsPanel = ({ settings, userId, onUpdate, onBack }: SettingsPanelProps) => {
  const [code, setCode] = useState(settings.privacyCode);
  const [fingerprint, setFingerprint] = useState(settings.channelFingerprint);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (code.length >= 5) {
      generateFingerprint(code).then(setFingerprint);
    } else {
      setFingerprint("");
    }
  }, [code]);

  const handleLock = () => {
    if (code.length < 5) return;
    onUpdate({
      ...settings,
      privacyCode: code,
      channelFingerprint: fingerprint,
      codeLocked: true,
    });
  };

  const handleClear = () => {
    setCode("");
    setFingerprint("");
    onUpdate({
      ...settings,
      privacyCode: "",
      channelFingerprint: "",
      codeLocked: false,
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-card/80 backdrop-blur-md">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Asetukset</h1>
      </div>

      <div className="flex-1 px-5 py-5 space-y-6 overflow-y-auto">
        {/* User ID */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3 rounded-2xl bg-card border border-border"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Käyttäjätunnus
          </p>
          <p className="text-lg font-mono font-bold text-primary">{userId}</p>
        </motion.div>

        {/* Privacy Code */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Salauskoodi</span>
          </div>

          <div className="px-4 py-4 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-center gap-2">
              <Input
                type={showCode ? "text" : "password"}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.slice(0, 10))
                }
                disabled={settings.codeLocked}
                placeholder="5-10 merkkiä"
                className="rounded-xl bg-muted/40 border-border text-foreground font-mono"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCode(!showCode)}
                className="flex-shrink-0"
              >
                {showCode ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {code.length}/10 merkkiä (min. 5)
            </p>

            {/* Fingerprint */}
            {fingerprint && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/50">
                <Fingerprint className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">
                    Channel ID
                  </p>
                  <p className="font-mono text-sm font-bold text-foreground tracking-wider">
                    {fingerprint}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleLock}
                disabled={code.length < 5 || settings.codeLocked}
                className="flex-1 rounded-xl bg-primary hover:bg-primary/80"
                size="sm"
              >
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                Lukitse
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                className="flex-1 rounded-xl border-border"
                size="sm"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Tyhjennä
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Wipe on close */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-card border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">
                Tyhjennä sulkiessa
              </p>
              <p className="text-xs text-muted-foreground">
                Poista viestit muistista kun sovellus suljetaan
              </p>
            </div>
            <Switch
              checked={settings.wipeOnClose}
              onCheckedChange={(checked) =>
                onUpdate({ ...settings, wipeOnClose: checked })
              }
            />
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="px-4 py-3 rounded-2xl bg-muted/30 border border-border/50"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">BlueMesh</strong> käyttää
            Bluetooth LE mesh-verkkoa viestien välittämiseen laitteelta
            toiselle. Viestit eivät kulje internetin kautta. Yksityiset
            viestit salataan AES-256-GCM -salauksella.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPanel;
