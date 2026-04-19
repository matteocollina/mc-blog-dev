import Link from "next/link";

import { formatPublishedAt, getAllPosts, slugifyTag } from "@/lib/blog";

const POSTS_PER_PAGE = 10;

function parsePageParam(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(candidate ?? "1", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function buildPageHref(page: number) {
  return page <= 1 ? "/blog" : `/blog?page=${page}`;
}

export default async function BlogPage(props: PageProps<"/blog">) {
  const posts = await getAllPosts();
  const searchParams = await props.searchParams;
  const requestedPage = parsePageParam(searchParams.page);
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const visiblePosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);

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
        <p className="text-sm text-zinc-500">
          Pagina {currentPage} di {totalPages}
        </p>
      </div>

      <div className="space-y-5">
        {visiblePosts.map((post) => (
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
            {post.tags.length > 0 ? (
              <ul className="flex flex-wrap gap-2 pt-4">
                {post.tags.map((tag) => (
                  <li key={tag}>
                    <Link
                      href={`/blog/categorie/${slugifyTag(tag)}`}
                      className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-900 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-300"
                    >
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>

      {totalPages > 1 ? (
        <nav
          aria-label="Paginazione articoli"
          className="flex items-center justify-between gap-4 border-t border-zinc-800 pt-6"
        >
          {currentPage > 1 ? (
            <Link
              href={buildPageHref(currentPage - 1)}
              className="inline-flex rounded-full border border-zinc-700 bg-zinc-900/70 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-300"
            >
              Precedente
            </Link>
          ) : (
            <span className="inline-flex rounded-full border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm font-medium text-zinc-600">
              Precedente
            </span>
          )}

          {currentPage < totalPages ? (
            <Link
              href={buildPageHref(currentPage + 1)}
              className="ml-auto inline-flex rounded-full border border-zinc-700 bg-zinc-900/70 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-300"
            >
              Successiva
            </Link>
          ) : (
            <span className="ml-auto inline-flex rounded-full border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm font-medium text-zinc-600">
              Successiva
            </span>
          )}
        </nav>
      ) : null}
    </section>
  );
}
