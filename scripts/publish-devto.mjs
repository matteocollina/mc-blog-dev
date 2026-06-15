import { readFile } from "node:fs/promises";
import path from "node:path";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const DEFAULT_SITE_URL = "https://frontendfacile.it/";
const DEVTO_API_URL = "https://dev.to/api/articles";

function getEnv(name) {
  const value = process.env[name];
  return value?.trim() ? value.trim() : undefined;
}

function normalizeSiteUrl(value) {
  if (!value) {
    return DEFAULT_SITE_URL;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

function normalizeFrontmatterValue(value) {
  const normalized = value.trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    return normalized.slice(1, -1);
  }

  return normalized;
}

function parseFrontmatterTags(value) {
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

function parsePost(source) {
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

      return [key, value];
    });

  const frontmatter = Object.fromEntries(entries);
  const title = normalizeFrontmatterValue(frontmatter.title);
  const subtitle = normalizeFrontmatterValue(frontmatter.subtitle ?? "");
  const publishedAt = normalizeFrontmatterValue(frontmatter.publishedAt ?? "");
  const tags = parseFrontmatterTags(frontmatter.tags);

  if (!title || !publishedAt) {
    throw new Error("Frontmatter incompleto nel post markdown.");
  }

  return {
    title,
    subtitle,
    publishedAt,
    tags,
    content: content.trim(),
  };
}

function slugifyTag(tag) {
  return tag
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);
}

function toDevToTags(tags) {
  return [...new Set(tags.map(slugifyTag).filter(Boolean))].slice(0, 4);
}

function buildBodyMarkdown(post, canonicalUrl) {
  const parts = [];

  if (post.subtitle) {
    parts.push(`> ${post.subtitle}`);
  }

  parts.push(post.content);
  parts.push(`\n---\nArticolo originale: ${canonicalUrl}`);

  return parts.join("\n\n").trim();
}

async function getAddedBlogFiles() {
  const before = getEnv("GITHUB_BEFORE");
  const after = getEnv("GITHUB_SHA") ?? "HEAD";

  if (!before || /^0+$/.test(before)) {
    return [];
  }

  const { stdout } = await execFile("git", [
    "diff",
    "--diff-filter=A",
    "--name-only",
    before,
    after,
    "--",
    "content/blog",
  ]);

  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.endsWith(".md"));
}

async function publishPost(apiKey, siteUrl, filePath) {
  const source = await readFile(path.join(process.cwd(), filePath), "utf8");
  const post = parsePost(source);
  const slug = path.basename(filePath, ".md");
  const canonicalUrl = new URL(`/blog/${slug}`, siteUrl).toString();
  const body_markdown = buildBodyMarkdown(post, canonicalUrl);
  const payload = {
    article: {
      title: post.title,
      body_markdown,
      published: getEnv("DEVTO_PUBLISHED") !== "false",
      canonical_url: canonicalUrl,
      tags: toDevToTags(post.tags),
    },
  };

  if (getEnv("DEVTO_DRY_RUN") === "true") {
    console.log(`DRY RUN: ${filePath}`);
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const response = await fetch(DEVTO_API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Dev.to ha risposto ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log(`Pubblicato su Dev.to: ${filePath} -> ${data.url ?? data.path ?? data.id}`);
}

async function main() {
  const files = await getAddedBlogFiles();

  if (files.length === 0) {
    console.log("Nessun nuovo articolo da pubblicare su Dev.to.");
    return;
  }

  const apiKey = getEnv("DEVTO_API_KEY");

  if (!apiKey) {
    throw new Error("Variabile DEVTO_API_KEY mancante.");
  }

  const siteUrl = normalizeSiteUrl(
    getEnv("NEXT_PUBLIC_SITE_URL") ??
      getEnv("SITE_URL") ??
      getEnv("VERCEL_PROJECT_PRODUCTION_URL") ??
      getEnv("VERCEL_URL"),
  );

  for (const file of files) {
    await publishPost(apiKey, siteUrl, file);
  }
}

await main();
