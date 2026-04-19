import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import BackButton from "@/app/components/back-button";
import {
  formatPublishedAt,
  getAllPosts,
  getPostBySlug,
  renderMarkdown,
  slugifyTag,
} from "@/lib/blog";

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await getAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {};
  }

  return {
    title: `${post.title} | Blog di Matteo Collina`,
    description: post.description,
  };
}

export default async function BlogDetailPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="space-y-8">
      <BackButton fallbackHref="/blog" />

      <header className="space-y-4 border-b border-zinc-800 pb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
          {formatPublishedAt(post.publishedAt)}
        </p>
        <div className="space-y-3">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-50">
            {post.title}
          </h1>
          <p className="max-w-3xl text-xl leading-8 text-zinc-300">
            {post.subtitle}
          </p>
          <p className="max-w-3xl text-lg leading-8 text-zinc-200">
            {post.description}
          </p>
          {post.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-2 pt-2">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <Link
                    href={`/blog/categorie/${slugifyTag(tag)}`}
                    className="inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-300"
                  >
                    {tag}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>

      <div
        className="space-y-6"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
      />
    </article>
  );
}
