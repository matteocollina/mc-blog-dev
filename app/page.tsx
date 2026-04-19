import { BlogListing } from "./components/blog-listing";
import { getAllPosts } from "@/lib/blog";

export default async function Home() {
  const posts = await getAllPosts();

  return <BlogListing posts={posts} currentPage={1} totalPages={1} />;
}
