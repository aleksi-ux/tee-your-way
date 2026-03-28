import { Bluetooth, BluetoothOff, Loader2, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { BleConnectionState } from "@/lib/ble-service";

interface Props {
  state: BleConnectionState;
  connectedCount: number;
  error: string | null;
  onTap?: () => void;
}

const stateConfig: Record<BleConnectionState, { icon: any; label: string; color: string }> = {
  idle: { icon: Bluetooth, label: 'Ei yhdistetty', color: 'text-muted-foreground' },
  initializing: { icon: Loader2, label: 'Alustetaan...', color: 'text-primary' },
  scanning: { icon: Loader2, label: 'Skannataan...', color: 'text-primary' },
  connecting: { icon: Loader2, label: 'Yhdistetään...', color: 'text-secondary' },
  connected: { icon: Wifi, label: 'Yhdistetty', color: 'text-emerald-400' },
  disconnected: { icon: WifiOff, label: 'Yhteys katkesi', color: 'text-amber-400' },
  error: { icon: AlertCircle, label: 'Virhe', color: 'text-destructive' },
  unsupported: { icon: BluetoothOff, label: 'Ei tuettu', color: 'text-destructive' },
};

const ConnectionStatusBar = ({ state, connectedCount, error, onTap }: Props) => {
  const config = stateConfig[state];
  const Icon = config.icon;
  const isAnimated = state === 'scanning' || state === 'connecting' || state === 'initializing';

  return (
    <button
      onClick={onTap}
      className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/60 backdrop-blur-md border border-border/50 shadow-lg transition-all hover:bg-card/80"
    >
      <Icon className={`w-10 h-10 ${config.color} ${isAnimated ? 'animate-spin' : ''}`} />
      <span className={`text-sm font-semibold ${config.color}`}>
        {state === 'connected' && connectedCount > 0
          ? `${connectedCount} laite yhdistetty`
          : error || config.label}
      </span>
      {(state === 'idle' || state === 'disconnected') && (
        <span className="text-xs text-muted-foreground/70">
          Napauta etsiäksesi laitteita
        </span>
      )}
    </button>
  );
};

export default ConnectionStatusBar;
