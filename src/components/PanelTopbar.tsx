"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClassIcon } from "@/components/ClassIcon";
import { getClass } from "@/data/classes";
import { GUILD_ROLE_INFO } from "@/data/roles";
import { type PublicMember } from "@/lib/members";
import { canManage } from "@/lib/permissions";
import { clearSession } from "@/lib/session";

export function PanelTopbar({ me }: { me: PublicMember }) {
  const router = useRouter();
  const pathname = usePathname();
  const myClass = getClass(me.classId);
  const roleInfo = GUILD_ROLE_INFO[me.guildRole];

  const nav = [
    { href: "/painel", label: "Visão Geral" },
    { href: "/painel/personagem", label: "Meu Personagem" },
    { href: "/painel/eventos", label: "Eventos" },
    { href: "/painel/avisos", label: "Avisos" },
    { href: "/painel/leilao", label: "Leilão" },
    ...(canManage(me.guildRole)
      ? [
          { href: "/painel/gvg", label: "GvG" },
          { href: "/painel/lideranca", label: "Liderança" },
        ]
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
        <div className="flex items-center gap-4">
          <Link href="/painel" className="flex items-center gap-2">
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

          <nav className="flex items-center gap-1 overflow-x-auto">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`of-nav-link ${active ? "of-nav-link--active" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Usuário + sair */}
        <div className="flex items-center gap-3">
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
              {roleInfo.label}
              {myClass ? ` · ${myClass.name}` : ""}
            </p>
          </div>
          {myClass && <ClassIcon gameClass={myClass} size={40} />}
          <button className="of-btn-ghost" onClick={logout}>
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
