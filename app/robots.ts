import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://www.wecollab.in";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/creator/*"],
      disallow: [
        "/creator$",
        "/creator/campaigns",
        "/admin/",
        "/employee/",
        "/brand/",
        "/plans/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
