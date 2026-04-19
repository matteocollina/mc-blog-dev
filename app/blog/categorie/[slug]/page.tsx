import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import BackButton from "@/app/components/back-button";
import {
  formatPublishedAt,
  getAllCategories,
  getCategoryBySlug,
  getPostsByTagSlug,
  slugifyTag,
} from "@/lib/blog";
import { siteConfig } from "@/lib/site";

export const dynamicParams = false;

export async function generateStaticParams() {
  const categories = await getAllCategories();

  return categories.map((category) => ({
    slug: category.slug,
  }));
}

export async function generateMetadata(
  props: PageProps<"/blog/categorie/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {};
  }

  return {
    title: category.name,
    description: `Articoli del blog associati al tag ${category.name}.`,
    alternates: {
      canonical: `/blog/categorie/${category.slug}`,
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: `/blog/categorie/${category.slug}`,
      siteName: siteConfig.name,
      title: `${category.name} | ${siteConfig.name}`,
      description: `Articoli del blog associati al tag ${category.name}.`,
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} | ${siteConfig.name}`,
      description: `Articoli del blog associati al tag ${category.name}.`,
      images: ["/opengraph-image"],
    },
  };
}

export default async function BlogCategoryPage(
  props: PageProps<"/blog/categorie/[slug]">,
) {
  const { slug } = await props.params;
  const [category, posts] = await Promise.all([
    getCategoryBySlug(slug),
    getPostsByTagSlug(slug),
  ]);

  if (!category || posts.length === 0) {
    notFound();
  }

  return (
    <section className="space-y-10">
      <div className="space-y-4">
        <BackButton fallbackHref="/blog" />
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Categoria
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 capitalize">
            {category.name}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-200">
            {posts.length} {posts.length === 1 ? "articolo associato" : "articoli associati"} a
            questo tag.
          </p>
        </div>
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
            {post.tags.length > 0 ? (
              <ul className="flex flex-wrap gap-2 pt-4">
                {post.tags.map((tag) => {
                  const tagSlug = slugifyTag(tag);
                  const isCurrentTag = tagSlug === category.slug;

                  return (
                    <li key={tag}>
                      <Link
                        href={`/blog/categorie/${tagSlug}`}
                        aria-current={isCurrentTag ? "page" : undefined}
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-300 ${
                          isCurrentTag
                            ? "border-zinc-500 bg-zinc-100 text-zinc-950"
                            : "border-zinc-700 bg-zinc-950/80 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-900 hover:text-zinc-100"
                        }`}
                      >
                        {tag}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
