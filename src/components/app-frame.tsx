"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, Button, EmptyState, ErrorState, Spinner, type NavGroup } from "@drinks-on-chain/ui";
import { errorMessage } from "@/lib/api/errors";
import { useIsAuthenticated, useLogout, useMe } from "@/lib/auth/hooks";
import { APP_AUDIENCE, activeMembership } from "@/lib/auth/organization";
import { es } from "@/lib/i18n/es";
import { OrganizationSwitcher } from "./organization-switcher";

// Navegación de ejemplo: cada app define la suya.
const navigation: NavGroup[] = [{ items: [{ label: "Inicio", href: "/", exact: true }] }];

function FullScreenSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center" aria-busy="true">
      <Spinner label={es.common.loading} />
    </div>
  );
}

/**
 * Protege las rutas privadas y monta el shell. Mientras se recupera la sesión al arrancar
 * (renovación con la cookie) muestra un spinner; sin sesión lleva al login.
 */
export function AppFrame({ children }: { children: ReactNode }) {
  const authenticated = useIsAuthenticated();
  const router = useRouter();

  useEffect(() => {
    if (authenticated === false) router.replace("/login");
  }, [authenticated, router]);

  if (!authenticated) return <FullScreenSpinner />;
  return <Shell>{children}</Shell>;
}

function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();
  const me = useMe();

  const signOut = async () => {
    await logout();
    router.replace("/login");
  };

  if (me.isPending) return <FullScreenSpinner />;

  if (me.isError && !me.data) {
    return (
      <main className="grid min-h-dvh place-items-center p-6">
        <h1 className="sr-only">{es.app.name}</h1>
        <div className="grid justify-items-center gap-3">
          <ErrorState title={es.auth.sessionError} description={errorMessage(me.error)} onRetry={() => me.refetch()} />
          <Button variant="tertiary" onClick={() => void signOut()}>
            {es.auth.logout}
          </Button>
        </div>
      </main>
    );
  }

  // Guardia por audiencia (contrato de la Ola 0 §6): un consumidor no entra en una app de equipo.
  if (me.data.user.audience !== APP_AUDIENCE) {
    return (
      <main className="grid min-h-dvh place-items-center p-6">
        <h1 className="sr-only">{es.app.name}</h1>
        <EmptyState
          title={es.auth.wrongAudience}
          description={es.auth.wrongAudienceBody}
          action={<Button onClick={() => void signOut()}>{es.auth.logout}</Button>}
        />
      </main>
    );
  }

  const active = activeMembership(me.data);
  const role = active ? `${es.roles[active.role] ?? active.role} · ${active.organizationName}` : me.data.user.email;

  return (
    <AppShell
      navigation={navigation}
      currentPath={pathname}
      linkComponent={Link}
      user={{ name: me.data.user.fullName, role }}
      userMenu={[{ label: es.auth.logout, onSelect: () => void signOut() }]}
      topbarActions={<OrganizationSwitcher me={me.data} />}
    >
      {children}
    </AppShell>
  );
}
