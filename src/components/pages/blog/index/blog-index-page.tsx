import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

import type { BlogPost } from "@/lib/blog";
import type { Navigate } from "@/lib/navigation";

import { BlogFilterControls } from "./blog-filter-controls";
import {
  allPostTags,
  filterPosts,
  filtersAreActive,
  type BlogFilters,
} from "./blog-index-filtering";
import { BlogPostList } from "./blog-post-list";

/** Empty filter object reused when initializing and clearing the index. */
const emptyFilters: BlogFilters = {
  endDate: "",
  query: "",
  selectedTag: "",
  startDate: "",
};

/** Props for the blog index route. */
type BlogIndexPageProps = {
  /** Internal navigation callback for post links. */
  navigate: Navigate;
  /** Posts already sorted in the display order expected by the index. */
  sortedPosts: BlogPost[];
};

/**
 * Stateful blog index that wires filter controls to the sorted post list.
 */
export function BlogIndexPage({
  navigate,
  sortedPosts,
}: BlogIndexPageProps) {
  const [filters, setFilters] = useState<BlogFilters>(emptyFilters);
  const allTags = useMemo(() => allPostTags(sortedPosts), [sortedPosts]);
  const filteredPosts = useMemo(() => {
    return filterPosts(sortedPosts, filters);
  }, [filters, sortedPosts]);
  const hasFilters = filtersAreActive(filters);

  /** Updates one filter key while preserving the rest of the controlled state. */
  function updateFilter(key: keyof BlogFilters, value: string) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }));
  }

  return (
    <section className="motion-page">
      <div
        className="motion-rail motion-block mb-10 space-y-3 border-l border-border pl-4"
        style={motionStyle(0)}
      >
        <p className="text-xs uppercase tracking-normal text-muted-foreground">
          blog
        </p>
        <h1 className="text-2xl font-semibold leading-tight">posts</h1>
      </div>

      <BlogFilterControls
        allTags={allTags}
        filteredPostCount={filteredPosts.length}
        filters={filters}
        hasFilters={hasFilters}
        onClearFilters={() => setFilters(emptyFilters)}
        onEndDateChange={(value) => updateFilter("endDate", value)}
        onQueryChange={(value) => updateFilter("query", value)}
        onSelectedTagChange={(value) => updateFilter("selectedTag", value)}
        onStartDateChange={(value) => updateFilter("startDate", value)}
        totalPostCount={sortedPosts.length}
      />

      <BlogPostList
        navigate={navigate}
        onSelectTag={(tag) => updateFilter("selectedTag", tag)}
        posts={filteredPosts}
        selectedTag={filters.selectedTag}
      />
    </section>
  );
}

/** Exposes the block position used by CSS staggered motion. */
function motionStyle(index: number) {
  return { "--item-index": index } as CSSProperties;
}
