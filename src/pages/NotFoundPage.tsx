import { useDocumentHead, SITE_URL } from "../lib/seo";

export default function NotFoundPage() {
  useDocumentHead({ title: "Page not found | Rikki's Mobile Bar", description: "Find Rikki's Mobile Bar services and event booking.", canonical: `${SITE_URL}/404`, noindex: true });
  return <main id="main" className="mx-auto max-w-3xl px-6 py-20"><h1 className="text-3xl font-bold">Page not found</h1><p className="my-4">This page may have moved. Let us help you find your next celebration.</p><a className="underline" href="/">Visit Rikki's Mobile Bar</a> · <a className="underline" href="/#book">Check availability</a></main>;
}
