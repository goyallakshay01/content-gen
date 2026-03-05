import SEOContentTool from "@/components/SEOContentTool";
import { redirect } from "next/navigation";
import { getToken } from "../lib/auth";

export default async function Home() {
  const token = await getToken();

  // If not logged in → go to login
  if (!token) {
    redirect("/login");
  }

  return (
    <div>
      <SEOContentTool />
    </div>
  );
}