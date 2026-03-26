import { useState, useEffect } from "react";
import { getHistory, clearHistory, removeFromHistory, type HistoryEntry } from "@/lib/request-history";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Trash2, Clock, X } from "lucide-react";

const METHOD_COLORS: Record<string, string> = {
  GET: "text-method-get",
  POST: "text-method-post",
  PUT: "text-method-put",
  PATCH: "text-method-patch",
  DELETE: "text-method-delete",
};

interface HistoryPanelProps {
  onSelect: (entry: HistoryEntry) => void;
}

export function HistoryPanel({ onSelect }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromHistory(id);
    setHistory(getHistory());
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">History</span>
          <Badge variant="secondary" className="text-[10px] px-1 py-0">
            {history.length}
          </Badge>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {history.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No requests yet
          </div>
        ) : (
          <div className="p-1 space-y-0.5">
            {history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => onSelect(entry)}
                className="w-full text-left px-2 py-1.5 rounded-md text-xs hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "font-mono font-bold text-[10px] shrink-0",
                      METHOD_COLORS[entry.method.toUpperCase()] || "text-foreground"
                    )}
                  >
                    {entry.method.toUpperCase()}
                  </span>
                  <span className="font-mono truncate">{entry.path}</span>
                  <button
                    onClick={(e) => handleRemove(entry.id, e)}
                    className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                  <Badge variant="secondary" className="text-[9px] px-1 py-0">
                    {entry.serviceId}
                  </Badge>
                  {entry.status && (
                    <span className={cn(entry.status < 400 ? "text-method-get" : "text-destructive")}>
                      {entry.status}
                    </span>
                  )}
                  {entry.elapsed && <span>{entry.elapsed}ms</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
