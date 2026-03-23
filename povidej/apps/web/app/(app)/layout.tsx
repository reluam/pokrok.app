import { HomeGuard } from "../../components/HomeGuard";
import { AppShell } from "../../components/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <HomeGuard>
      <AppShell>{children}</AppShell>
    </HomeGuard>
  );
}
