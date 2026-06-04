import type { CSSProperties } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PretextText } from "@/lib/pretext/pretext-text";

import type { BlogFilters } from "./blog-index-filtering";

/** Props for the controlled blog index search, date, and tag controls. */
type BlogFilterControlsProps = {
  /** Tags available across the unfiltered post set. */
  allTags: string[];
  /** Number of posts currently visible after filtering. */
  filteredPostCount: number;
  /** Current controlled filter values. */
  filters: BlogFilters;
  /** Whether the clear button should be enabled. */
  hasFilters: boolean;
  /** Clears all controlled filters. */
  onClearFilters: () => void;
  /** Updates the inclusive upper date bound. */
  onEndDateChange: (value: string) => void;
  /** Updates the free-text query. */
  onQueryChange: (value: string) => void;
  /** Updates or clears the active tag. */
  onSelectedTagChange: (value: string) => void;
  /** Updates the inclusive lower date bound. */
  onStartDateChange: (value: string) => void;
  /** Number of posts before filtering. */
  totalPostCount: number;
};

/** Controlled filter toolbar for the blog index. */
export function BlogFilterControls({
  allTags,
  filteredPostCount,
  filters,
  hasFilters,
  onClearFilters,
  onEndDateChange,
  onQueryChange,
  onSelectedTagChange,
  onStartDateChange,
  totalPostCount,
}: BlogFilterControlsProps) {
  return (
    <div
      className="motion-rail motion-block mb-8 space-y-4 border-l border-border pl-4"
      style={motionStyle(1)}
    >
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_9.5rem_9.5rem_auto]">
        <label className="relative block">
          <span className="sr-only">Search posts</span>
          <Search className="motion-icon pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            aria-label="Search posts by name, tag, or date"
            className="motion-control h-9 w-full rounded-sm border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="search name / tag / date"
            type="search"
            value={filters.query}
          />
        </label>
        <label>
          <span className="sr-only">From date</span>
          <input
            aria-label="From date"
            className="motion-control h-9 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring"
            onChange={(event) => onStartDateChange(event.target.value)}
            type="date"
            value={filters.startDate}
          />
        </label>
        <label>
          <span className="sr-only">To date</span>
          <input
            aria-label="To date"
            className="motion-control h-9 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring"
            onChange={(event) => onEndDateChange(event.target.value)}
            type="date"
            value={filters.endDate}
          />
        </label>
        <Button
          aria-label="Clear filters"
          className="motion-control shrink-0"
          disabled={!hasFilters}
          onClick={onClearFilters}
          size="icon"
          title="Clear filters"
          type="button"
          variant="outline"
        >
          <X className="motion-icon h-3.5 w-3.5" />
        </Button>
      </div>

      {allTags.length ? (
        <div className="flex flex-wrap gap-2">
          <Button
            aria-pressed={!filters.selectedTag}
            className="motion-chip h-7 px-2 text-xs"
            onClick={() => onSelectedTagChange("")}
            style={motionStyle(0)}
            type="button"
            variant={!filters.selectedTag ? "default" : "outline"}
          >
            all
          </Button>
          {allTags.map((tag, tagIndex) => (
            <Button
              aria-pressed={filters.selectedTag === tag}
              className="motion-chip h-7 max-w-full px-2 text-xs"
              key={tag}
              onClick={() =>
                onSelectedTagChange(
                  filters.selectedTag === tag ? "" : tag,
                )
              }
              style={motionStyle(tagIndex + 1)}
              type="button"
              variant={filters.selectedTag === tag ? "default" : "outline"}
            >
              <span className="truncate">#{tag}</span>
            </Button>
          ))}
        </div>
      ) : null}

      <PretextText
        animation="meta"
        className="text-xs text-muted-foreground"
        text={`${filteredPostCount} of ${totalPostCount} posts`}
      />
    </div>
  );
}

/** Exposes the list position used by CSS staggered motion. */
function motionStyle(index: number) {
  return { "--item-index": index } as CSSProperties;
}
