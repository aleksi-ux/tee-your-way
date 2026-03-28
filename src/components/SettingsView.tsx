import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, User, Shield, Eye, Bug } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { UserSettings, MeshStats } from "@/types/mesh";

interface SettingsViewProps {
  settings: UserSettings;
  stats: MeshStats;
  onBack: () => void;
  onUpdateSettings: (settings: UserSettings) => void;
}

const SettingsView = ({ settings, stats, onBack, onUpdateSettings }: SettingsViewProps) => {
  const [local, setLocal] = useState(settings);

  const update = (partial: Partial<UserSettings>) => {
    const next = { ...local, ...partial };
    setLocal(next);
    onUpdateSettings(next);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Asetukset</h1>
      </div>

      <div className="flex-1 px-5 py-5 space-y-6">
        {/* Nickname */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <User className="w-4 h-4" />
            <span>Nimi / nimimerkki</span>
          </div>
          <Input
            value={local.nickname}
            onChange={(e) => update({ nickname: e.target.value })}
            className="rounded-xl bg-card border-border text-foreground"
            placeholder="Anonyymi"
          />
        </motion.div>

        {/* Encryption */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            <Shield className="w-4 h-4" />
            <span>Salaus</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-card border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">AES-256 salaus</p>
              <p className="text-xs text-muted-foreground">End-to-end viestien salaus</p>
            </div>
            <Switch
              checked={local.aesEnabled}
              onCheckedChange={(checked) => update({ aesEnabled: checked })}
            />
          </div>
        </motion.div>

        {/* Visibility */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            <Eye className="w-4 h-4" />
            <span>Näkyvyys</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-card border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Näytä laitteille</p>
              <p className="text-xs text-muted-foreground">Muut laitteet näkevät sinut mesh-verkossa</p>
            </div>
            <Switch
              checked={local.visible}
              onCheckedChange={(checked) => update({ visible: checked })}
            />
          </div>
        </motion.div>

        {/* Debug */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            <Bug className="w-4 h-4" />
            <span>Debug</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="px-4 py-3 rounded-2xl bg-card border border-border">
              <p className="text-lg font-bold text-foreground">{stats.messagesSent}</p>
              <p className="text-xs text-muted-foreground">Lähetetyt viestit</p>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-card border border-border">
              <p className="text-lg font-bold text-foreground">{stats.messagesRelayed}</p>
              <p className="text-xs text-muted-foreground">Välitetyt viestit</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsView;
