import MarketingPage, { Breadcrumbs, CtaBanner } from "../../components/layout/MarketingPage";
import { blogPosts } from "../../data/blogPosts";
import { useDocumentHead, SITE_URL } from "../../lib/seo";

const PAGE_URL = `${SITE_URL}/blog`;
const TITLE = "Wedding & Event Bar Planning Guides | Rikki's Mobile Bar";
const DESCRIPTION =
  "Practical wedding and event bar planning guides from Rikki's Mobile Bar: pricing, alcohol quantities, checklists, and more for Washington hosts.";

export default function BlogIndexPage() {
  useDocumentHead({
    title: TITLE,
    description: DESCRIPTION,
    canonical: PAGE_URL,
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Planning Guides", item: PAGE_URL },
        ],
      },
    ],
  });

  return (
    <MarketingPage>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Planning Guides" }]} />

      <section className="mx-auto max-w-4xl px-5 pb-4 pt-8 text-center md:pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-rust">Planning Guides</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-ink md:text-5xl">
          Wedding & Event Bar Planning Guides
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-brand-ink/78 md:text-lg">
          Straightforward answers to the questions we hear most from Washington couples and event hosts &mdash;
          pricing, alcohol quantities, checklists, and how to choose the right kind of bar service.
        </p>
      </section>

      <section className="border-t border-brand-chrome/70 bg-white py-14">
        <div className="mx-auto grid max-w-4xl gap-4 px-5 md:grid-cols-2">
          {blogPosts.map((post) => (
            <a
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-2xl border border-brand-chrome bg-brand-primary/40 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h2 className="text-lg font-bold text-brand-ink group-hover:text-brand-sea md:text-xl">{post.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-ink/75">{post.summary}</p>
              <span className="mt-4 text-sm font-semibold text-brand-sea">Read the guide &rarr;</span>
            </a>
          ))}
        </div>
      </section>

      <CtaBanner />
    </MarketingPage>
  );
}
