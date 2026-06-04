import { useMemo, useState, type CSSProperties } from "react";
import { FileText, Search, X } from "lucide-react";

import { TextLink } from "@/components/shell/text-link";
import { Button } from "@/components/ui/button";
import type { BlogPost } from "@/lib/blog";
import type { Navigate } from "@/lib/navigation";
import { PretextText } from "@/lib/pretext/pretext-text";
import { cn } from "@/lib/utils";

export function BlogIndexPage({
  navigate,
  sortedPosts,
}: {
  navigate: Navigate;
  sortedPosts: BlogPost[];
}) {
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const allTags = useMemo(() => {
    return Array.from(new Set(sortedPosts.flatMap((post) => post.tags))).sort(
      (tagA, tagB) => tagA.localeCompare(tagB),
    );
  }, [sortedPosts]);
  const filteredPosts = useMemo(() => {
    const normalizedQuery = normalizeFilterValue(query);
    const normalizedSelectedTag = normalizeFilterValue(selectedTag);

    return sortedPosts.filter((post) => {
      const searchableText = normalizeFilterValue(
        [post.title, post.slug, post.description, post.date, ...post.tags].join(
          " ",
        ),
      );
      const matchesQuery =
        !normalizedQuery || searchableText.includes(normalizedQuery);
      const matchesTag =
        !normalizedSelectedTag ||
        post.tags.some(
          (tag) => normalizeFilterValue(tag) === normalizedSelectedTag,
        );
      const matchesDate = dateIsInRange(post.date, startDate, endDate);

      return matchesQuery && matchesTag && matchesDate;
    });
  }, [endDate, query, selectedTag, sortedPosts, startDate]);
  const hasFilters = Boolean(query || selectedTag || startDate || endDate);

  function clearFilters() {
    setQuery("");
    setSelectedTag("");
    setStartDate("");
    setEndDate("");
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
              onChange={(event) => setQuery(event.target.value)}
              placeholder="search name / tag / date"
              type="search"
              value={query}
            />
          </label>
          <label>
            <span className="sr-only">From date</span>
            <input
              aria-label="From date"
              className="motion-control h-9 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring"
              onChange={(event) => setStartDate(event.target.value)}
              type="date"
              value={startDate}
            />
          </label>
          <label>
            <span className="sr-only">To date</span>
            <input
              aria-label="To date"
              className="motion-control h-9 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring"
              onChange={(event) => setEndDate(event.target.value)}
              type="date"
              value={endDate}
            />
          </label>
          <Button
            aria-label="Clear filters"
            className="motion-control shrink-0"
            disabled={!hasFilters}
            onClick={clearFilters}
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
              aria-pressed={!selectedTag}
              className="motion-chip h-7 px-2 text-xs"
              onClick={() => setSelectedTag("")}
              style={motionStyle(0)}
              type="button"
              variant={!selectedTag ? "default" : "outline"}
            >
              all
            </Button>
            {allTags.map((tag, tagIndex) => (
              <Button
                aria-pressed={selectedTag === tag}
                className="motion-chip h-7 max-w-full px-2 text-xs"
                key={tag}
                onClick={() =>
                  setSelectedTag((currentTag) =>
                    currentTag === tag ? "" : tag,
                  )
                }
                style={motionStyle(tagIndex + 1)}
                type="button"
                variant={selectedTag === tag ? "default" : "outline"}
              >
                <span className="truncate">#{tag}</span>
              </Button>
            ))}
          </div>
        ) : null}

        <PretextText
          animation="meta"
          className="text-xs text-muted-foreground"
          text={`${filteredPosts.length} of ${sortedPosts.length} posts`}
        />
      </div>

      <div className="space-y-5">
        {filteredPosts.length ? (
          filteredPosts.map((post, postIndex) => (
            <article
              className="motion-rail motion-list-item border-l border-border pl-4"
              key={post.slug}
              style={motionStyle(postIndex)}
            >
              <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <TextLink href={post.path} navigate={navigate}>
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="motion-icon h-3.5 w-3.5" />
                    {post.title}
                  </span>
                </TextLink>
                {post.date ? (
                  <time className="text-xs text-muted-foreground">
                    {post.date}
                  </time>
                ) : null}
              </div>
              {post.description ? (
                <PretextText
                  className="text-sm leading-6 text-muted-foreground"
                  index={postIndex}
                  text={post.description}
                >
                  {post.description}
                </PretextText>
              ) : null}
              {post.tags.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {post.tags.map((tag, tagIndex) => (
                    <button
                      className={cn(
                        "motion-chip max-w-full truncate rounded-sm border border-border px-2 py-1 text-xs text-primary transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        selectedTag === tag &&
                          "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                      )}
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      style={motionStyle(tagIndex)}
                      type="button"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <p className="motion-rail motion-block border-l border-border pl-4 text-sm leading-6 text-muted-foreground">
            No posts match those filters.
          </p>
        )}
      </div>
    </section>
  );
}

function normalizeFilterValue(value: string) {
  return value.trim().toLocaleLowerCase();
}

function dateIsInRange(postDate: string, startDate: string, endDate: string) {
  if (!startDate && !endDate) {
    return true;
  }

  if (!postDate) {
    return false;
  }

  if (startDate && postDate < startDate) {
    return false;
  }

  if (endDate && postDate > endDate) {
    return false;
  }

  return true;
}

function motionStyle(index: number) {
  return { "--item-index": index } as CSSProperties;
}
