import React, { useEffect, useMemo, useState, ReactNode } from "react";
import styles from "../styles/quoteCalculator.module.css";

/** ===== Config ===== */
const LS_KEY = "factupro_quote_calculator_v2";
const CONTINGENCY_RATE = 0.10;
const DEFAULT_HOURS_PER_MONTH = 180;
const DEFAULT_HOURS_PER_DAY = 8;
const MARGINS = [0.25, 0.35, 0.40, 0.45, 0.50];

const fmt = (n: number) =>
  (isNaN(n) ? 0 : n).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// TIPOS
type SectionCardProps = {
  icon?: ReactNode;
  title: string;
  className?: string;
  children?: ReactNode; // <-- clave
};
type PeriodUnit = "Días" | "Meses";
type Row = { id: string; qty: number; description: string; unit: number; };
type PersistedState = {
  costHelperMonth: number;
  costTechMonth: number;
  hoursPerMonth: number;
  hoursPerDay: number;

  itemsSupplies: Row[];
  itemsTransport: Row[];
  itemsEpp: Row[];
  itemsOther: Row[];

  qtyHelpers: number;
  qtyTechs: number;
  periodUnit: PeriodUnit;
  periodValue: number;
};

// COMPONENTE
const SectionCard = ({ icon, title, className = "", children }: SectionCardProps) => (
  <section className={`${styles.card} ${className}`}>
    <div className={styles.cardHeader}>
      {icon ?? null}
      <h3 className={styles.cardTitle}>{title}</h3>
    </div>
    <div className={styles.cardBody}>{children}</div>
  </section>
);

