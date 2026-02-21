import type { ReactNode } from "react";
import { Suspense } from "react";
import { ProjectsProvider } from "../../contexts/ProjectsContext";
import { AppShell } from "../../components/AppShell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ProjectsProvider>
        <AppShell>{children}</AppShell>
      </ProjectsProvider>
    </Suspense>
  );
}

