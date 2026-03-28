import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MeshNetwork from "@/components/MeshNetwork";
import AnonymousChat from "@/components/AnonymousChat";

const Index = () => {
  const [view, setView] = useState<"mesh" | "chat">("mesh");

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {view === "mesh" ? (
          <motion.div
            key="mesh"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <MeshNetwork onOpenChat={() => setView("chat")} />
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AnonymousChat onBack={() => setView("mesh")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