const ItemsTable: React.FC<{
  title: string;
  icon?: React.ReactNode;
  items: Row[];
  onAdd: (r: Omit<Row, "id">) => void;
  onDelete: (id: string) => void;
}> = ({ title, icon, items, onAdd, onDelete }) => {
  const [qty, setQty] = useState<number>(1);
  const [description, setDescription] = useState<string>("");
  const [unit, setUnit] = useState<number>(0);

  const total = useMemo(
    () => items.reduce((acc, it) => acc + it.qty * it.unit, 0),
    [items]
  );

  const addItem = () => {
    if (!description.trim()) return;
    if (qty <= 0 || unit < 0) return;
    onAdd({ qty, description: description.trim(), unit });
    setQty(1); setDescription(""); setUnit(0);
  };

  return (
    <SectionCard title={title} icon={icon}>
      <div className={`${styles.row} ${styles.three}`} style={{ marginBottom: 12 }}>
        <input
          type="number" min={1}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className={styles.input}
          placeholder="Cantidad"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.input}
          placeholder="Descripción"
        />
        <div style={{ display: "flex", gap: 12 }}>
          <input
            type="number" min={0} step="0.01"
            value={unit}
            onChange={(e) => setUnit(Number(e.target.value))}
            className={styles.input}
            placeholder="Valor Unitario"
          />
          <button onClick={addItem} className={`${styles.btn} ${styles.btnAdd}`}>+ Agregar</button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th>Cantidad</th>
              <th>Descripción</th>
              <th>Valor Unitario</th>
              <th>Valor Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
        <tbody className={styles.tbody}>
          {items.length === 0 && (
            <tr><td colSpan={5} className={styles.empty}>No hay ítems agregados</td></tr>
          )}
          {items.map((it) => (
            <tr key={it.id}>
              <td>{it.qty}</td>
              <td>{it.description}</td>
              <td>{fmt(it.unit)}</td>
              <td>{fmt(it.qty * it.unit)}</td>
              <td>
                <button
                  onClick={() => onDelete(it.id)}
                  className={styles.btn}
                  title="Eliminar"
                  aria-label="Eliminar"
                  style={{ color: "#dc2626" }}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        </table>

        <div className={styles.totalBar}>
          <div className={styles.totalPill}>
            <span className={styles.totalPillLabel}>Total {title}</span>
            <span className={styles.totalPillValue}>{fmt(total)}</span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

type TabKey = "laborconf" | "calc" | "supplies" | "transport" | "epp" | "other";
const Tabs: React.FC<{ active: TabKey; onChange: (t: TabKey) => void }> = ({ active, onChange }) => {
  const Btn: React.FC<{ k: TabKey; label: string }> = ({ k, label }) => (
    <button
      onClick={() => onChange(k)}
      className={`${styles.tabBtn} ${active === k ? styles.tabActive : ""}`}
    >
      {label}
    </button>
  );
  return (
    <div className={styles.tabs}>
      <Btn k="calc" label="Calculadora" />
      <Btn k="laborconf" label="Costos Personal" />
      <Btn k="supplies" label="Insumos" />
      <Btn k="transport" label="Transporte" />
      <Btn k="epp" label="EPP Adicionales" />
      <Btn k="other" label="Otros" />
    </div>
  );
};

/** ===== Componente principal ===== */
const CalculadoraCotizaciones: React.FC = () => {
  const [state, setState] = useState<PersistedState>(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (raw) { try { return JSON.parse(raw) as PersistedState; } catch {} }

    const rawV1 = typeof window !== "undefined" ? localStorage.getItem("factupro_quote_calculator_v1") : null;
    if (rawV1) {
      try {
        const old = JSON.parse(rawV1);
        const daysPerMonthApprox = 22.5;
        return {
          costHelperMonth: (old.costHelper ?? 0) * daysPerMonthApprox,
          costTechMonth: (old.costTech ?? 0) * daysPerMonthApprox,
          hoursPerMonth: DEFAULT_HOURS_PER_MONTH,
          hoursPerDay: DEFAULT_HOURS_PER_DAY,
          itemsSupplies: old.itemsSupplies ?? [],
          itemsTransport: old.itemsTransport ?? [],
          itemsEpp: old.itemsEpp ?? [],
          itemsOther: old.itemsOther ?? [],
          qtyHelpers: old.qtyHelpers ?? 0,
          qtyTechs: old.qtyTechs ?? 0,
          periodUnit: old.periodUnit ?? "Meses",
          periodValue: old.periodValue ?? 1,
        } as PersistedState;
      } catch {}
    }
    return {
      costHelperMonth: 0,
      costTechMonth: 0,
      hoursPerMonth: DEFAULT_HOURS_PER_MONTH,
      hoursPerDay: DEFAULT_HOURS_PER_DAY,
      itemsSupplies: [],
      itemsTransport: [],
      itemsEpp: [],
      itemsOther: [],
      qtyHelpers: 0,
      qtyTechs: 0,
      periodUnit: "Meses",
      periodValue: 1,
    };
  });

  const [activeTab, setActiveTab] = useState<TabKey>("calc");

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state]);

  /* Derivados */
  const daysPerMonth = useMemo(() => {
    const d = (state.hoursPerMonth || 0) / Math.max(1, state.hoursPerDay || 1);
    return d > 0 ? d : 0;
  }, [state.hoursPerMonth, state.hoursPerDay]);

  const costHelperDay = useMemo(
    () => (daysPerMonth ? state.costHelperMonth / daysPerMonth : 0),
    [state.costHelperMonth, daysPerMonth]
  );
  const costTechDay = useMemo(
    () => (daysPerMonth ? state.costTechMonth / daysPerMonth : 0),
    [state.costTechMonth, daysPerMonth]
  );

  const totalSupplies = useMemo(() =>
    state.itemsSupplies.reduce((a, it) => a + it.qty * it.unit, 0), [state.itemsSupplies]);
  const totalTransport = useMemo(() =>
    state.itemsTransport.reduce((a, it) => a + it.qty * it.unit, 0), [state.itemsTransport]);
  const totalEpp = useMemo(() =>
    state.itemsEpp.reduce((a, it) => a + it.qty * it.unit, 0), [state.itemsEpp]);
  const totalOther = useMemo(() =>
    state.itemsOther.reduce((a, it) => a + it.qty * it.unit, 0), [state.itemsOther]);

  const daysForPeriod = useMemo(() => {
    if (state.periodUnit === "Días") return Math.max(0, state.periodValue);
    return Math.max(0, state.periodValue) * daysPerMonth;
  }, [state.periodUnit, state.periodValue, daysPerMonth]);

  const totalLabor = useMemo(() => {
    if (state.periodUnit === "Meses") {
      const perMonth = state.qtyHelpers * state.costHelperMonth + state.qtyTechs * state.costTechMonth;
      return perMonth * Math.max(0, state.periodValue);
    }
    const perDay = state.qtyHelpers * costHelperDay + state.qtyTechs * costTechDay;
    return perDay * daysForPeriod;
  }, [
    state.periodUnit, state.periodValue,
    state.qtyHelpers, state.qtyTechs,
    state.costHelperMonth, state.costTechMonth,
    costHelperDay, costTechDay, daysForPeriod
  ]);

  const baseCost = useMemo(
    () => totalLabor + totalSupplies + totalTransport + totalEpp + totalOther,
    [totalLabor, totalSupplies, totalTransport, totalEpp, totalOther]
  );
  const contingency = useMemo(() => baseCost * CONTINGENCY_RATE, [baseCost]);
  const subtotal = useMemo(() => baseCost + contingency, [baseCost, contingency]);

  /* Handlers listas */
  const addRow = (listKey: keyof PersistedState, r: Omit<Row, "id">) => {
    const id = crypto.randomUUID();
    setState((s) => ({ ...s, [listKey]: [...(s[listKey] as Row[]), { id, ...r }] }));
  };
  const delRow = (listKey: keyof PersistedState, id: string) => {
    setState((s) => ({ ...s, [listKey]: (s[listKey] as Row[]).filter((x) => x.id !== id) }));
  };

  /* Acciones */
  const clearAll = () => {
    const cleared: PersistedState = {
      costHelperMonth: 0,
      costTechMonth: 0,
      hoursPerMonth: DEFAULT_HOURS_PER_MONTH,
      hoursPerDay: DEFAULT_HOURS_PER_DAY,
      itemsSupplies: [],
      itemsTransport: [],
      itemsEpp: [],
      itemsOther: [],
      qtyHelpers: 0,
      qtyTechs: 0,
      periodUnit: "Meses",
      periodValue: 1,
    };
    setState(cleared);
    localStorage.setItem(LS_KEY, JSON.stringify(cleared));
  };

  const genPDF = () => { alert("Generación de PDF: pendiente de implementar."); };

  return (
    <div className={styles.wrapper}>
      <Tabs active={activeTab} onChange={setActiveTab} />

      {/* CALCULADORA */}
      {activeTab === "calc" && (
        <>
          <SectionCard title="Personal" icon={<span>👥</span>}>
            <div className={`${styles.row} ${styles.two}`}>
              <div>
                <label className={styles.label}>Cantidad de Ayudantes (0-100)</label>
                <input
                  type="number" min={0} max={100}
                  value={state.qtyHelpers}
                  onChange={(e) => setState((s) => ({ ...s, qtyHelpers: Number(e.target.value) }))}
                  className={styles.input}
                />
              </div>
              <div>
                <label className={styles.label}>Cantidad de Técnicos (0-100)</label>
                <input
                  type="number" min={0} max={100}
                  value={state.qtyTechs}
                  onChange={(e) => setState((s) => ({ ...s, qtyTechs: Number(e.target.value) }))}
                  className={styles.input}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Período de Trabajo" icon={<span>📅</span>}>
            <div className={`${styles.row} ${styles.two}`}>
              <div>
                <label className={styles.label}>Período</label>
                <select
                  value={state.periodUnit}
                  onChange={(e) => setState((s) => ({ ...s, periodUnit: e.target.value as PeriodUnit }))}
                  className={styles.select}
                >
                  <option>Días</option>
                  <option>Meses</option>
                </select>
                {state.periodUnit === "Meses" && (
                  <p className={styles.help}>
                    Se usan {state.hoursPerMonth} horas/mes ÷ {state.hoursPerDay} h/día =
                    <b> {daysPerMonth.toFixed(2)}</b> días laborables/mes.
                  </p>
                )}
              </div>
              <div>
                <label className={styles.label}>Tiempo de Trabajo ({state.periodUnit})</label>
                <input
                  type="number" min={1}
                  value={state.periodValue}
                  onChange={(e) => setState((s) => ({ ...s, periodValue: Number(e.target.value) }))}
                  className={styles.input}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Costos" icon={<span>💲</span>}>
            <div className={`${styles.row} ${styles.two}`}>
              <div>
                <label className={styles.label}>Costo Total de Mano de Obra ($)</label>
                <input readOnly value={fmt(totalLabor)} className={styles.input} />
                <p className={styles.help}>
                  {state.periodUnit === "Meses"
                    ? <>Mensual: ({state.qtyHelpers} ayud. × {fmt(state.costHelperMonth)}) + ({state.qtyTechs} téc. × {fmt(state.costTechMonth)}) × {state.periodValue} meses</>
                    : <>Diario: ({state.qtyHelpers} ayud. × {fmt(costHelperDay)}) + ({state.qtyTechs} téc. × {fmt(costTechDay)}) × {daysForPeriod} días</>}
                </p>
              </div>

              <div>
                <label className={styles.label}>Insumos ($)</label>
                <input readOnly value={fmt(totalSupplies)} className={styles.input} />
              </div>
              <div>
                <label className={styles.label}>Transporte ($)</label>
                <input readOnly value={fmt(totalTransport)} className={styles.input} />
              </div>
              <div>
                <label className={styles.label}>EPP Adicionales ($)</label>
                <input readOnly value={fmt(totalEpp)} className={styles.input} />
              </div>
              <div>
                <label className={styles.label}>Otros ($)</label>
                <input readOnly value={fmt(totalOther)} className={styles.input} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Resumen de Costos" icon={<span>ℹ️</span>}>
            <div className={`${styles.row} ${styles.two}`}>
              <div className={styles.summaryLine}>
                <span>Imprevistos (10%)</span>
                <span className={styles.summaryDanger}>{fmt(contingency)}</span>
              </div>
              <div className={styles.summaryLine} style={{ borderBottom: "none" }}>
                <span className="label">Subtotal</span>
                <span className={styles.summaryStrong}>{fmt(subtotal)}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Márgenes de Utilidad" icon={<span>📈</span>}>
            {MARGINS.map((m) => {
              const total = subtotal / (1 - m);
              return (
                <div key={m} className={styles.marginCard}>
                  <div>
                    <div className={styles.marginLabel}>Margen de Utilidad</div>
                    <div className={styles.marginPct}>{Math.round(m * 100)}%</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className={styles.marginLabel}>Total</div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{fmt(total)}</div>
                  </div>
                </div>
              );
            })}
          </SectionCard>

          <div className={styles.actions}>
            <button onClick={clearAll} className={`${styles.btn} ${styles.btnGhost}`}>Limpiar todo</button>
            <button onClick={genPDF} className={`${styles.btn} ${styles.btnPrimary}`}>Generar PDF (próximamente)</button>
          </div>
        </>
      )}

      {/* COSTOS PERSONAL */}
      {activeTab === "laborconf" && (
        <SectionCard title="Configuración de Costos de Personal (Mensual)" icon={<span>🧾</span>}>
          <div className={`${styles.row} ${styles.two}`}>
            <div>
              <label className={styles.label}>Costo por Ayudante (Mes)</label>
              <input
                type="number" min={0} step="0.01"
                value={state.costHelperMonth}
                onChange={(e) => setState((s) => ({ ...s, costHelperMonth: Number(e.target.value) }))}
                className={styles.input}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={styles.label}>Costo por Técnico (Mes)</label>
              <input
                type="number" min={0} step="0.01"
                value={state.costTechMonth}
                onChange={(e) => setState((s) => ({ ...s, costTechMonth: Number(e.target.value) }))}
                className={styles.input}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={styles.label}>Horas laborables por Mes</label>
              <input
                type="number" min={1}
                value={state.hoursPerMonth}
                onChange={(e) => setState((s) => ({ ...s, hoursPerMonth: Number(e.target.value) }))}
                className={styles.input}
                placeholder="180"
              />
            </div>
            <div>
              <label className={styles.label}>Horas por Día</label>
              <input
                type="number" min={1}
                value={state.hoursPerDay}
                onChange={(e) => setState((s) => ({ ...s, hoursPerDay: Number(e.target.value) }))}
                className={styles.input}
                placeholder="8"
              />
            </div>
          </div>

          <div className={styles.help} style={{ marginTop: 10 }}>
            Días laborables por mes = {state.hoursPerMonth} / {state.hoursPerDay} = <b>{((state.hoursPerMonth || 0) / Math.max(1, state.hoursPerDay || 1)).toFixed(2)}</b> días. <br/>
            Tarifas estimadas por día: Ayudante {fmt(daysPerMonth ? state.costHelperMonth / daysPerMonth : 0)}, Técnico {fmt(daysPerMonth ? state.costTechMonth / daysPerMonth : 0)}.
          </div>
        </SectionCard>
      )}

      {/* LISTAS */}
      {activeTab === "supplies" && (
        <ItemsTable
          title="Insumos"
          icon={<span>📦</span>}
          items={state.itemsSupplies}
          onAdd={(r) => addRow("itemsSupplies", r)}
          onDelete={(id) => delRow("itemsSupplies", id)}
        />
      )}
      {activeTab === "transport" && (
        <ItemsTable
          title="Transporte"
          icon={<span>🛻</span>}
          items={state.itemsTransport}
          onAdd={(r) => addRow("itemsTransport", r)}
          onDelete={(id) => delRow("itemsTransport", id)}
        />
      )}
      {activeTab === "epp" && (
        <ItemsTable
          title="EPP Adicionales"
          icon={<span>🛡️</span>}
          items={state.itemsEpp}
          onAdd={(r) => addRow("itemsEpp", r)}
          onDelete={(id) => delRow("itemsEpp", id)}
        />
      )}
      {activeTab === "other" && (
        <ItemsTable
          title="Otros"
          icon={<span>⋯</span>}
          items={state.itemsOther}
          onAdd={(r) => addRow("itemsOther", r)}
          onDelete={(id) => delRow("itemsOther", id)}
        />
      )}
    </div>
  );
};

export default CalculadoraCotizaciones;
