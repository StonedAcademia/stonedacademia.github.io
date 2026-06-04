import readingTime from "reading-time/lib/reading-time";

export type BlogPost = {
  slug: string;
  path: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  readingTime: string;
  body: string;
};

type FrontmatterValue = string | string[];

const rawPosts = import.meta.glob<string>("../content/blog/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
});

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

function cleanFrontmatterValue(value: string) {
  return value.trim().replace(/^["']|["']$/g, "");
}

function stringField(
  fields: Map<string, FrontmatterValue>,
  key: string,
  fallback = "",
) {
  const value = fields.get(key);

  return typeof value === "string" ? value : fallback;
}

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

function splitInlineTags(value: string) {
  const trimmedValue = value.trim();
  const listValue =
    trimmedValue.startsWith("[") && trimmedValue.endsWith("]")
      ? trimmedValue.slice(1, -1)
      : trimmedValue;

  return listValue.split(",");
}

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

export const posts = Object.entries(rawPosts)
  .map(([filePath, raw]) => parsePost(filePath, raw))
  .sort((a, b) => b.date.localeCompare(a.date));
