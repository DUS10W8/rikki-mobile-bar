export type TeamMember = {
  id: string;
  name: string;
  role: string;
  blurb: string;
  slug: string; // matches /team/{slug}-{width}.{ext}
  accent: "sea" | "rust";
};

export const team: TeamMember[] = [
  {
    id: "dani",
    name: "Dani",
    role: "Detail Specialist • Quality Control",
    blurb: "Precision in every detail—problems prevented, perfection delivered.",
    slug: "dani",
    accent: "sea",
  },
  {
    id: "abe",
    name: "Abe",
    role: "Bartender • Service Professional",
    blurb: "Decade-plus in hospitality. Strong work ethic. Quick wit. Shows up, steps in, makes it memorable.",
    slug: "abe",
    accent: "sea",
  },
  {
    id: "casey",
    name: "Casey",
    role: "Barback • Event Operations",
    blurb: "His genuine warmth makes everyone feel welcome, valued, and cared for.",
    slug: "casey",
    accent: "rust",
  },
  {
    id: "dustin",
    name: "Dustin",
    role: "Creative Director • Event Systems",
    blurb: "Turning branding, tech, and event flow into ideas that just work—stress-free.",
    slug: "dustin",
    accent: "sea",
  },
  {
    id: "kaile",
    name: "Kaile",
    role: "Creative Strategy • Innovation",
    blurb: "Kaile sees what's next—and finds smarter, more modern ways to get there.",
    slug: "kaile",
    accent: "rust",
  },
  {
    id: "rikki",
    name: "Rikki",
    role: "Founder • Creative Director",
    blurb: "Rikki leads with operational awareness, building individual ownership through everyone's strengths.",
    slug: "rikki",
    accent: "rust",
  },
];
