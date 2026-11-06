import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function toPlainText(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function getPage(slug: string) {
  if (!prisma) return null;

  return prisma.createPage.findFirst({
    where: { slug, status: 1 },
    select: {
      title: true,
      description: true,
      slug: true,
      updatedAt: true,
    },
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) return { title: "Page not found" };

  return {
    title: page.title,
    description: toPlainText(page.description).slice(0, 160),
    alternates: { canonical: `/page/${page.slug}` },
  };
}

export default async function LegacyContentPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) notFound();

  const content = toPlainText(page.description);

  return (
    <main className="cms-content-page">
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link> / {page.title}
          </div>
          <span className="eyebrow">VICTOR SCIENTIFIC CO.</span>
          <h1>{page.title}</h1>
        </div>
      </section>
      <section className="content-wrap">
        <article className="container cms-content-card">
          <div className="cms-content-text">{content}</div>
        </article>
      </section>
    </main>
  );
}
