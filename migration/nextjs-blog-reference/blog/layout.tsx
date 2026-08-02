import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog – Sohail Hanif Abbasi",
  description:
    "Insights, stories, and reflections from Sohail Hanif Abbasi — Pakistan Army veteran, radar technician, and community welfare activist.",
};

export default function BlogLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
