import { motion } from "framer-motion";
import { Lock, Wifi, Bot, Shield } from "lucide-react";

const MeshNetwork = ({ onOpenChat }: { onOpenChat: () => void }) => {
  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-background via-card to-background px-6 py-8">
      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-2"
      >
        Bluetooth Mesh Messaging
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-muted-foreground text-sm mb-8"
      >
        Turvallinen ja anonyymi viestintä
      </motion.p>

      {/* Key Exchange Animation */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="flex flex-col items-center mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            animate={{ rotate: [0, -15, 0, 15, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Shield className="w-10 h-10 text-primary" />
          </motion.div>
          <motion.div
            animate={{ rotate: [0, 15, 0, -15, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          >
            <Lock className="w-8 h-8 text-secondary" />
          </motion.div>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Exchanging Secure Key...</h2>
        <p className="text-muted-foreground text-sm text-center mt-1">
          Encrypting secret key for safe delivery to user.
        </p>
      </motion.div>

      {/* Mesh Network Visualization */}
      <div className="relative w-80 h-64 mb-8">
        {/* Rotating mesh circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-48 h-48 rounded-full border border-dashed border-primary/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Center glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-4 h-4 rounded-full bg-primary shadow-[0_0_20px_8px_hsl(var(--primary)/0.4)]"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Phone nodes */}
        {[
          { x: "10%", y: "40%", delay: 0, icon: <Lock className="w-5 h-5 text-primary" /> },
          { x: "42%", y: "30%", delay: 0.3, icon: <Lock className="w-5 h-5 text-secondary" /> },
          { x: "75%", y: "40%", delay: 0.6, icon: <Bot className="w-5 h-5 text-muted-foreground" /> },
        ].map((node, i) => (
          <motion.div
            key={i}
            className="absolute flex flex-col items-center"
            style={{ left: node.x, top: node.y }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + node.delay }}
          >
            <div className="w-14 h-24 rounded-xl bg-muted/60 border border-border flex flex-col items-center justify-center gap-1 backdrop-blur-sm">
              {node.icon}
              <Wifi className="w-3 h-3 text-primary/60 animate-pulse-glow" />
            </div>
          </motion.div>
        ))}

        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 256">
          <motion.line
            x1="70" y1="130" x2="160" y2="110"
            stroke="hsl(217 91% 60% / 0.3)" strokeWidth="1" strokeDasharray="4 4"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ delay: 1, duration: 1 }}
          />
          <motion.line
            x1="160" y1="110" x2="260" y2="130"
            stroke="hsl(217 91% 60% / 0.3)" strokeWidth="1" strokeDasharray="4 4"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ delay: 1.3, duration: 1 }}
          />
        </svg>
      </div>

      {/* Routing status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-center mb-8"
      >
        <h3 className="text-lg font-semibold text-foreground">Routing Secure Key...</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Nodes relaying encrypted key securely through the mesh network.
        </p>
      </motion.div>

      {/* Open Chat button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        onClick={onOpenChat}
        className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-[0_0_20px_4px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_30px_8px_hsl(var(--primary)/0.4)] transition-all"
      >
        Open Anonymous Chat
      </motion.button>
    </div>
  );
};

export default MeshNetwork;
