import { Navbar } from "@/components/ui/Navbar";
import { ScrollToTop } from "@/components/ui/ScrollToTop";

export default function PublicNavLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 pt-10">
      <Navbar />
      {children}
      <ScrollToTop />
    </div>
  );
}
