import BlogPage from "./blog/page";

export default async function Home(props: PageProps<"/">) {
  return <BlogPage searchParams={props.searchParams} params={Promise.resolve({})} />;
}
