import { useState } from "react";
import { Search, FileText, FolderKanban, Calendar, Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import type { VaultSearchResult } from "@/types/electron";

function getShortDate(s: string) {
  return new Date(s + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VaultSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const { entries } = useData();

  const handleSearch = async () => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      if (window.electronAPI) {
        // Use Electron search for full vault search
        const searchResults = await window.electronAPI.searchVault(query);
        setResults(searchResults);
      } else {
        // Fallback: search in loaded entries only (browser mode)
        const lowerQuery = query.toLowerCase();
        const fallbackResults: VaultSearchResult[] = [];

        // Search journal entries
        for (const [date, entry] of Object.entries(entries)) {
          const searchText = [
            entry.journal,
            entry.mentalNote,
            entry.physicalNote,
            entry.bestThing,
            entry.proudThings,
            entry.lessonLearned,
            entry.lessonChange,
            entry.excitedAbout,
            ...entry.tasks.map(t => t.task + " " + t.outcome + " " + t.system + " " + t.mission),
          ].join(" ").toLowerCase();

          if (searchText.includes(lowerQuery)) {
            fallbackResults.push({
              type: "journal",
              id: date,
              title: `Journal — ${getShortDate(date)}`,
              snippet: extractSnippet(searchText, lowerQuery),
            });
          }
        }

        setResults(fallbackResults);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getIcon = (type: VaultSearchResult["type"]) => {
    switch (type) {
      case "journal":
        return <FileText className="w-4 h-4 text-blue-400" />;
      case "project":
        return <FolderKanban className="w-4 h-4 text-emerald-400" />;
      case "meeting":
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case "person":
        return <Users className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="fade-in space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Search</h2>
        <p className="text-sm text-zinc-400 mt-0.5">Search across your entire vault</p>
      </div>

      <Card className="glow-blue-subtle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Search className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-zinc-100">Vault Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search journals, projects, meetings, people..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
            />
            <Button onClick={handleSearch} disabled={searching || query.length < 2} className="gap-2">
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>

          {!window.electronAPI && (
            <p className="text-[10px] text-zinc-500">
              Browser mode: searching in loaded entries only. Use Electron for full vault search.
            </p>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-400">{results.length} result{results.length !== 1 ? "s" : ""} found</p>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {results.map((result, idx) => (
                  <Card key={`${result.type}-${result.id}-${idx}`} className="border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getIcon(result.type)}</div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-zinc-200">{result.title}</p>
                            <span className="text-[10px] text-zinc-500 capitalize px-1.5 py-0.5 rounded bg-zinc-800">{result.type}</span>
                          </div>
                          {result.snippet && (
                            <p className="text-xs text-zinc-400 line-clamp-2">{result.snippet}</p>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-500 shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {query.length >= 2 && !searching && results.length === 0 && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm text-zinc-400">No results found for "{query}"</p>
              <p className="text-xs text-zinc-500 mt-1">Try a different search term</p>
            </div>
          )}

          {query.length < 2 && results.length === 0 && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm text-zinc-400">Enter at least 2 characters to search</p>
              <p className="text-xs text-zinc-500 mt-1">Search across journals, projects, meetings, and people</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function extractSnippet(content: string, query: string): string {
  const lower = content.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return "";
  const start = Math.max(0, idx - 40);
  const end = Math.min(content.length, idx + query.length + 60);
  let snippet = content.substring(start, end).replace(/\n/g, " ").trim();
  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";
  return snippet;
}