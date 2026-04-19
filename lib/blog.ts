import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type BlogPostFrontmatter = {
  title: string;
  subtitle: string;
  description: string;
  publishedAt: string;
  tags: string[];
};

export type BlogPost = BlogPostFrontmatter & {
  slug: string;
  content: string;
};

export type BlogCategory = {
  name: string;
  slug: string;
  count: number;
};

function normalizeFrontmatterValue(value: string) {
  const normalized = value.trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    return normalized.slice(1, -1);
  }

  return normalized;
}

function parseFrontmatter(source: string): BlogPostFrontmatter & { content: string } {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) {
    throw new Error("Post markdown senza frontmatter valido.");
  }

  const [, rawFrontmatter, content] = match;
  const entries = rawFrontmatter
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex === -1) {
        throw new Error(`Frontmatter non valido: ${line}`);
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      return [key, value] as const;
    });

  const frontmatter = Object.fromEntries(entries);
  const title = normalizeFrontmatterValue(frontmatter.title);
  const subtitle = normalizeFrontmatterValue(frontmatter.subtitle);
  const description = normalizeFrontmatterValue(frontmatter.description);
  const publishedAt = normalizeFrontmatterValue(frontmatter.publishedAt);
  const tags = parseFrontmatterTags(frontmatter.tags);

  if (!title || !subtitle || !description || !publishedAt) {
    throw new Error("Frontmatter incompleto nel post markdown.");
  }

  return {
    title,
    subtitle,
    description,
    publishedAt,
    tags,
    content: content.trim(),
  };
}

function parseFrontmatterTags(value: string | undefined) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function parseInlineMarkdown(value: string) {
  const escaped = escapeHtml(value);

  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="underline decoration-zinc-500 underline-offset-4 hover:decoration-zinc-200">$1</a>',
    )
    .replace(/`([^`]+)`/g, '<code class="rounded bg-zinc-900 px-1.5 py-0.5 text-zinc-100">$1</code>');
}

export function renderMarkdown(content: string) {
  const lines = content.split("\n");
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) {
      return;
    }

    blocks.push(
      `<p class="text-lg leading-8 text-zinc-200">${parseInlineMarkdown(
        paragraph.join(" "),
      )}</p>`,
    );
    paragraph = [];
  };

  const flushList = () => {
    if (list.length === 0 || !listType) {
      return;
    }

    const tag = listType === "ol" ? "ol" : "ul";
    const listClass =
      listType === "ol"
        ? "list-decimal space-y-3 pl-6 text-lg leading-8 text-zinc-200"
        : "list-disc space-y-3 pl-6 text-lg leading-8 text-zinc-200";

    blocks.push(
      `<${tag} class="${listClass}">${list
        .map((item) => `<li>${parseInlineMarkdown(item)}</li>`)
        .join("")}</${tag}>`,
    );
    list = [];
    listType = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("#### ")) {
      flushParagraph();
      flushList();
      blocks.push(
        `<h4 class="pt-2 text-lg font-semibold tracking-tight text-zinc-200">${parseInlineMarkdown(
          line.slice(5),
        )}</h4>`,
      );
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push(
        `<h3 class="pt-3 text-xl font-semibold tracking-tight text-zinc-100">${parseInlineMarkdown(
          line.slice(4),
        )}</h3>`,
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push(
        `<h2 class="pt-4 text-2xl font-semibold tracking-tight text-zinc-50">${parseInlineMarkdown(
          line.slice(3),
        )}</h2>`,
      );
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      blocks.push(
        `<h1 class="pt-4 text-3xl font-semibold tracking-tight text-zinc-50">${parseInlineMarkdown(
          line.slice(2),
        )}</h1>`,
      );
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      if (listType === "ol") {
        flushList();
      }
      listType = "ul";
      list.push(line.slice(2));
      continue;
    }

    const orderedListMatch = line.match(/^\d+\.\s+(.*)$/);

    if (orderedListMatch) {
      flushParagraph();
      if (listType === "ul") {
        flushList();
      }
      listType = "ol";
      list.push(orderedListMatch[1]);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return blocks.join("");
}

function sortPosts(posts: BlogPost[]) {
  return posts.sort(
    (left, right) =>
      new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime(),
  );
}

function sortCategories(categories: BlogCategory[]) {
  return categories.sort((left, right) => left.name.localeCompare(right.name, "it"));
}

export async function getAllPosts() {
  const entries = await readdir(BLOG_DIR, { withFileTypes: true });
  const posts = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map(async (entry) => {
        const slug = entry.name.replace(/\.md$/, "");
        const source = await readFile(path.join(BLOG_DIR, entry.name), "utf8");
        const post = parseFrontmatter(source);

        return {
          slug,
          ...post,
        };
      }),
  );

  return sortPosts(posts);
}

export async function getPostBySlug(slug: string) {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);

  try {
    const source = await readFile(filePath, "utf8");
    const post = parseFrontmatter(source);

    return {
      slug,
      ...post,
    };
  } catch {
    return null;
  }
}

export async function getAdjacentPosts(slug: string) {
  const posts = await getAllPosts();
  const currentIndex = posts.findIndex((post) => post.slug === slug);

  if (currentIndex === -1) {
    return {
      previousPost: null,
      nextPost: null,
    };
  }

  return {
    previousPost: posts[currentIndex - 1] ?? null,
    nextPost: posts[currentIndex + 1] ?? null,
  };
}

export function slugifyTag(tag: string) {
  return tag
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getAllCategories() {
  const posts = await getAllPosts();
  const categories = new Map<string, BlogCategory>();

  for (const post of posts) {
    for (const tag of post.tags) {
      const slug = slugifyTag(tag);

      if (!slug) {
        continue;
      }

      const existing = categories.get(slug);

      if (existing) {
        existing.count += 1;
        continue;
      }

      categories.set(slug, {
        name: tag,
        slug,
        count: 1,
      });
    }
  }

  return sortCategories([...categories.values()]);
}

export async function getCategoryBySlug(slug: string) {
  const categories = await getAllCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function getPostsByTagSlug(slug: string) {
  const posts = await getAllPosts();

  return posts.filter((post) =>
    post.tags.some((tag) => slugifyTag(tag) === slug),
  );
}

export function formatPublishedAt(date: string) {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "long",
  }).format(new Date(date));
}
