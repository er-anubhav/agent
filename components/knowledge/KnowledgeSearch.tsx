'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { LoaderIcon, FileIcon } from '@/components/icons';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
  metadata?: {
    source?: string;
    page?: number;
    chunkIndex?: number;
  };
}

const SearchIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.5 13.5a6 6 0 100-12 6 6 0 000 12zM13.5 13.5l-3-3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function KnowledgeSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch('/knowledge/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          limit: 10,
          threshold: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setHasSearched(true);
      } else {
        console.error('Search failed:', response.statusText);
        setResults([]);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your knowledge base..."
          className="flex-1"
          disabled={isSearching}
        />
        <Button type="submit" disabled={isSearching || !query.trim()}>
          {isSearching ? (
            <div className="animate-spin">
              <LoaderIcon size={16} />
            </div>
          ) : (
            <SearchIcon size={16} />
          )}
          <span className="ml-2">{isSearching ? 'Searching...' : 'Search'}</span>
        </Button>
      </form>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-3">
          {results.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((result) => (
                <Card key={result.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="text-muted-foreground mt-1">
                      <FileIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm truncate">
                          {result.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Score: {Math.round(result.score * 100)}%</span>
                          {result.metadata?.page && (
                            <span>Page {result.metadata.page}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {result.content}
                      </p>
                      {result.metadata?.source && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Source: {result.metadata.source}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                No results found for &quot;{query}&quot;
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search terms or check if your documents are properly indexed.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
