import { motion } from "framer-motion";
import { Radio, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const WelcomeScreen = ({ onStart }: { onStart: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      {/* Animated mesh icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="relative mb-8"
      >
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_40px_8px_hsl(var(--primary)/0.3)]">
          <Radio className="w-12 h-12 text-primary-foreground" />
        </div>
        <motion.div
          className="absolute -top-1 -right-1 w-8 h-8 rounded-xl bg-accent flex items-center justify-center border border-border"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Lock className="w-4 h-4 text-primary" />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-4xl font-bold text-foreground tracking-tight mb-3"
      >
        MeshTalk
      </motion.h1>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-muted-foreground text-center text-base max-w-xs mb-12 leading-relaxed"
      >
        Viestit kulkevat laitteelta toiselle ilman nettiä.
      </motion.p>

      {/* Mesh illustration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex items-center gap-4 mb-12"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full bg-primary"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
          />
        ))}
        <div className="w-8 h-[2px] bg-gradient-to-r from-primary to-secondary rounded-full" />
        {[0, 1].map((i) => (
          <motion.div
            key={`b-${i}`}
            className="w-3 h-3 rounded-full bg-secondary"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 + i * 0.4 }}
          />
        ))}
      </motion.div>

      {/* Start button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Button
          onClick={onStart}
          size="lg"
          className="px-10 py-6 text-base font-semibold rounded-2xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity shadow-[0_0_20px_4px_hsl(var(--primary)/0.3)]"
        >
          Aloita
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
