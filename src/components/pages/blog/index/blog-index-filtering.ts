import type { BlogPost } from "@/lib/blog";

export type BlogFilters = {
  endDate: string;
  query: string;
  selectedTag: string;
  startDate: string;
};

export function allPostTags(posts: BlogPost[]) {
  return Array.from(new Set(posts.flatMap((post) => post.tags))).sort(
    (tagA, tagB) => tagA.localeCompare(tagB),
  );
}

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

export function filtersAreActive(filters: BlogFilters) {
  return Boolean(
    filters.query ||
      filters.selectedTag ||
      filters.startDate ||
      filters.endDate,
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
