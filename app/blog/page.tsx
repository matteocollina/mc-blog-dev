import Link from "next/link";

import { formatPublishedAt, getAllPosts } from "@/lib/blog";

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <section className="space-y-10">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Blog
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-50">
          Articoli e aggiornamenti frontend
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-zinc-200">
          Un archivio semplice con note, riflessioni e contenuti pratici sul
          frontend.
        </p>
      </div>

      <div className="space-y-5">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 transition-colors hover:border-zinc-700"
          >
            <Link href={`/blog/${post.slug}`} className="group block space-y-3">
              <p className="text-sm font-medium text-zinc-400">
                {formatPublishedAt(post.publishedAt)}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 transition-colors group-hover:text-zinc-300">
                {post.title}
              </h2>
              <p className="text-base leading-7 text-zinc-300">
                {post.description}
              </p>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
