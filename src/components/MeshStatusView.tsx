import { motion } from "framer-motion";
import { ChevronLeft, Radio, Signal, ArrowLeftRight, Zap } from "lucide-react";
import { MeshDevice, MeshStats } from "@/types/mesh";

interface MeshStatusViewProps {
  devices: MeshDevice[];
  stats: MeshStats;
  onBack: () => void;
}

const signalBars = (signal: number) => {
  const bars = signal > 75 ? 4 : signal > 50 ? 3 : signal > 25 ? 2 : 1;
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3, 4].map((b) => (
        <div
          key={b}
          className={`w-1 rounded-full ${b <= bars ? "bg-secondary" : "bg-muted"}`}
          style={{ height: `${b * 25}%` }}
        />
      ))}
    </div>
  );
};

const MeshStatusView = ({ devices, stats, onBack }: MeshStatusViewProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Mesh-verkon tila</h1>
      </div>

      <div className="flex-1 px-5 py-5 space-y-6">
        {/* Network visualization */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative w-full h-48 rounded-2xl bg-card border border-border overflow-hidden"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Center node (you) */}
            <motion.div
              className="absolute w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center z-10"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Radio className="w-5 h-5 text-primary" />
            </motion.div>
            {/* Orbiting nodes */}
            {devices.slice(0, 5).map((device, i) => {
              const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
              const r = 70;
              const x = Math.cos(angle) * r;
              const y = Math.sin(angle) * r;
              return (
                <motion.div
                  key={device.id}
                  className="absolute w-8 h-8 rounded-lg bg-accent flex items-center justify-center"
                  style={{ left: `calc(50% + ${x}px - 16px)`, top: `calc(50% + ${y}px - 16px)` }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <div className={`w-2 h-2 rounded-full ${device.role === "relay" ? "bg-primary" : "bg-secondary"}`} />
                </motion.div>
              );
            })}
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {devices.slice(0, 5).map((_, i) => {
                const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
                const r = 70;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                return (
                  <motion.line
                    key={i}
                    x1="50%" y1="50%"
                    x2={`calc(50% + ${x}px)`} y2={`calc(50% + ${y}px)`}
                    stroke="hsl(245 80% 67% / 0.2)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  />
                );
              })}
            </svg>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Solmut", value: stats.nodesCount, icon: Radio },
            { label: "Reitin pituus", value: `${stats.routeHops} hyppyä`, icon: ArrowLeftRight },
            { label: "Lähetetty", value: stats.messagesSent, icon: Zap },
            { label: "Välitetty", value: stats.messagesRelayed, icon: Signal },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="px-4 py-3 rounded-2xl bg-card border border-border"
            >
              <stat.icon className="w-4 h-4 text-primary mb-2" />
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Device list */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Läheiset laitteet</h2>
          <div className="flex flex-col gap-2">
            {devices.map((device, i) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex items-center justify-between px-4 py-3 rounded-2xl bg-card border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${device.role === "relay" ? "bg-primary/20" : "bg-secondary/20"}`}>
                    <Radio className={`w-4 h-4 ${device.role === "relay" ? "text-primary" : "text-secondary"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{device.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {device.role === "relay" ? "Välittäjä" : "Vastaanottaja"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{device.signal}%</span>
                  {signalBars(device.signal)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeshStatusView;
