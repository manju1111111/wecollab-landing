import { createAdminClient } from "@/lib/supabase/server";
import { getNewsletterById, getNewsletters } from "@/lib/supabase/fallback-db";
import { NewsletterDetailClient } from "@/components/newsletter/newsletter-detail-client";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { MOCK_NEWSLETTERS } from "@/data/mock-newsletters";
import { notFound, permanentRedirect } from "next/navigation";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createAdminClient();
  let post = await getNewsletterById(supabase, id);

  if (!post) {
    post = MOCK_NEWSLETTERS.find((n) => n.id === id) || null;
  }

  if (!post) return {};

  const seoTitle = post.seo_title || post.title;
  const seoDesc = post.seo_description || post.summary;
  const url = `https://www.wecollab.in/blog/${post.slug || post.id}`;

  return {
    title: `${seoTitle} | WeCollab Brief`,
    description: seoDesc,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: seoTitle,
      description: seoDesc,
      url: url,
      images: post.cover_image ? [{ url: post.cover_image }] : [],
      type: "article",
      publishedTime: post.published_at || post.created_at,
      authors: [post.author_name || "WeCollab Team"],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDesc,
      images: post.cover_image ? [post.cover_image] : [],
    },
  };
}

export default async function NewsletterDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createAdminClient();

  // 1. Fetch current post
  let post = await getNewsletterById(supabase, id);

  // Fallback to seeds if not in database
  if (!post) {
    post = MOCK_NEWSLETTERS.find((n) => n.id === id) || null;
  }

  if (!post) {
    notFound();
  }

  if (post.slug) {
    permanentRedirect(`/blog/${post.slug}`);
  }

  // 2. Fetch list to build navigation indexes & related posts
  let allPosts = await getNewsletters(supabase, false);
  if (allPosts.length === 0) {
    allPosts = MOCK_NEWSLETTERS;
  }

  // Find position
  const currentIndex = allPosts.findIndex((p: any) => p.id === post!.id);
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const prevPost = currentIndex !== -1 && currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  // Filter 3 related articles (excluding current article)
  const relatedPosts = allPosts
    .filter((p: any) => p.id !== post!.id)
    .slice(0, 3);

  // Get 5 latest posts for the trending widget
  const latestPosts = allPosts.slice(0, 5);

  return (
    <>
      <Navbar />
      
      {/* Blog posting schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.seo_description || post.summary,
            "image": post.cover_image || "",
            "datePublished": post.published_at || post.created_at,
            "author": {
              "@type": "Person",
              "name": post.author_name || "WeCollab Team"
            },
            "publisher": {
              "@type": "Organization",
              "name": "WeCollab",
              "logo": {
                "@type": "ImageObject",
                "url": "https://wecollab.co/assets/logo.jpg"
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://wecollab.co/newsletter/${post.id}`
            }
          })
        }}
      />

      {/* Breadcrumb schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://wecollab.co"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Newsletter",
                "item": "https://wecollab.co/newsletter"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": post.title,
                "item": `https://wecollab.co/newsletter/${post.id}`
              }
            ]
          })
        }}
      />

      <main className="min-h-screen bg-[#fafbff] pt-28 pb-20">
        <NewsletterDetailClient 
          post={post} 
          prevPost={prevPost} 
          nextPost={nextPost} 
          relatedPosts={relatedPosts}
          latestPosts={latestPosts}
        />
      </main>
      <Footer />
    </>
  );
}
