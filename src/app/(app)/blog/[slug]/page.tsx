import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { blogPost } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

async function getPost(slug: string) {
  try {
    const [post] = await db
      .select()
      .from(blogPost)
      .where(and(eq(blogPost.slug, slug), eq(blogPost.published, true)))
      .limit(1);
    return post;
  } catch {
    return undefined;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Not Found" };

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    publisher: {
      "@type": "Organization",
      name: "Docs Squared",
      url: "https://docsquared.app",
    },
  };

  return (
    <article className="max-w-3xl mx-auto space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div>
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="gap-1.5 mb-4 -ml-2">
            <ArrowLeft className="h-3.5 w-3.5" />
            All posts
          </Button>
        </Link>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant="secondary">{post.category}</Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(post.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.readTime}
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
        <p className="text-lg text-muted-foreground mt-2">{post.description}</p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        {post.content.split("\n\n").map((paragraph, i) => {
          if (paragraph.startsWith("## ")) {
            return (
              <h2 key={i} className="text-xl font-bold mt-8 mb-4">
                {paragraph.replace("## ", "")}
              </h2>
            );
          }
          if (paragraph.startsWith("### ")) {
            return (
              <h3 key={i} className="text-lg font-semibold mt-6 mb-2">
                {paragraph.replace("### ", "")}
              </h3>
            );
          }
          if (paragraph.startsWith("> ")) {
            return (
              <blockquote
                key={i}
                className="border-l-4 border-primary/30 pl-4 my-4 text-muted-foreground italic whitespace-pre-line"
              >
                {paragraph.replace(/^> /gm, "")}
              </blockquote>
            );
          }
          if (paragraph.startsWith("- ") || paragraph.match(/^\d+\.\s/)) {
            const items = paragraph.split("\n").filter(Boolean);
            const isOrdered = !!items[0]?.match(/^\d+\.\s/);
            const Tag = isOrdered ? "ol" : "ul";
            return (
              <Tag
                key={i}
                className={`my-4 space-y-1 ${isOrdered ? "list-decimal" : "list-disc"} pl-5`}
              >
                {items.map((item, j) => (
                  <li key={j} className="text-sm leading-relaxed">
                    {renderInline(item.replace(/^[-\d]+[.)]\s*/, ""))}
                  </li>
                ))}
              </Tag>
            );
          }
          return (
            <p key={i} className="text-sm leading-relaxed mb-4">
              {renderInline(paragraph)}
            </p>
          );
        })}
      </div>

      <div className="border-t pt-8">
        <p className="text-sm text-muted-foreground mb-4">
          Ready to try these tools yourself?
        </p>
        <div className="flex gap-3">
          <Link href="/sign-up">
            <Button>Get Started Free</Button>
          </Link>
          <Link href="/blog">
            <Button variant="outline">More Articles</Button>
          </Link>
        </div>
      </div>
    </article>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
