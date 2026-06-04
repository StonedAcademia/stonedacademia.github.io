export type BlogPost = {
  slug: string;
  path: string;
  title: string;
  date: string;
  description: string;
  body: string;
};

const rawPosts = import.meta.glob<string>("../content/blog/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
});

function frontmatterFields(frontmatter: string) {
  return new Map(
    frontmatter
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [key, ...rest] = line.split(":");
        return [key.trim(), rest.join(":").trim().replace(/^"|"$/g, "")];
      }),
  );
}

function parsePost(filePath: string, raw: string): BlogPost {
  const slug = filePath.split("/").pop()?.replace(/\.md$/, "") ?? "untitled";
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const fields = frontmatterFields(match?.[1] ?? "");
  const body = (match?.[2] ?? raw).trim();

  return {
    slug,
    path: `/blog/${slug}.md`,
    title: fields.get("title") || slug.replaceAll("-", " "),
    date: fields.get("date") || "",
    description: fields.get("description") || "",
    body,
  };
}

export const posts = Object.entries(rawPosts)
  .map(([filePath, raw]) => parsePost(filePath, raw))
  .sort((a, b) => b.date.localeCompare(a.date));
