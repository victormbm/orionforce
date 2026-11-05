"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition, type ComponentProps, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { loadingStore } from "@/lib/loading";
import { useLanguage } from "@/components/LanguageProvider";

/** Start feedback at the click, before Next begins fetching/committing a route. */
export function useLoadingRouter() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const finishNavigation = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!pending) { finishNavigation.current?.(); finishNavigation.current = null; }
  }, [pending]);
  useEffect(() => () => finishNavigation.current?.(), []);
  const navigate = useCallback((operation: () => void) => {
    finishNavigation.current?.();
    finishNavigation.current = loadingStore.begin("navigation");
    startTransition(() => {
      try { operation(); }
      catch (error) { finishNavigation.current?.(); finishNavigation.current = null; throw error; }
    });
  }, [startTransition]);
  return useMemo(() => ({
    ...router,
    push: (...args: Parameters<typeof router.push>) => navigate(() => router.push(...args)),
    replace: (...args: Parameters<typeof router.replace>) => navigate(() => router.replace(...args)),
  }), [router, navigate]);
}

export function LoadingLink({ href, children, ...props }: Omit<ComponentProps<typeof Link>, "href" | "onNavigate"> & { href: string }) {
  const router = useLoadingRouter();
  const pathname = usePathname();
  return <Link {...props} href={href} onNavigate={event => {
    if (href === pathname) return;
    event.preventDefault();
    router.push(href);
  }}>{children}</Link>;
}

export function LoadingIndicator() {
  const { t } = useLanguage();
  return <span className="of-loading-inline" role="status" aria-live="polite">
    <span className="of-loading-spinner" aria-hidden="true" />{t("Carregando...")}
  </span>;
}

export function PageLoading() {
  const { t } = useLanguage();
  return <div className="of-page-loading" role="status" aria-live="polite">
    <span className="of-loading-spinner" aria-hidden="true" />
    <span>{t("Carregando...")}</span>
  </div>;
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const { pending, actions } = useSyncExternalStore(loadingStore.subscribe, loadingStore.getSnapshot, loadingStore.getServerSnapshot);
  const active = pending > 0;
  const [lingering, setLingering] = useState(false);
  const visible = active || lingering;
  const [actionLabel, setActionLabel] = useState(false);
  useEffect(() => {
    // Show immediately; hold the visual briefly after completion to avoid a flash.
    if (active) { setLingering(true); return; }
    const timer = setTimeout(() => setLingering(false), 300);
    return () => clearTimeout(timer);
  }, [active]);
  useEffect(() => { if (active) setActionLabel(actions > 0); }, [active, actions]);
  return <>
    <div inert={actions > 0 || undefined} aria-busy={active}>{children}</div>
    {visible && <div className="of-global-loading" role="status" aria-live="polite" aria-atomic="true">
      <div className="of-loading-progress" aria-hidden="true"><span /></div>
      <div className="of-loading-pill">
        <span className="of-loading-spinner" aria-hidden="true" />
        <span>{t(actionLabel ? "Processando…" : "Carregando...")}</span>
      </div>
    </div>}
  </>;
}
