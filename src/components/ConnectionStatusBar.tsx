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
      className="w-full flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-card/40 hover:bg-card/60 transition-colors"
    >
      <Icon className={`w-3.5 h-3.5 ${config.color} ${isAnimated ? 'animate-spin' : ''}`} />
      <span className={`text-xs font-medium ${config.color}`}>
        {state === 'connected' && connectedCount > 0
          ? `${connectedCount} laite yhdistetty`
          : error || config.label}
      </span>
      <span className="ml-auto text-[10px] text-muted-foreground/50">
        {state === 'idle' || state === 'disconnected' ? 'Napauta etsiäksesi' : ''}
      </span>
    </button>
  );
};

export default ConnectionStatusBar;
