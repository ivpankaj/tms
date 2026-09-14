import { AppShell } from "@/components/shared/app-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 h-dvh h-screen w-screen overflow-hidden flex flex-col bg-background">
      <AppShell>{children}</AppShell>
    </div>
  );
}

