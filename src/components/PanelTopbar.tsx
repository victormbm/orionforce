"use client";

import { useLanguage } from "@/components/LanguageProvider";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLoadingRouter as useRouter, LoadingLink as Link } from "@/components/LoadingProvider";
import { useEffect, useState } from "react";
import { ClassIcon } from "@/components/ClassIcon";
import { getClass } from "@/data/classes";
import { GUILD_ROLE_INFO } from "@/data/roles";
import {
  fetchActivity,
  hasNew,
  markSeen,
  pathToSection,
  type Activity,
} from "@/lib/activity";
import { type PublicMember } from "@/lib/members";
import { canLead, canManage } from "@/lib/permissions";
import { clearSession } from "@/lib/session";

export function PanelTopbar({ me }: { me: PublicMember }) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const myClass = getClass(me.classId);
  const roleInfo = GUILD_ROLE_INFO[me.guildRole];

  const [activity, setActivity] = useState<Activity | null>(null);
  // força recálculo dos badges após marcar uma seção como vista
  const [, setSeenTick] = useState(0);

  useEffect(() => {
    fetchActivity()
      .then(setActivity)
      .catch(() => {});
  }, [pathname]);

  // Ao abrir uma seção com alerta, marca como vista (limpa o badge).
  useEffect(() => {
    const section = pathToSection(pathname);
    if (section) {
      markSeen(me.id, section);
      setSeenTick((t) => t + 1);
    }
  }, [pathname, me.id]);

  const nav = [
    { href: "/painel", label: t("Visão Geral") },
    { href: "/painel/personagem", label: t("Meu Personagem") },
    { href: "/painel/eventos", label: t("Eventos") },
    { href: "/painel/avisos", label: t("Avisos") },
    ...(canLead(me.guildRole)
      ? [{ href: "/painel/gvg", label: "GvG" }]
      : []),
    ...(canManage(me.guildRole)
      ? [{ href: "/painel/lideranca", label: t("Liderança") }]
      : []),
  ];

  const logout = () => {
    clearSession();
    router.replace("/");
  };

  return (
    <header className="of-topbar">
      <div className="of-container flex items-center justify-between gap-3 py-3">
        {/* Marca + navegação */}
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Link href="/painel" className="flex shrink-0 items-center gap-2">
            <Image
              src="/orion-badge.png"
              alt="Orion Force"
              width={80}
              height={80}
              className="h-10 w-10 rounded-lg"
            />
            <span
              className="hidden text-sm font-black tracking-tight sm:block"
              style={{ color: "var(--of-text)" }}
            >
              ORION <span style={{ color: "var(--of-primary)" }}>FORCE</span>
            </span>
          </Link>

          <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
            {nav.map((item) => {
              const active = pathname === item.href;
              const section = pathToSection(item.href);
              const alert = section ? hasNew(activity, me.id, section) : false;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`of-nav-link ${active ? "of-nav-link--active" : ""}`}
                >
                  {item.label}
                  {alert && (
                    <span className="of-nav-badge" title={t("Novidade!")}>
                      !
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Usuário + sair */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p
              className="text-sm font-bold leading-tight"
              style={{ color: "var(--of-text)" }}
            >
              {me.nickname}
            </p>
            <p
              className="text-[11px] leading-tight"
              style={{ color: roleInfo.color }}
            >
              {t(roleInfo.label)}
              {myClass ? ` · ${myClass.name}` : ""}
            </p>
          </div>
          {myClass && <ClassIcon gameClass={myClass} size={40} />}
          <button className="of-btn-ghost" onClick={logout}>{t("Sair")} </button>
        </div>
      </div>
    </header>
  );
}
