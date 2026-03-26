import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { ParsedTag, ParsedEndpoint, HttpMethod } from "@/types/openapi";
import { cn } from "@/lib/utils";
import { Search, ChevronRight } from "lucide-react";

const METHOD_COLORS: Record<HttpMethod, string> = {
  get: "bg-method-get/15 text-method-get border-method-get/30",
  post: "bg-method-post/15 text-method-post border-method-post/30",
  put: "bg-method-put/15 text-method-put border-method-put/30",
  patch: "bg-method-patch/15 text-method-patch border-method-patch/30",
  delete: "bg-method-delete/15 text-method-delete border-method-delete/30",
};

interface EndpointListProps {
  tags: ParsedTag[];
  selectedEndpoint?: ParsedEndpoint | null;
  onSelect: (endpoint: ParsedEndpoint) => void;
}

export function EndpointList({ tags, selectedEndpoint, onSelect }: EndpointListProps) {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<HttpMethod | "all">("all");

  const filteredTags = useMemo(() => {
    const q = search.toLowerCase();
    return tags
      .map((tag) => ({
        ...tag,
        endpoints: tag.endpoints.filter((ep) => {
          const matchesMethod = methodFilter === "all" || ep.method === methodFilter;
          const matchesSearch =
            !q ||
            ep.path.toLowerCase().includes(q) ||
            ep.summary?.toLowerCase().includes(q) ||
            ep.operationId?.toLowerCase().includes(q);
          return matchesMethod && matchesSearch;
        }),
      }))
      .filter((tag) => tag.endpoints.length > 0);
  }, [tags, search, methodFilter]);

  const totalEndpoints = filteredTags.reduce((sum, t) => sum + t.endpoints.length, 0);

  const methods: Array<HttpMethod | "all"> = ["all", "get", "post", "put", "patch", "delete"];

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search endpoints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        {/* Method filter pills */}
        <div className="flex gap-1 flex-wrap">
          {methods.map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={cn(
                "px-2 py-0.5 text-xs rounded-full border transition-colors",
                methodFilter === m
                  ? m === "all"
                    ? "bg-foreground text-background border-foreground"
                    : METHOD_COLORS[m]
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
              )}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">{totalEndpoints} endpoints</div>
      </div>

      {/* Endpoint tree */}
      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={filteredTags.map((t) => t.name)} className="px-1">
          {filteredTags.map((tag) => (
            <AccordionItem key={tag.name} value={tag.name} className="border-b-0">
              <AccordionTrigger className="py-2 px-2 text-sm hover:no-underline">
                <span className="flex items-center gap-2">
                  <span className="font-medium">{tag.name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {tag.endpoints.length}
                  </Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-1 pt-0">
                <div className="space-y-0.5 pl-1">
                  {tag.endpoints.map((ep) => (
                    <button
                      key={ep.id}
                      onClick={() => onSelect(ep)}
                      className={cn(
                        "w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center gap-2 group transition-colors",
                        selectedEndpoint?.id === ep.id
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50"
                      )}
                    >
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-mono px-1.5 py-0 uppercase shrink-0 min-w-[3.5rem] justify-center",
                          METHOD_COLORS[ep.method]
                        )}
                      >
                        {ep.method}
                      </Badge>
                      <span className="truncate font-mono text-xs">{ep.path}</span>
                      <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-50 shrink-0" />
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  );
}
