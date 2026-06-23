import { createAdminClient } from "@/lib/supabase/server";
import { getNewsletterBySlug, getNewsletters } from "@/lib/supabase/fallback-db";
import { NewsletterDetailClient } from "@/components/newsletter/newsletter-detail-client";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { MOCK_NEWSLETTERS } from "@/data/mock-newsletters";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/breadcrumb";
import React from "react";

export const dynamic = "force-dynamic";

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createAdminClient();
  let post = await getNewsletterBySlug(supabase, slug);

  if (!post) {
    post = MOCK_NEWSLETTERS.find((n) => n.slug === slug || n.id === slug) || null;
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

export default async function BlogDetailPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const supabase = await createAdminClient();

  // 1. Fetch current post by slug
  let post = await getNewsletterBySlug(supabase, slug);

  // Fallback to seeds if not in database
  if (!post) {
    post = MOCK_NEWSLETTERS.find((n) => n.slug === slug || n.id === slug) || null;
  }

  if (!post) {
    notFound();
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

  const articleSchema = {
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
        "url": "https://www.wecollab.in/assets/logo.jpg"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.wecollab.in/blog/${post.slug || post.id}`
    }
  };

  return (
    <>
      <Navbar />
      
      {/* Blog posting schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <main className="min-h-screen bg-[#fafbff] pt-28 pb-20 font-sans">
        <div className="mx-auto max-w-[1140px] px-6 sm:px-8">
          
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { name: "Newsletter Archive", item: "/newsletter" },
              { name: post.title, item: `/blog/${post.slug || post.id}` }
            ]}
          />

          <NewsletterDetailClient 
            post={post} 
            prevPost={prevPost} 
            nextPost={nextPost} 
            relatedPosts={relatedPosts}
            latestPosts={latestPosts}
          />
        </div>
      </main>
      
      <Footer />
    </>
  );
}
