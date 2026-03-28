import { useState } from "react";
import { ChevronLeft, Bug, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogEntry } from "@/lib/ble-service";

interface Props {
  logs: LogEntry[];
  diagnostics: {
    bleSupported: boolean;
    isNative: boolean;
    state: string;
    connectedCount: number;
    foundCount: number;
    logsCount: number;
    platform: string;
    api: string;
  };
  onBack: () => void;
}

const DebugPanel = ({ logs, diagnostics, onBack }: Props) => {
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');

  const filtered = filter === 'all' ? logs : logs.filter(l => l.level === filter);

  const copyLogs = () => {
    const text = logs.map(l => `[${l.timestamp.toISOString()}] [${l.level}] ${l.message}`).join('\n');
    navigator.clipboard?.writeText(text);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-md">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <Bug className="w-5 h-5 text-secondary" />
        <h1 className="text-lg font-bold text-foreground flex-1">Debug</h1>
        <Button variant="ghost" size="icon" onClick={copyLogs}>
          <Copy className="w-4 h-4" />
        </Button>
      </div>

      {/* Diagnostics */}
      <div className="px-4 py-3 border-b border-border/50 space-y-1.5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Diagnostiikka</p>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div className="px-2.5 py-1.5 rounded-lg bg-muted/30">
            <span className="text-muted-foreground">BLE-tuki: </span>
            <span className={diagnostics.bleSupported ? 'text-emerald-400' : 'text-destructive'}>
              {diagnostics.bleSupported ? 'Kyllä' : 'Ei'}
            </span>
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-muted/30">
            <span className="text-muted-foreground">Alusta: </span>
            <span className="text-foreground">{diagnostics.platform}</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-muted/30">
            <span className="text-muted-foreground">API: </span>
            <span className="text-foreground font-mono text-[10px]">{diagnostics.api}</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-muted/30">
            <span className="text-muted-foreground">Tila: </span>
            <span className="text-foreground">{diagnostics.state}</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-muted/30">
            <span className="text-muted-foreground">Yhdistetty: </span>
            <span className="text-foreground">{diagnostics.connectedCount}</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-muted/30">
            <span className="text-muted-foreground">Löydetty: </span>
            <span className="text-foreground">{diagnostics.foundCount}</span>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-4 py-2 border-b border-border/50">
        {(['all', 'info', 'warn', 'error'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              filter === f ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'Kaikki' : f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Logs */}
      <ScrollArea className="flex-1 px-4 py-2">
        <div className="space-y-0.5">
          {filtered.map((log, i) => (
            <div key={i} className="flex gap-2 py-1 text-[11px] font-mono">
              <span className="text-muted-foreground/50 flex-shrink-0">
                {log.timestamp.toLocaleTimeString('fi', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className={
                log.level === 'error' ? 'text-destructive' :
                log.level === 'warn' ? 'text-amber-400' :
                'text-muted-foreground'
              }>
                {log.message}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">Ei lokeja</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DebugPanel;
