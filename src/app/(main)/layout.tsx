import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 w-full relative">
        {/* Adiciona o padding em MobileNav somente no celular */}
        <div className="pb-20 lg:pb-0 h-full">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
