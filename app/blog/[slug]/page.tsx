import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  formatPublishedAt,
  getAllPosts,
  getPostBySlug,
  renderMarkdown,
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
        </div>
      </header>

      <div
        className="space-y-6"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
      />
    </article>
  );
}
