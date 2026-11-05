"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { PageLoading, useLoadingRouter } from "@/components/LoadingProvider";
import { PanelTopbar } from "@/components/PanelTopbar";
import { characterRepo } from "@/lib/character";
import type { PublicMember } from "@/lib/members";
import { getSession } from "@/lib/session";
import { calculateRawDefense, EMPTY_CALCULATOR, parseDefenseInput, restoreCalculator, type CalculatorInputs, type DefenseInputs } from "@/lib/raw-defense";

export default function CalculatorPage() {
  const { t } = useLanguage();
  const router = useLoadingRouter();
  const [me, setMe] = useState<PublicMember | null>(null);
  const [inputs, setInputs] = useState<CalculatorInputs>(EMPTY_CALCULATOR);
  const [ready, setReady] = useState(false);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace("/"); return; }
    setMe(session);
    try { setInputs(restoreCalculator(JSON.parse(localStorage.getItem(`orionforce.raw-defense.${session.id}`) ?? "null"))); }
    catch { /* Start with blank fields if the browser has no saved calculation. */ }
    setReady(true);
  }, [router]);
  useEffect(() => {
    if (!ready || !me) return;
    try { localStorage.setItem(`orionforce.raw-defense.${me.id}`, JSON.stringify(inputs)); }
    catch { /* Calculation remains available without browser persistence. */ }
  }, [ready, me, inputs]);

  const importBonuses = async () => {
    if (!me || importing) return;
    setImporting(true);
    setNotice("");
    try {
      const sheet = await characterRepo.get(me.id);
      const physical = sheet?.attributes.equipPdef;
      const magical = sheet?.attributes.equipMdef;
      const validPhysical = physical !== undefined && Number.isFinite(physical) && physical >= 0;
      const validMagical = magical !== undefined && Number.isFinite(magical) && magical >= 0;
      setInputs(previous => ({
        physical: { ...previous.physical, bonus: validPhysical ? String(physical) : previous.physical.bonus },
        magical: { ...previous.magical, bonus: validMagical ? String(magical) : previous.magical.bonus },
      }));
      setNotice(validPhysical || validMagical ? "Bônus encontrados importados. Confira os dois percentuais e preencha a defesa de equipamento direto do jogo." : "Nenhum bônus de equipamento salvo. Preencha os percentuais manualmente.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Erro ao importar bônus."); }
    finally { setImporting(false); }
  };

  if (!me || !ready) return <PageLoading />;
  return (
    <div className="relative z-10 min-h-screen pb-16">
      <PanelTopbar me={me} />
      <main className="of-container py-7">
        <header className="of-calculator-header">
          <div>
            <span className="of-label">{t("FERRAMENTA DA GUILDA")}</span>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{t("Calculadora RAW DEF & RAW MDEF")}</h1>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--of-text-soft)" }}>{t("Descubra sua defesa de equipamento antes do bônus percentual. Preencha os valores e veja o cálculo na hora.")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="of-btn-ghost" disabled={importing} onClick={importBonuses}>{t(importing ? "Carregando..." : "Usar bônus salvos")}</button>
            <button className="of-btn-ghost" onClick={() => { setInputs(EMPTY_CALCULATOR); setNotice(""); }}>{t("Limpar")}</button>
          </div>
        </header>
        {notice && <p role="status" className="mt-4 rounded-xl p-3 text-sm" style={{ background: "var(--of-primary-100)", color: "var(--of-text-soft)" }}>{t(notice)}</p>}
        <section className="of-section mt-5 p-4 text-sm" aria-label={t("Antes de calcular")}>
          <p className="font-bold">💡 {t("Calcule sem buffs e use somente a defesa de equipamento.")}</p>
          <p className="mt-1 text-xs" style={{ color: "var(--of-text-soft)" }}>{t("Não use a defesa total do personagem nem some Base PDEF/MDEF. Digite sem separador de milhar: 3908 e 32,46 (ou 32.46).")}</p>
        </section>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <DefenseCard kind="physical" values={inputs.physical} onChange={physical => setInputs(previous => ({ ...previous, physical }))} />
          <DefenseCard kind="magical" values={inputs.magical} onChange={magical => setInputs(previous => ({ ...previous, magical }))} />
        </div>
        <section className="of-section mt-6 p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">{t("Onde encontrar os valores no jogo")}</h2>
          <ol className="of-calculator-guide mt-4">
            <li><span>1</span><div><h3>{t("Defesa de equipamento")}</h3><p>{t("Em Personagem → Detalhes, toque em PDEF ou MDEF. No aviso, copie Equipment PDEF ou Equipment MDEF. Ignore o valor Base.")}</p></div></li>
            <li><span>2</span><div><h3>{t("Bônus percentual")}</h3><p>{t("Na seção Special, perto de Global CD%, procure Equipment PDEF % e Equipment MDEF %. Um valor de 32,46% deve ser digitado como 32,46.")}</p></div></li>
            <li><span>3</span><div><h3>{t("Compare nas mesmas condições")}</h3><p>{t("Retire buffs e mantenha os mesmos equipamentos ao copiar os números. O cálculo segue as fórmulas dos prints compartilhados pela guilda; arredondamentos do jogo podem causar pequenas diferenças.")}</p></div></li>
          </ol>
        </section>
        <section className="of-section mt-5 p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">{t("Como interpretar o resultado")}</h2>
          <p className="mt-3 text-sm" style={{ color: "var(--of-text-soft)" }}>{t("RAW DEF e RAW MDEF são valores de defesa bruta, não porcentagens de redução de dano. A calculadora remove apenas o bônus percentual informado.")}</p>
          <p className="mt-2 text-sm" style={{ color: "var(--of-text-soft)" }}>{t("A comparação com Ignore DEF/MDEF mostra apenas a diferença numérica. Ela não prevê o dano final: Ignore %, habilidades, buffs e outras reduções também podem interferir.")}</p>
          <div className="mt-4 rounded-xl p-4" style={{ background: "var(--of-surface-soft)" }}>
            <h3 className="text-sm font-bold">{t("PvP DMG Reduction é outro atributo")}</h3>
            <p className="mt-1 text-xs" style={{ color: "var(--of-text-soft)" }}>{t("O aviso com diferenças de 500, 1000, 2000 e outros valores trata de PvP DMG Reduction versus PvP DMG Bonus. Essa escala não deve ser usada para transformar RAW DEF/MDEF em redução de dano.")}</p>
          </div>
        </section>
      </main>
    </div>
  );
}

