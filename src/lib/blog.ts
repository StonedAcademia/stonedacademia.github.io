import readingTime from "reading-time/lib/reading-time";

/**
 * Fully parsed metadata and Markdown body for one local blog post.
 *
 * @remarks
 * Fields are intentionally plain strings and arrays so page components can
 * render without re-parsing frontmatter or touching Vite's module map.
 */
export type BlogPost = {
  /** Filename-derived route key without the `.md` extension. */
  slug: string;
  /** Canonical in-app path used by navigation and visible post metadata. */
  path: string;
  /** Human-readable title, falling back to a prettified slug. */
  title: string;
  /** Sortable date string from frontmatter, expected in ISO-like order. */
  date: string;
  /** Short index and hero copy. */
  description: string;
  /** Deduplicated, normalized tags without leading hash marks. */
  tags: string[];
  /** Precomputed reading-time label from the Markdown body. */
  readingTime: string;
  /** Markdown content with frontmatter removed. */
  body: string;
};

/** Supported value shapes in the site's intentionally small frontmatter parser. */
type FrontmatterValue = string | string[];

/**
 * Eagerly imports every Markdown file so the static bundle has no runtime
 * content fetching step.
 */
const rawPosts = import.meta.glob<string>("../content/blog/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
});

/**
 * Parses the small frontmatter subset supported by the site.
 *
 * @remarks
 * This deliberately accepts only flat `key: value` fields and simple block
 * lists, which keeps content loading deterministic without adding a YAML parser.
 */
function frontmatterFields(frontmatter: string) {
  const fields = new Map<string, FrontmatterValue>();
  let activeListKey: string | undefined;

  for (const rawLine of frontmatter.split("\n")) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    const listItemMatch = line.match(/^-\s+(.+)$/);

    if (activeListKey && listItemMatch) {
      const currentValue = fields.get(activeListKey);
      const currentList = Array.isArray(currentValue) ? currentValue : [];
      fields.set(activeListKey, [
        ...currentList,
        cleanFrontmatterValue(listItemMatch[1]),
      ]);
      continue;
    }

    const fieldMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);

    if (!fieldMatch) {
      activeListKey = undefined;
      continue;
    }

    const [, key, value] = fieldMatch;

    if (!value) {
      fields.set(key, []);
      activeListKey = key;
      continue;
    }

    fields.set(key, cleanFrontmatterValue(value));
    activeListKey = undefined;
  }

  return fields;
}

/** Removes wrapping quotes and surrounding whitespace from one scalar value. */
function cleanFrontmatterValue(value: string) {
  return value.trim().replace(/^["']|["']$/g, "");
}

/** Reads a scalar frontmatter field while ignoring list-valued keys. */
function stringField(
  fields: Map<string, FrontmatterValue>,
  key: string,
  fallback = "",
) {
  const value = fields.get(key);

  return typeof value === "string" ? value : fallback;
}

/**
 * Returns unique tags from either an inline array or a block list.
 *
 * @remarks
 * Tag identity is case-insensitive, but the first author-provided casing is
 * preserved for display.
 */
function tagsField(fields: Map<string, FrontmatterValue>) {
  const value = fields.get("tags");
  const tagValues = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? splitInlineTags(value)
      : [];
  const seen = new Set<string>();

  return tagValues
    .map((tag) => cleanFrontmatterValue(tag).replace(/^#/, "").trim())
    .filter((tag) => {
      const normalizedTag = tag.toLocaleLowerCase();

      if (!normalizedTag || seen.has(normalizedTag)) {
        return false;
      }

      seen.add(normalizedTag);
      return true;
    });
}

/** Splits `tags: a, b` and `tags: [a, b]` into raw tag tokens. */
function splitInlineTags(value: string) {
  const trimmedValue = value.trim();
  const listValue =
    trimmedValue.startsWith("[") && trimmedValue.endsWith("]")
      ? trimmedValue.slice(1, -1)
      : trimmedValue;

  return listValue.split(",");
}

/** Converts one Vite raw Markdown module into the `BlogPost` page contract. */
function parsePost(filePath: string, raw: string): BlogPost {
  const slug = filePath.split("/").pop()?.replace(/\.md$/, "") ?? "untitled";
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const fields = frontmatterFields(match?.[1] ?? "");
  const body = (match?.[2] ?? raw).trim();

  return {
    slug,
    path: `/blog/${slug}.md`,
    title: stringField(fields, "title", slug.replaceAll("-", " ")),
    date: stringField(fields, "date"),
    description: stringField(fields, "description"),
    tags: tagsField(fields),
    readingTime: readingTime(body).text,
    body,
  };
}

/**
 * All local posts sorted newest first.
 *
 * @remarks
 * Sorting relies on ISO-style date strings so lexical order matches chronology.
 */
export const posts = Object.entries(rawPosts)
  .map(([filePath, raw]) => parsePost(filePath, raw))
  .sort((a, b) => b.date.localeCompare(a.date));
