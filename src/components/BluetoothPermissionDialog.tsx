import { Bluetooth, ShieldCheck, Smartphone, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onAllow: () => void;
  onClose: () => void;
  unsupported?: boolean;
  unsupportedReason?: string;
}

const BluetoothPermissionDialog = ({ open, onAllow, onClose, unsupported, unsupportedReason }: Props) => {
  if (unsupported) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-card border-border max-w-sm mx-4">
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <DialogTitle className="text-center text-foreground">
              Bluetooth ei ole tuettu
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              {unsupportedReason || 'Bluetooth ei ole käytettävissä tässä ympäristössä.'}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/30 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
            <p>✓ Chrome tai Edge Androidilla</p>
            <p>✓ Natiivi Android-sovellus (APK)</p>
            <p>✗ iOS Safari (ei tuettu)</p>
            <p>✗ Firefox (ei tuettu)</p>
          </div>
          <Button onClick={onClose} variant="outline" className="w-full rounded-xl border-border">
            Sulje
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-sm mx-4">
        <DialogHeader>
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Bluetooth className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-foreground">
            Salli Bluetooth
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            BlueMesh tarvitsee Bluetoothin toimiakseen. Viestit kulkevat suoraan laitteiden välillä ilman internetiä.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/30">
            <Smartphone className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-sm text-foreground">Löydä lähellä olevat laitteet</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/30">
            <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-sm text-foreground">Salattu viestintä (AES-256)</span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center">
          Viestit eivät tallennu palvelimelle. Kaikki data pysyy laitteillasi.
        </p>

        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl border-border">
            Myöhemmin
          </Button>
          <Button onClick={onAllow} className="flex-1 rounded-xl bg-primary hover:bg-primary/80">
            <Bluetooth className="w-4 h-4 mr-1.5" />
            Salli
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BluetoothPermissionDialog;