function DefenseCard({ kind, values, onChange }: { kind: "physical" | "magical"; values: DefenseInputs; onChange: (values: DefenseInputs) => void }) {
  const { t, locale } = useLanguage();
  const physical = kind === "physical";
  const stat = physical ? "PDEF" : "MDEF";
  const rawLabel = physical ? "RAW DEF" : "RAW MDEF";
  const color = physical ? "var(--of-primary)" : "#8e4ec6";
  const equipment = parseDefenseInput(values.equipment);
  const bonus = parseDefenseInput(values.bonus, true);
  const ignore = parseDefenseInput(values.ignore);
  const invalidIgnore = values.ignore.trim() !== "" && ignore === null;
  const result = equipment !== null && bonus !== null ? calculateRawDefense(equipment, bonus, ignore ?? undefined) : null;
  const number = (value: number, decimals = 2) => new Intl.NumberFormat(locale, { maximumFractionDigits: decimals }).format(value);
  const fields = [
    { key: "equipment" as const, label: `Equipment ${stat}`, hint: t("Valor de equipamento no aviso de PDEF/MDEF."), placeholder: physical ? "3908" : "930", parsed: equipment },
    { key: "bonus" as const, label: `Equipment ${stat} %`, hint: t("Percentual de bônus da seção Special."), placeholder: physical ? "32,46" : "19,20", parsed: bonus },
    { key: "ignore" as const, label: physical ? "Ignore DEF" : "Ignore MDEF", hint: t("Opcional: valor fixo do adversário, não Ignore %."), placeholder: t("Opcional"), parsed: ignore },
  ];
  return (
    <section className="of-section of-defense-card" style={{ borderTopColor: color }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-xl font-black" style={{ color }}>{rawLabel}</h2><p className="mt-1 text-sm" style={{ color: "var(--of-text-soft)" }}>{t(physical ? "Defesa física bruta" : "Defesa mágica bruta")}</p></div>
        <button className="of-calculator-example" onClick={() => onChange(physical ? { equipment: "3908", bonus: "32,46", ignore: "" } : { equipment: "930", bonus: "19,20", ignore: "" })}>{t("Ver exemplo")}</button>
      </div>
      <div className="mt-5 flex flex-col gap-4">
        {fields.map(field => {
          const invalid = values[field.key].trim() !== "" && field.parsed === null;
          const id = `${kind}-${field.key}`;
          return <div key={field.key}>
            <label htmlFor={id} className="mb-1.5 block text-xs font-bold">{field.label}{field.key === "ignore" ? ` · ${t("Opcional")}` : " *"}</label>
            <input id={id} className="of-input" type="text" inputMode="decimal" maxLength={100} autoComplete="off"
              value={values[field.key]} placeholder={field.placeholder} aria-invalid={invalid} aria-describedby={`${id}-hint`}
              onChange={event => onChange({ ...values, [field.key]: event.target.value })} />
            <p id={`${id}-hint`} className={`mt-1 text-xs ${invalid ? "text-red-600" : ""}`} style={invalid ? undefined : { color: "var(--of-text-muted)" }}>{invalid ? t("Use apenas números positivos ou zero, com vírgula ou ponto decimal.") : field.hint}</p>
          </div>;
        })}
      </div>
      <div className="of-raw-result mt-5" style={{ background: physical ? "var(--of-primary-100)" : "#f2eafa" }}>
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color }}>{t("Resultado estimado")}</span>
        <output htmlFor={`${kind}-equipment ${kind}-bonus`} className="mt-1 block text-4xl font-black tracking-tight" style={{ color }}>{result ? number(result.raw) : "—"}</output>
        <p className="mt-2 break-words font-mono text-[11px]" style={{ color: "var(--of-text-soft)" }}>{rawLabel} = Equipment {stat} ÷ (1 + Equipment {stat}% / 100)</p>
        <p className="mt-2 text-xs" style={{ color: "var(--of-text-soft)" }}>{result ? `${rawLabel} = ${number(equipment!)} ÷ (1 + ${number(bonus!)} / 100)` : t("Preencha a defesa de equipamento e o bônus percentual.")}</p>
        {result && <p className="mt-1 text-xs font-semibold" style={{ color: "var(--of-text-soft)" }}>{t("Multiplicador:")} {number(result.multiplier, 6)} · {number(equipment!)} ÷ {number(result.multiplier, 6)} ≈ {number(result.raw)}</p>}
      </div>
      {result && result.gap !== null && !invalidIgnore && <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "var(--of-border)" }}>
        <p className="text-xs font-bold">{t("Diferença para Ignore")}: {number(result.raw)} − {number(ignore!)} = <span style={{ color }}>{number(result.gap)}</span></p>
        <p className="mt-2 text-xs" style={{ color: "var(--of-text-soft)" }}>{t(result.gap > 0 ? "Sua defesa bruta está acima do Ignore informado." : result.gap < 0 ? "O Ignore informado está acima da sua defesa bruta." : "Sua defesa bruta e o Ignore informado são iguais.")}</p>
      </div>}
    </section>
  );
}
