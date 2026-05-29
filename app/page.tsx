import { getHomepageFeedItems } from "@/lib/sanity/load";
import HomeFeed from "./_components/home-feed";

export default async function Home() {
  const items = await getHomepageFeedItems();
  return <HomeFeed items={items} />;
}
