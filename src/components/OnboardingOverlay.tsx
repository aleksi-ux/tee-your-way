import { motion } from "framer-motion";
import { Bluetooth, Search, MessageSquare, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onDismiss: () => void;
}

const steps = [
  { icon: Bluetooth, title: "1. Salli Bluetooth", desc: "Sovellus tarvitsee Bluetoothin viestien lähettämiseen." },
  { icon: Search, title: "2. Etsi laitteita", desc: "Skannaa lähellä olevia BlueMesh-käyttäjiä." },
  { icon: MessageSquare, title: "3. Yhdistä", desc: "Valitse laite ja muodosta yhteys." },
  { icon: Shield, title: "4. Keskustele", desc: "Viestit kulkevat suoraan laitteiden välillä, salattuina." },
];

const OnboardingOverlay = ({ onDismiss }: Props) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center px-6"
  >
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="w-full max-w-sm"
    >
      <h1 className="text-2xl font-bold text-foreground text-center mb-1">BlueMesh</h1>
      <p className="text-sm text-muted-foreground text-center mb-8">
        Viestit kulkevat laitteelta toiselle ilman nettiä.
      </p>

      <div className="space-y-3 mb-8">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border"
          >
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <step.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <Button onClick={onDismiss} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/80 text-base">
        Aloita
      </Button>
    </motion.div>
  </motion.div>
);

export default OnboardingOverlay;
