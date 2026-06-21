import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BrandLoginPageClient } from "./login-form";

export default async function BrandLoginPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("brand_session");

  if (session) {
    redirect("/discover");
  }

  return <BrandLoginPageClient />;
}
