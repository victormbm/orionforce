"use client";

import { useLanguage } from "@/components/LanguageProvider";

import { useLoadingRouter as useRouter, PageLoading, LoadingIndicator } from "@/components/LoadingProvider";
import { useEffect, useMemo, useState } from "react";
import { PanelTopbar } from "@/components/PanelTopbar";
import {
  announcementsRepo,
  type Announcement,
} from "@/lib/announcements";
import { membersRepo, type PublicMember } from "@/lib/members";
import { canLead } from "@/lib/permissions";
import { getSession } from "@/lib/session";

export default function AnnouncementsPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [me, setMe] = useState<PublicMember | null>(null);
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const reload = () => announcementsRepo.list().then(setItems);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/");
      return;
    }
    setMe(session);
    Promise.all([membersRepo.list(), reload()])
      .then(([list]) => setMembers(list))
      .finally(() => setLoading(false));
  }, [router]);

  const nameOf = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of members) map[m.id] = m.nickname;
    return map;
  }, [members]);

  if (!me) return <PageLoading />;
  const manager = canLead(me.guildRole);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    await announcementsRepo.create({ title, body, authorId: me.id });
    setTitle("");
    setBody("");
    await reload();
  };

  const handleDelete = async (id: string) => {
    await announcementsRepo.remove(id);
    await reload();
  };

  return (
    <div className="relative z-10 min-h-screen pb-16">
      <PanelTopbar me={me} />

      <main className="of-container pt-7">
        <h1
          className="text-xl font-extrabold tracking-tight sm:text-2xl"
          style={{ color: "var(--of-text)" }}
        >{t("Mensagens da Liderança")} </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--of-text-soft)" }}>{t("Avisos e comunicados oficiais do clã.")} </p>

        {manager && (
          <form onSubmit={handlePost} className="of-section mt-6 p-5">
            <h2 className="of-label mb-4" style={{ color: "var(--of-primary)" }}>{t("Publicar aviso")} </h2>
            <label className="of-label mb-2 block">{t("Título")}</label>
            <input
              className="of-input"
              placeholder={t("Ex: Reunião de WoE neste domingo")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <label className="of-label mb-2 mt-4 block">{t("Mensagem")}</label>
            <textarea
              className="of-input"
              rows={4}
              placeholder={t("Escreva o comunicado...")}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{ resize: "vertical" }}
            />
            <button
              type="submit"
              className="of-cta mt-4"
              style={{ width: "auto" }}
              disabled={!title.trim() || !body.trim()}
            >{t("Publicar")} </button>
          </form>
        )}

        <section className="mt-6 flex flex-col gap-4">
          {loading ? (
            <p className="text-sm" style={{ color: "var(--of-text-muted)" }}><LoadingIndicator /> </p>
          ) : items.length === 0 ? (
            <div className="of-section p-6 text-center">
              <p className="text-sm" style={{ color: "var(--of-text-muted)" }}>{t("Nenhum aviso publicado ainda.")} </p>
            </div>
          ) : (
            items.map((a) => (
              <article key={a.id} className="of-section p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3
                    className="text-lg font-bold"
                    style={{ color: "var(--of-text)" }}
                  >
                    {a.title}
                  </h3>
                  {manager && (
                    <button
                      className="of-btn-ghost shrink-0"
                      onClick={() => handleDelete(a.id)}
                    >{t("Excluir")} </button>
                  )}
                </div>
                <p
                  className="mt-2 whitespace-pre-wrap text-sm"
                  style={{ color: "var(--of-text-soft)" }}
                >
                  {a.body}
                </p>
                <p
                  className="mt-3 text-xs"
                  style={{ color: "var(--of-text-muted)" }}
                >
                  {nameOf[a.authorId] ?? t("Liderança")} ·{" "}
                  {new Date(a.createdAt).toLocaleString(locale)}
                </p>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
