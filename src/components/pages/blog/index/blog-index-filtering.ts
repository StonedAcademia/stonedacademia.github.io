import type { BlogPost } from "@/lib/blog";

/** User-editable state for the blog index controls. */
export type BlogFilters = {
  /** Inclusive upper date bound in the browser date-input format. */
  endDate: string;
  /** Free-text search across title, slug, date, description, and tags. */
  query: string;
  /** Exact tag filter, compared case-insensitively. */
  selectedTag: string;
  /** Inclusive lower date bound in the browser date-input format. */
  startDate: string;
};

/** Returns every distinct post tag in display order. */
export function allPostTags(posts: BlogPost[]) {
  return Array.from(new Set(posts.flatMap((post) => post.tags))).sort(
    (tagA, tagB) => tagA.localeCompare(tagB),
  );
}

/**
 * Applies query, tag, and date filters to the provided post list.
 *
 * @remarks
 * Date comparisons are string comparisons, so post dates should stay ISO-like
 * (`YYYY-MM-DD`) to keep ordering correct.
 */
export function filterPosts(posts: BlogPost[], filters: BlogFilters) {
  const normalizedQuery = normalizeFilterValue(filters.query);
  const normalizedSelectedTag = normalizeFilterValue(filters.selectedTag);

  return posts.filter((post) => {
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
    const matchesDate = dateIsInRange(
      post.date,
      filters.startDate,
      filters.endDate,
    );

    return matchesQuery && matchesTag && matchesDate;
  });
}

/** Indicates whether any control is narrowing the blog index. */
export function filtersAreActive(filters: BlogFilters) {
  return Boolean(
    filters.query ||
      filters.selectedTag ||
      filters.startDate ||
      filters.endDate,
  );
}

/** Normalizes user-entered filter text for case-insensitive matching. */
function normalizeFilterValue(value: string) {
  return value.trim().toLocaleLowerCase();
}

/** Checks inclusive date bounds while treating undated posts as non-matches. */
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
