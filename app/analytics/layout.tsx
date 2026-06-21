import type { Metadata } from "next";

interface Props {
  searchParams: Promise<{ q?: string; platform?: string }> | undefined;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = searchParams ? await searchParams : {};
  const username = params?.q || "creator";
  const platform = params?.platform || "Instagram";
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);

  const title = `${displayName} Analytics — Free Creator Score | WeCollab`;
  const description = `Check @${username}'s engagement rate, audience quality & brand score on ${platform}. Free AI-powered creator analytics — no login required.`;
  const ogImageUrl = `/api/analytics/og?username=${username}&platform=${platform}&name=${displayName}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${displayName} Creator Analytics Report`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    keywords: [
      `${username} instagram analytics`,
      `${username} engagement rate`,
      "free creator analytics",
      "influencer analytics",
      "creator score",
      "WeCollab analytics",
    ],
  };
}

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
