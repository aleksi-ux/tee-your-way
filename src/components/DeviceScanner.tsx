import { motion, AnimatePresence } from "framer-motion";
import { 
  Bluetooth, BluetoothSearching, Loader2, Wifi, WifiOff, 
  ChevronLeft, RefreshCw, Signal, SignalLow, SignalMedium, SignalHigh
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BleConnectionState, BleDeviceInfo } from "@/lib/ble-service";

interface Props {
  state: BleConnectionState;
  devices: BleDeviceInfo[];
  error: string | null;
  onScan: () => void;
  onConnect: (deviceId: string) => void;
  onBack: () => void;
}

const getSignalIcon = (rssi: number) => {
  if (rssi > -50) return <SignalHigh className="w-4 h-4 text-emerald-400" />;
  if (rssi > -70) return <SignalMedium className="w-4 h-4 text-amber-400" />;
  if (rssi > -85) return <Signal className="w-4 h-4 text-orange-400" />;
  return <SignalLow className="w-4 h-4 text-red-400" />;
};

const getSignalLabel = (rssi: number) => {
  if (rssi > -50) return "Erinomainen";
  if (rssi > -70) return "Hyvä";
  if (rssi > -85) return "Kohtalainen";
  return "Heikko";
};

const DeviceScanner = ({ state, devices, error, onScan, onConnect, onBack }: Props) => {
  const isScanning = state === 'scanning';
  const isConnecting = state === 'connecting';

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-md">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1">Etsi laitteita</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={onScan}
          disabled={isScanning || isConnecting}
          className="text-muted-foreground"
        >
          <RefreshCw className={`w-5 h-5 ${isScanning ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Status bar */}
      <div className="px-4 py-2.5 border-b border-border/50 flex items-center gap-2">
        {isScanning ? (
          <>
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-xs text-primary">Skannataan lähellä olevia laitteita...</span>
          </>
        ) : isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 text-secondary animate-spin" />
            <span className="text-xs text-secondary">Yhdistetään...</span>
          </>
        ) : error ? (
          <>
            <WifiOff className="w-4 h-4 text-destructive" />
            <span className="text-xs text-destructive">{error}</span>
          </>
        ) : (
          <>
            <Bluetooth className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {devices.length > 0 ? `${devices.length} laitetta löydetty` : 'Valmis skannaamaan'}
            </span>
          </>
        )}
      </div>

      {/* Device list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {devices.length === 0 && !isScanning ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <div className="w-20 h-20 rounded-full bg-muted/40 flex items-center justify-center">
              <BluetoothSearching className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Läheltä ei löytynyt laitteita.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Varmista, että toisella laitteella on BlueMesh auki ja Bluetooth päällä.
            </p>
            <Button onClick={onScan} className="rounded-xl bg-primary hover:bg-primary/80 mt-2">
              <BluetoothSearching className="w-4 h-4 mr-2" />
              Etsi laitteita
            </Button>
          </div>
        ) : (
          <AnimatePresence>
            {devices.map((device) => (
              <motion.div
                key={device.device.deviceId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2"
              >
                <button
                  onClick={() => onConnect(device.device.deviceId)}
                  disabled={isConnecting || device.state === 'connecting'}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    {device.state === 'connecting' ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : device.state === 'connected' ? (
                      <Wifi className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Bluetooth className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">{device.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {device.state === 'connecting' ? 'Yhdistetään...' :
                       device.state === 'connected' ? 'Yhdistetty' :
                       device.state === 'error' ? 'Yhdistäminen epäonnistui' :
                       device.userId || 'BlueMesh-laite'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {getSignalIcon(device.rssi)}
                    <span className="text-[10px] text-muted-foreground">
                      {getSignalLabel(device.rssi)}
                    </span>
                  </div>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {isScanning && devices.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <BluetoothSearching className="w-10 h-10 text-primary" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
            </div>
            <p className="text-sm text-muted-foreground">Etsitään laitteita...</p>
          </div>
        )}
      </div>

      {/* Bottom action */}
      {!isScanning && devices.length === 0 && (
        <div className="px-4 py-3 border-t border-border bg-card/80 backdrop-blur-md">
          <Button onClick={onScan} className="w-full rounded-xl bg-primary hover:bg-primary/80 h-12 text-base">
            <BluetoothSearching className="w-5 h-5 mr-2" />
            Aloita skannaus
          </Button>
        </div>
      )}
    </div>
  );
};

export default DeviceScanner;
