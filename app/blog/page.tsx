import { BlogListing } from "@/app/components/blog-listing";
import { getAllPosts } from "@/lib/blog";

const POSTS_PER_PAGE = 10;

function parsePageParam(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(candidate ?? "1", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
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
    <BlogListing
      posts={visiblePosts}
      currentPage={currentPage}
      totalPages={totalPages}
    />
  );
}
