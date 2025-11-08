import React, {
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useRef,
} from "react";
import styles from "../styles/quoteCalculator.module.css";
import {
  exportQuotePdf,
  QuoteExportPayload,
} from "../utils/quotePdf";

/** ===== Config ===== */
const LS_KEY = "factupro_quote_calculator_v2";
const CONTINGENCY_RATE = 0.1;
const CONTRACT_HOURS_DEFAULT = 180;
const DAYS_PER_MONTH_FOR_COST = 24;
const MARGINS = [0.25, 0.35, 0.4, 0.45, 0.5];

// Aportes de ley
const LAW_CONTRIBUTIONS = [
  { key: "social", label: "Seguro social (13.25%)", rate: 0.1325 },
  { key: "educativo", label: "Seguro educativo (1.50%)", rate: 0.015 },
  { key: "riesgo", label: "Riesgo profesional (5.67%)", rate: 0.0567 },
];

// Reservas contrato definido
const RESERVES = [
  { key: "xiii", label: "Décimo tercer mes (8.33%)", rate: 0.0833 },
  { key: "vac", label: "Vacaciones (9.09%)", rate: 0.0909 },
  {
    key: "xiii_vac",
    label: "Décimo tercer mes vacaciones (0.76%)",
    rate: 0.0076,
  },
  { key: "antiguedad", label: "Prima de antigüedad (1.92%)", rate: 0.0192 },
  { key: "ss_xiii", label: "Seguro social XIII mes (0.90%)", rate: 0.009 },
  {
    key: "ss_xiii_vac",
    label: "Seguro social XIII mes vac. (0.08%)",
    rate: 0.0008,
  },
  {
    key: "ss_vac",
    label: "Seguro social vacaciones (1.21%)",
    rate: 0.0121,
  },
  {
    key: "se_vac",
    label: "Seguro educativo vacaciones (0.14%)",
    rate: 0.0014,
  },
  {
    key: "rp_vac",
    label: "Riesgo profesional vacaciones (0.52%)",
    rate: 0.0052,
  },
];

// Valores fijos mensuales (no se aplican a horas extra)
const LIFE_POLICY = 9;
const UNIFORMS = 33.33;
const ADMIN_EXPENSES = 45;

// Aportes que SÍ aplican a horas extra (aportes + reservas)
const OVERTIME_CONTRIBUTION_RATE =
  LAW_CONTRIBUTIONS.reduce((s, c) => s + c.rate, 0) +
  RESERVES.reduce((s, c) => s + c.rate, 0);

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
  children?: ReactNode;
};

type PeriodUnit = "Días" | "Meses";
type Row = { id: string; qty: number; description: string; unit: number };

type CostBreakdown = {
  baseSalary: number;
  lawDetails: { label: string; amount: number }[];
  reserveDetails: { label: string; amount: number }[];
  lawTotal: number;
  reserveTotal: number;
  extrasTotal: number;
  monthlyTotal: number;
  dailyCost: number;
};

type OvertimeShift = "diurno" | "nocturno" | "nocturno_prolongado";
type OvertimeDay = "normal" | "domingo" | "feriado";
type OvertimeTier = "primeras" | "posteriores";
type OvertimeMode = "pattern" | "schedule";

type OvertimeDayConfig = {
  dayType: OvertimeDay;
  hours: number;
};
type OvertimeWeekConfig = {
  days: OvertimeDayConfig[];
};

type ScheduleDayConfig = {
  enabled: boolean;
  start: string; // HH:MM
  end: string; // HH:MM
  isHoliday: boolean;
  mealMinutes: number; // tiempo de comidas en minutos
};
type ScheduleWeekConfig = {
  days: ScheduleDayConfig[];
};

type OvertimeFactorBucket = {
  key: string;
  label: string;
  factor: number;
  hours: number;
};

type PersistedState = {
  // Costos personal
  techHourlyRate: number;
  helperHourlyRate: number;
  contractHoursPerMonth: number;

  // Listas
  itemsSupplies: Row[];
  itemsTransport: Row[];
  itemsEpp: Row[];
  itemsOther: Row[];

  // Calculadora principal
  qtyHelpers: number;
  qtyTechs: number;
  periodUnit: PeriodUnit;
  periodValue: number;

  // Horas extra patrón semanal
  overtimeShift: OvertimeShift;
  overtimeWeeksCount: number;
  overtimeWeek: OvertimeWeekConfig;

  // Modo de horas extra + horario semanal
  overtimeMode: OvertimeMode;
  overtimeScheduleWeek: ScheduleWeekConfig;
};

const OVERTIME_DAY_NAMES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const createEmptyWeek = (): OvertimeWeekConfig => ({
  days: [
    { dayType: "normal", hours: 0 }, // Lunes
    { dayType: "normal", hours: 0 }, // Martes
    { dayType: "normal", hours: 0 }, // Miércoles
    { dayType: "normal", hours: 0 }, // Jueves
    { dayType: "normal", hours: 0 }, // Viernes
    { dayType: "normal", hours: 0 }, // Sábado
    { dayType: "domingo", hours: 0 }, // Domingo
  ],
});

const createEmptyScheduleWeek = (): ScheduleWeekConfig => ({
  days: [
    { enabled: false, start: "08:00", end: "17:00", isHoliday: false, mealMinutes: 30 }, // L
    { enabled: false, start: "08:00", end: "17:00", isHoliday: false, mealMinutes: 30 }, // M
    { enabled: false, start: "08:00", end: "17:00", isHoliday: false, mealMinutes: 30 }, // X
    { enabled: false, start: "08:00", end: "17:00", isHoliday: false, mealMinutes: 30 }, // J
    { enabled: false, start: "08:00", end: "17:00", isHoliday: false, mealMinutes: 30 }, // V
    { enabled: false, start: "08:00", end: "13:00", isHoliday: false, mealMinutes: 0 },  // S
    { enabled: false, start: "08:00", end: "17:00", isHoliday: false, mealMinutes: 0 },  // D
  ],
});

const DEFAULT_STATE: PersistedState = {
  techHourlyRate: 0,
  helperHourlyRate: 0,
  contractHoursPerMonth: CONTRACT_HOURS_DEFAULT,
  itemsSupplies: [],
  itemsTransport: [],
  itemsEpp: [],
  itemsOther: [],
  qtyHelpers: 0,
  qtyTechs: 0,
  periodUnit: "Meses",
  periodValue: 1,

  overtimeShift: "diurno",
  overtimeWeeksCount: 1,
  overtimeWeek: createEmptyWeek(),

  overtimeMode: "pattern",
  overtimeScheduleWeek: createEmptyScheduleWeek(),
};

/** ===== Helpers ===== */

const computeMonthlyCost = (
  hourlyRate: number,
  hoursPerMonth: number
): CostBreakdown => {
  const safeRate = hourlyRate || 0;
  const safeHours = hoursPerMonth || 0;

  const baseSalary = safeRate * safeHours;

  const lawDetails = LAW_CONTRIBUTIONS.map((c) => ({
    label: c.label,
    amount: baseSalary * c.rate,
  }));
  const reserveDetails = RESERVES.map((r) => ({
    label: r.label,
    amount: baseSalary * r.rate,
  }));

  const lawTotal = lawDetails.reduce((sum, d) => sum + d.amount, 0);
  const reserveTotal = reserveDetails.reduce((sum, d) => sum + d.amount, 0);
  const extrasTotal = LIFE_POLICY + UNIFORMS + ADMIN_EXPENSES;

  const monthlyTotal = baseSalary + lawTotal + reserveTotal + extrasTotal;
  const dailyCost = DAYS_PER_MONTH_FOR_COST
    ? monthlyTotal / DAYS_PER_MONTH_FOR_COST
    : 0;

  return {
    baseSalary,
    lawDetails,
    reserveDetails,
    lawTotal,
    reserveTotal,
    extrasTotal,
    monthlyTotal,
    dailyCost,
  };
};

const getOvertimeFactor = (
  shift: OvertimeShift,
  day: OvertimeDay,
  tier: OvertimeTier
): number => {
  if (shift === "diurno") {
    if (day === "normal") {
      return tier === "primeras" ? 1.25 : 2.1875;
    }
    if (day === "domingo") {
      return tier === "primeras" ? 1.875 : 3.28125;
    }
    return tier === "primeras" ? 3.125 : 5.46875;
  }

  if (shift === "nocturno") {
    if (day === "normal") {
      return tier === "primeras" ? 1.5 : 2.625;
    }
    if (day === "domingo") {
      return tier === "primeras" ? 2.25 : 3.9375;
    }
    return tier === "primeras" ? 3.75 : 6.5625;
  }

  // nocturno_prolongado
  if (day === "normal") {
    return tier === "primeras" ? 1.75 : 3.0625;
  }
  if (day === "domingo") {
    return tier === "primeras" ? 2.625 : 4.59375;
  }
  return tier === "primeras" ? 4.375 : 7.65625;
};

type WeekOvertimeResult = {
  totalHours: number;
  tier1Hours: number;
  tier2Hours: number;
  techWagePerPerson: number;
  helperWagePerPerson: number;
};

const computeWeekOvertime = (
  week: OvertimeWeekConfig,
  shift: OvertimeShift,
  techRate: number,
  helperRate: number
): WeekOvertimeResult => {
  const days = week?.days ?? [];
  let weeklyTier1Remaining = 9;

  let totalHours = 0;
  let tier1Hours = 0;
  let tier2Hours = 0;
  let techWagePerPerson = 0;
  let helperWagePerPerson = 0;

  for (let i = 0; i < 7; i++) {
    const dayCfg =
      days[i] ??
      ({
        dayType: i === 6 ? "domingo" : "normal",
        hours: 0,
      } as OvertimeDayConfig);
    const hours = Math.max(0, dayCfg.hours || 0);
    if (!hours) continue;

    totalHours += hours;

    const dayTier1 = Math.min(hours, 3, weeklyTier1Remaining);
    const dayTier2 = Math.max(0, hours - dayTier1);
    weeklyTier1Remaining -= dayTier1;

    tier1Hours += dayTier1;
    tier2Hours += dayTier2;

    const f1 = getOvertimeFactor(shift, dayCfg.dayType, "primeras");
    const f2 = getOvertimeFactor(shift, dayCfg.dayType, "posteriores");

    const weighted = dayTier1 * f1 + dayTier2 * f2;

    techWagePerPerson += weighted * (techRate || 0);
    helperWagePerPerson += weighted * (helperRate || 0);
  }

  return {
    totalHours,
    tier1Hours,
    tier2Hours,
    techWagePerPerson,
    helperWagePerPerson,
  };
};

/** ===== Helpers horario semanal ===== */

const parseTimeToDecimal = (t: string): number => {
  if (!t) return 0;
  const [h, m] = t.split(":").map((x) => Number(x) || 0);
  return h + m / 60;
};

const dayTypeLabel = (dayType: OvertimeDay): string => {
  if (dayType === "domingo") return "Domingo";
  if (dayType === "feriado") return "Feriado / día patrio";
  return "Día normal";
};

type ScheduleWeekOvertimeResult = {
  totalHours: number;
  tier1Hours: number;
  tier2Hours: number;
  techWagePerPerson: number;
  helperWagePerPerson: number;
  buckets: OvertimeFactorBucket[];
};

const computeScheduleWeekOvertime = (
  week: ScheduleWeekConfig,
  shift: OvertimeShift,
  techRate: number,
  helperRate: number
): ScheduleWeekOvertimeResult => {
  const days = week?.days ?? [];
  let weeklyTier1Remaining = 9;

  let totalHours = 0;
  let tier1Hours = 0;
  let tier2Hours = 0;
  let techWagePerPerson = 0;
  let helperWagePerPerson = 0;

  const bucketMap: Record<string, OvertimeFactorBucket> = {};

  for (let i = 0; i < 7; i++) {
    const defaultMeal = i <= 4 ? 30 : 0;
    const cfg =
      days[i] ??
      ({
        enabled: false,
        start: "08:00",
        end: i === 5 ? "13:00" : "17:00",
        isHoliday: false,
        mealMinutes: defaultMeal,
      } as ScheduleDayConfig);

    if (!cfg.enabled) continue;

    const start = parseTimeToDecimal(cfg.start);
    const end = parseTimeToDecimal(cfg.end);
    if (start === end) continue;

    let presence = end - start;
    if (presence < 0) presence += 24;

    const lunchMinutes =
      cfg.mealMinutes === undefined ? defaultMeal : cfg.mealMinutes;
    const lunchHours = Math.max(0, lunchMinutes) / 60;

    let worked = presence - lunchHours;
    if (worked < 0) worked = 0;

    let dayType: OvertimeDay = "normal";
    if (cfg.isHoliday) {
      dayType = "feriado";
    } else if (i === 6) {
      dayType = "domingo";
    }

    let dailyQuota = 0;
    const isSaturday = i === 5;
    const isWeekday = i >= 0 && i <= 4;

    if (!cfg.isHoliday && dayType === "normal") {
      if (isWeekday) dailyQuota = 8; // 8 h netas
      else if (isSaturday) dailyQuota = 5;
    }

    const regularHours = Math.min(worked, dailyQuota);
    const overtimeRaw = Math.max(0, worked - regularHours);

    totalHours += overtimeRaw;
    if (!overtimeRaw) continue;

    const dayTier1 = Math.min(overtimeRaw, 3, weeklyTier1Remaining);
    const dayTier2 = Math.max(0, overtimeRaw - dayTier1);
    weeklyTier1Remaining -= dayTier1;

    tier1Hours += dayTier1;
    tier2Hours += dayTier2;

    const handleTier = (tier: OvertimeTier, hours: number) => {
      if (!hours) return;
      const factor = getOvertimeFactor(shift, dayType, tier);
      const weighted = hours * factor;

      techWagePerPerson += weighted * (techRate || 0);
      helperWagePerPerson += weighted * (helperRate || 0);

      const key = `${dayType}_${tier}`;
      if (!bucketMap[key]) {
        bucketMap[key] = {
          key,
          factor,
          label: `${dayTypeLabel(dayType)} – ${
            tier === "primeras" ? "Primer factor" : "Factor posterior"
          } (${factor.toFixed(4)}x)`,
          hours: 0,
        };
      }
      bucketMap[key].hours += hours;
    };

    handleTier("primeras", dayTier1);
    handleTier("posteriores", dayTier2);
  }

  return {
    totalHours,
    tier1Hours,
    tier2Hours,
    techWagePerPerson,
    helperWagePerPerson,
    buckets: Object.values(bucketMap),
  };
};

/** ===== Componentes base ===== */

const SectionCard = ({
  icon,
  title,
  className = "",
  children,
}: SectionCardProps) => (
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
    setQty(1);
    setDescription("");
    setUnit(0);
  };

  return (
    <SectionCard title={title} icon={icon}>
      <div className={`${styles.row} ${styles.three}`} style={{ marginBottom: 12 }}>
        <input
          type="number"
          min={1}
          inputMode="numeric"
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
          placeholder="Descripción del ítem"
        />
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="number"
            min={0}
            step={0.01}
            inputMode="decimal"
            value={unit === 0 ? "" : unit}
            onChange={(e) => setUnit(Number(e.target.value))}
            className={styles.input}
            placeholder="Valor unitario"
          />
          <button
            type="button"
            onClick={addItem}
            className={`${styles.btn} ${styles.btnAdd}`}
          >
            + Agregar
          </button>
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
              <tr>
                <td colSpan={5} className={styles.empty}>
                  No hay ítems agregados
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.qty}</td>
                <td>{it.description}</td>
                <td>{fmt(it.unit)}</td>
                <td>{fmt(it.qty * it.unit)}</td>
                <td>
                  <button
                    type="button"
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

type TabKey =
  | "laborconf"
  | "calc"
  | "supplies"
  | "transport"
  | "epp"
  | "other"
  | "extra";

const Tabs: React.FC<{ active: TabKey; onChange: (t: TabKey) => void }> = ({
  active,
  onChange,
}) => {
  const Btn: React.FC<{ k: TabKey; label: string }> = ({ k, label }) => (
    <button
      type="button"
      onClick={() => onChange(k)}
      className={`${styles.tabBtn} ${active === k ? styles.tabActive : ""}`}
    >
      {label}
    </button>
  );
  return (
    <div className={styles.tabs}>
      <Btn k="calc" label="Resumen" />
      <Btn k="laborconf" label="Costos personal" />
      <Btn k="extra" label="Horas extra" />
      <Btn k="supplies" label="Insumos" />
      <Btn k="transport" label="Transporte" />
      <Btn k="epp" label="EPP adicionales" />
      <Btn k="other" label="Otros" />
    </div>
  );
};

/** ===== Componente principal ===== */
const CalculadoraCotizaciones: React.FC = () => {
  const [state, setState] = useState<PersistedState>(() => {
    if (typeof window === "undefined") return DEFAULT_STATE;
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_STATE;
    try {
      const parsed = JSON.parse(raw);

      const parsedSchedule: ScheduleWeekConfig =
        parsed.overtimeScheduleWeek ?? createEmptyScheduleWeek();
      const normalizedSchedule: ScheduleWeekConfig = {
        days: (parsedSchedule.days || createEmptyScheduleWeek().days).map(
          (d: ScheduleDayConfig, idx: number) => {
            const defaultMeal = idx <= 4 ? 30 : 0;
            return {
              enabled: d.enabled ?? false,
              start: d.start ?? "08:00",
              end: d.end ?? (idx === 5 ? "13:00" : "17:00"),
              isHoliday: d.isHoliday ?? false,
              mealMinutes:
                d.mealMinutes === undefined ? defaultMeal : d.mealMinutes,
            };
          }
        ),
      };

      return {
        ...DEFAULT_STATE,
        ...parsed,
        overtimeWeek: parsed.overtimeWeek ?? DEFAULT_STATE.overtimeWeek,
        overtimeWeeksCount: parsed.overtimeWeeksCount ?? 1,
        overtimeMode: parsed.overtimeMode ?? "pattern",
        overtimeScheduleWeek: normalizedSchedule,
      };
    } catch {
      return DEFAULT_STATE;
    }
  });

  const [activeTab, setActiveTab] = useState<TabKey>("calc");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    }
  }, [state]);

  /* === Costos de personal desde rata hora === */
  const techCost = useMemo(
    () =>
      computeMonthlyCost(state.techHourlyRate, state.contractHoursPerMonth),
    [state.techHourlyRate, state.contractHoursPerMonth]
  );
  const helperCost = useMemo(
    () =>
      computeMonthlyCost(state.helperHourlyRate, state.contractHoursPerMonth),
    [state.helperHourlyRate, state.contractHoursPerMonth]
  );

  /* === Totales de listas === */
  const totalSupplies = useMemo(
    () => state.itemsSupplies.reduce((a, it) => a + it.qty * it.unit, 0),
    [state.itemsSupplies]
  );
  const totalTransport = useMemo(
    () => state.itemsTransport.reduce((a, it) => a + it.qty * it.unit, 0),
    [state.itemsTransport]
  );
  const totalEpp = useMemo(
    () => state.itemsEpp.reduce((a, it) => a + it.qty * it.unit, 0),
    [state.itemsEpp]
  );
  const totalOther = useMemo(
    () => state.itemsOther.reduce((a, it) => a + it.qty * it.unit, 0),
    [state.itemsOther]
  );

  /* === Horas extra: cálculo semanal según modo === */

  const weeksCount = useMemo(
    () => Math.max(1, state.overtimeWeeksCount || 1),
    [state.overtimeWeeksCount]
  );

  const weeklyOvertime = useMemo(() => {
    if (state.overtimeMode === "pattern") {
      const w = computeWeekOvertime(
        state.overtimeWeek || createEmptyWeek(),
        state.overtimeShift,
        state.techHourlyRate,
        state.helperHourlyRate
      );
      return {
        totalHours: w.totalHours,
        tier1Hours: w.tier1Hours,
        tier2Hours: w.tier2Hours,
        techWagePerPerson: w.techWagePerPerson,
        helperWagePerPerson: w.helperWagePerPerson,
        buckets: [] as OvertimeFactorBucket[],
      };
    }

    const w = computeScheduleWeekOvertime(
      state.overtimeScheduleWeek || createEmptyScheduleWeek(),
      state.overtimeShift,
      state.techHourlyRate,
      state.helperHourlyRate
    );
    return w;
  }, [
    state.overtimeMode,
    state.overtimeWeek,
    state.overtimeScheduleWeek,
    state.overtimeShift,
    state.techHourlyRate,
    state.helperHourlyRate,
  ]);

  const overtimeTotals = {
    totalHours: weeklyOvertime.totalHours * weeksCount,
    tier1Hours: weeklyOvertime.tier1Hours * weeksCount,
    tier2Hours: weeklyOvertime.tier2Hours * weeksCount,
  };

  const techOvertimeWagePerPerson =
    weeklyOvertime.techWagePerPerson * weeksCount;
  const helperOvertimeWagePerPerson =
    weeklyOvertime.helperWagePerPerson * weeksCount;

  const techOvertimeCostPerPerson =
    techOvertimeWagePerPerson * (1 + OVERTIME_CONTRIBUTION_RATE);
  const helperOvertimeCostPerPerson =
    helperOvertimeWagePerPerson * (1 + OVERTIME_CONTRIBUTION_RATE);

  const techOvertimeCost =
    techOvertimeCostPerPerson * Math.max(0, state.qtyTechs || 0);
  const helperOvertimeCost =
    helperOvertimeCostPerPerson * Math.max(0, state.qtyHelpers || 0);

  const totalOvertime = techOvertimeCost + helperOvertimeCost;

  const overtimeBuckets: OvertimeFactorBucket[] =
    state.overtimeMode === "schedule"
      ? weeklyOvertime.buckets.map((b) => ({
          ...b,
          hours: b.hours * weeksCount,
        }))
      : [];

  /* === Mano de obra base (sin horas extra) === */
  const totalLabor = useMemo(() => {
    if (state.periodUnit === "Meses") {
      const perMonth =
        state.qtyHelpers * helperCost.monthlyTotal +
        state.qtyTechs * techCost.monthlyTotal;
      return perMonth * Math.max(0, state.periodValue);
    }
    const perDay =
      state.qtyHelpers * helperCost.dailyCost +
      state.qtyTechs * techCost.dailyCost;
    return perDay * Math.max(0, state.periodValue);
  }, [
    state.periodUnit,
    state.periodValue,
    state.qtyHelpers,
    state.qtyTechs,
    helperCost.monthlyTotal,
    helperCost.dailyCost,
    techCost.monthlyTotal,
    techCost.dailyCost,
  ]);

  /* === Base + subtotal === */
  const baseCost = useMemo(
    () =>
      totalLabor +
      totalSupplies +
      totalTransport +
      totalEpp +
      totalOther +
      totalOvertime,
    [totalLabor, totalSupplies, totalTransport, totalEpp, totalOther, totalOvertime]
  );
  const contingency = useMemo(
    () => baseCost * CONTINGENCY_RATE,
    [baseCost]
  );
  const subtotal = useMemo(
    () => baseCost + contingency,
    [baseCost, contingency]
  );

  /* === Helpers edición horas extra patrón === */
  const updateOvertimeDayPattern = (
    dayIndex: number,
    patch: Partial<OvertimeDayConfig>
  ) => {
    setState((s) => {
      const week = s.overtimeWeek || createEmptyWeek();
      const days = [...week.days];
      while (days.length < 7) {
        days.push({ dayType: "normal", hours: 0 });
      }
      const currentDay = days[dayIndex];
      days[dayIndex] = { ...currentDay, ...patch };
      return { ...s, overtimeWeek: { ...week, days } };
    });
  };

  /* === Handlers listas === */
  const addRow = (listKey: keyof PersistedState, r: Omit<Row, "id">) => {
    const id = crypto.randomUUID();
    setState((s) => ({
      ...s,
      [listKey]: [...(s[listKey] as Row[]), { id, ...r }],
    }));
  };

  const delRow = (listKey: keyof PersistedState, id: string) => {
    setState((s) => ({
      ...s,
      [listKey]: (s[listKey] as Row[]).filter((x) => x.id !== id),
    }));
  };

  /* === Exportar PDF + JSON === */

  const buildExportPayload = (): QuoteExportPayload => {
    const margins = MARGINS.map((m) => ({
      label: `${Math.round(m * 100)}%`,
      value: subtotal / (1 - m),
    }));

    return {
      version: 1,
      createdAt: new Date().toISOString(),
      state,
      totals: {
        totalLabor,
        totalSupplies,
        totalTransport,
        totalEpp,
        totalOther,
        totalOvertime,
        baseCost,
        contingency,
        subtotal,
        margins,
      },
    };
  };

  const exportQuoteJson = (payload: QuoteExportPayload) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const filenameBase =
      "cotizacion_" + payload.createdAt.slice(0, 10).replace(/-/g, "");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenameBase}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    const payload = buildExportPayload();
    exportQuotePdf(payload);
    exportQuoteJson(payload);
  };

  const handleLoadJsonClick = () => {
    fileInputRef.current?.click();
  };

  const handleJsonFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = String(ev.target?.result || "");
        const parsed = JSON.parse(text);
        if (!parsed || !parsed.state) {
          alert("El archivo JSON no tiene el formato esperado.");
          return;
        }
        const importedState: PersistedState = {
          ...DEFAULT_STATE,
          ...parsed.state,
        };
        setState(importedState);
        if (typeof window !== "undefined") {
          localStorage.setItem(LS_KEY, JSON.stringify(importedState));
        }
      } catch (err) {
        console.error(err);
        alert("No se pudo leer el JSON. Verifica el archivo.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  /* === Acciones === */
  const clearAll = () => {
    setState(DEFAULT_STATE);
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, JSON.stringify(DEFAULT_STATE));
    }
  };

  const activeWeekPattern = state.overtimeWeek || createEmptyWeek();
  const scheduleWeek = state.overtimeScheduleWeek || createEmptyScheduleWeek();

  /* === Render === */
  return (
    <div className={styles.wrapper}>
      <Tabs active={activeTab} onChange={setActiveTab} />

      {/* ====== CALCULADORA PRINCIPAL ====== */}
      {activeTab === "calc" && (
        <>
          <SectionCard title="Paso 1 · Personal requerido" icon={<span>👥</span>}>
            <div className={`${styles.row} ${styles.two}`}>
              <div>
                <label className={styles.label}>Cantidad de Ayudantes</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  inputMode="numeric"
                  value={state.qtyHelpers === 0 ? "" : state.qtyHelpers}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      qtyHelpers: Number(e.target.value || 0),
                    }))
                  }
                  className={styles.input}
                  placeholder="Ej: 1"
                />
              </div>
              <div>
                <label className={styles.label}>Cantidad de Técnicos</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  inputMode="numeric"
                  value={state.qtyTechs === 0 ? "" : state.qtyTechs}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      qtyTechs: Number(e.target.value || 0),
                    }))
                  }
                  className={styles.input}
                  placeholder="Ej: 2"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Paso 2 · Período de trabajo" icon={<span>📅</span>}>
            <div className={`${styles.row} ${styles.two}`}>
              <div>
                <label className={styles.label}>Tipo de período</label>
                <select
                  value={state.periodUnit}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      periodUnit: e.target.value as PeriodUnit,
                    }))
                  }
                  className={styles.select}
                >
                  <option>Días</option>
                  <option>Meses</option>
                </select>
              </div>
              <div>
                <label className={styles.label}>
                  Tiempo de trabajo ({state.periodUnit})
                </label>
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={state.periodValue}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      periodValue: Number(e.target.value || 1),
                    }))
                  }
                  className={styles.input}
                  placeholder={`Ej: 1 ${
                    state.periodUnit === "Meses" ? "mes" : "día"
                  }`}
                />
              </div>
            </div>
          </SectionCard>

          {/* ====== RESULTADOS ====== */}
          <SectionCard
            title="Resultados de la cotización"
            icon={<span>📊</span>}
          >
            <div className={styles.resultsGroup}>
              <div className={styles.resultsBlock}>
                <div className={styles.resultsTitle}>Resumen de costos</div>
                <div className={styles.resultsRow}>
                  <span className={styles.resultsLabel}>Mano de obra</span>
                  <span className={styles.resultsValue}>{fmt(totalLabor)}</span>
                </div>
                <div className={styles.resultsRow}>
                  <span className={styles.resultsLabel}>Insumos</span>
                  <span className={styles.resultsValue}>{fmt(totalSupplies)}</span>
                </div>
                <div className={styles.resultsRow}>
                  <span className={styles.resultsLabel}>Transporte</span>
                  <span className={styles.resultsValue}>{fmt(totalTransport)}</span>
                </div>
                <div className={styles.resultsRow}>
                  <span className={styles.resultsLabel}>EPP adicionales</span>
                  <span className={styles.resultsValue}>{fmt(totalEpp)}</span>
                </div>
                <div className={styles.resultsRow}>
                  <span className={styles.resultsLabel}>Otros</span>
                  <span className={styles.resultsValue}>{fmt(totalOther)}</span>
                </div>
                <div className={styles.resultsRow}>
                  <span className={styles.resultsLabel}>
                    Horas extra (con aportes)
                  </span>
                  <span className={styles.resultsValue}>
                    {fmt(totalOvertime)}
                  </span>
                </div>
                <div
                  className={styles.resultsRow}
                  style={{
                    borderTop: "1px dashed #e5e7eb",
                    marginTop: 4,
                    paddingTop: 4,
                  }}
                >
                  <span className={styles.resultsLabel}>Costo base</span>
                  <span className={styles.resultsValue}>{fmt(baseCost)}</span>
                </div>
              </div>

              <div className={styles.resultsBlock}>
                <div className={styles.resultsTitle}>Subtotal e imprevistos</div>
                <div className={styles.resultsRow}>
                  <span className={styles.resultsLabel}>Imprevistos (10%)</span>
                  <span className={styles.resultsValueDanger}>
                    {fmt(contingency)}
                  </span>
                </div>
                <div className={styles.resultsRow}>
                  <span className={styles.resultsLabel}>Subtotal del proyecto</span>
                  <span className={styles.resultsValueStrong}>
                    {fmt(subtotal)}
                  </span>
                </div>
                <p className={styles.help} style={{ marginTop: 6 }}>
                  El subtotal incluye mano de obra, insumos, transporte, EPP,
                  otros costos y las horas extra, considerando los aportes
                  laborales que aplican.
                </p>
              </div>
            </div>

            <div className={styles.resultsMargins}>
              <div className={styles.resultsTitle}>
                Márgenes de utilidad sugeridos
              </div>
              <div className={styles.marginList}>
                {MARGINS.map((m) => {
                  const total = subtotal / (1 - m);
                  return (
                    <div key={m} className={styles.marginPill}>
                      <span className={styles.marginPillPct}>
                        {Math.round(m * 100)}%
                      </span>
                      <span className={styles.marginPillLabel}>
                        Total sugerido
                      </span>
                      <span className={styles.marginPillValue}>
                        {fmt(total)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionCard>

          {/* input oculto para cargar JSON */}
          <input
            type="file"
            ref={fileInputRef}
            accept="application/json"
            style={{ display: "none" }}
            onChange={handleJsonFileChange}
          />

          <div className={styles.actions}>
            <button
              type="button"
              onClick={clearAll}
              className={`${styles.btn} ${styles.btnGhost}`}
            >
              Limpiar todo
            </button>
            <button
              type="button"
              onClick={handleExportAll}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              Exportar PDF + JSON
            </button>
            <button
              type="button"
              onClick={handleLoadJsonClick}
              className={styles.btn}
            >
              Cargar desde JSON
            </button>
          </div>
        </>
      )}

      {/* ===== COSTOS PERSONAL ===== */}
      {activeTab === "laborconf" && (
        <SectionCard
          title="Costo de personal a partir de rata hora"
          icon={<span>🧾</span>}
        >
          <div className={`${styles.row} ${styles.three}`}>
            <div>
              <label className={styles.label}>Rata hora Técnico (USD)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={state.techHourlyRate === 0 ? "" : state.techHourlyRate}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    techHourlyRate: Number(e.target.value || 0),
                  }))
                }
                className={styles.input}
                placeholder="Ej: 5.70"
              />
            </div>
            <div>
              <label className={styles.label}>Rata hora Ayudante (USD)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={state.helperHourlyRate === 0 ? "" : state.helperHourlyRate}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    helperHourlyRate: Number(e.target.value || 0),
                  }))
                }
                className={styles.input}
                placeholder="Ej: 4.18"
              />
            </div>
            <div>
              <label className={styles.label}>
                Horas mensuales según contrato
              </label>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={state.contractHoursPerMonth || ""}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    contractHoursPerMonth: Number(
                      e.target.value || CONTRACT_HOURS_DEFAULT
                    ),
                  }))
                }
                className={styles.input}
                placeholder="Ej: 180"
              />
            </div>
          </div>

          <p className={styles.help} style={{ marginTop: 8 }}>
            El salario base mensual se calcula como <b>rata hora × horas
            mensuales</b>. Sobre ese valor se aplican los aportes de ley y
            reservas, además de póliza, uniformes y gastos administrativos.
          </p>

          <div className={styles.resultsGroup} style={{ marginTop: 10 }}>
            {/* Técnico */}
            <div className={styles.resultsBlock}>
              <div className={styles.resultsTitle}>Resumen Técnico</div>

              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>Salario base mensual</span>
                <span className={styles.resultsValue}>
                  {fmt(techCost.baseSalary)}
                </span>
              </div>

              <div className={styles.resultsSubTitle}>Aportes de ley</div>
              {techCost.lawDetails.map((d) => (
                <div key={d.label} className={styles.resultsRow}>
                  <span className={styles.resultsLabel}>{d.label}</span>
                  <span className={styles.resultsValue}>{fmt(d.amount)}</span>
                </div>
              ))}
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>Total aportes de ley</span>
                <span className={styles.resultsValue}>
                  {fmt(techCost.lawTotal)}
                </span>
              </div>

              <div className={styles.resultsSubTitle}>
                Reservas contrato definido
              </div>
              {techCost.reserveDetails.map((d) => (
                <div key={d.label} className={styles.resultsRow}>
                  <span className={styles.resultsLabel}>{d.label}</span>
                  <span className={styles.resultsValue}>{fmt(d.amount)}</span>
                </div>
              ))}
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>Total reservas</span>
                <span className={styles.resultsValue}>
                  {fmt(techCost.reserveTotal)}
                </span>
              </div>

              <div className={styles.resultsSubTitle}>Valores fijos</div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>Póliza de vida</span>
                <span className={styles.resultsValue}>{fmt(LIFE_POLICY)}</span>
              </div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>Uniformes</span>
                <span className={styles.resultsValue}>{fmt(UNIFORMS)}</span>
              </div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>Gastos administrativos</span>
                <span className={styles.resultsValue}>
                  {fmt(ADMIN_EXPENSES)}
                </span>
              </div>

              <div
                className={styles.resultsRow}
                style={{
                  borderTop: "1px dashed #e5e7eb",
                  marginTop: 4,
                  paddingTop: 4,
                }}
              >
                <span className={styles.resultsLabel}>Costo mensual Técnico</span>
                <span className={styles.resultsValueStrong}>
                  {fmt(techCost.monthlyTotal)}
                </span>
              </div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>Costo diario (24 días)</span>
                <span className={styles.resultsValue}>
                  {fmt(techCost.dailyCost)}
                </span>
              </div>
            </div>

            {/* Ayudante */}
            <div className={styles.resultsBlock}>
              <div className={styles.resultsTitle}>Resumen Ayudante</div>

              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>Salario base mensual</span>
                <span className={styles.resultsValue}>
                  {fmt(helperCost.baseSalary)}
                </span>
              </div>

              <div className={styles.resultsSubTitle}>Aportes de ley</div>
              {helperCost.lawDetails.map((d) => (
                <div key={d.label} className={styles.resultsRow}>
                  <span className={styles.resultsLabel}>{d.label}</span>
                  <span className={styles.resultsValue}>{fmt(d.amount)}</span>
                </div>
              ))}
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>Total aportes de ley</span>
                <span className={styles.resultsValue}>
                  {fmt(helperCost.lawTotal)}
                </span>
              </div>

              <div className={styles.resultsSubTitle}>
                Reservas contrato definido
              </div>
              {helperCost.reserveDetails.map((d) => (
                <div key={d.label} className={styles.resultsRow}>
                  <span className={styles.resultsLabel}>{d.label}</span>
                  <span className={styles.resultsValue}>{fmt(d.amount)}</span>
                </div>
              ))}
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>Total reservas</span>
                <span className={styles.resultsValue}>
                  {fmt(helperCost.reserveTotal)}
                </span>
              </div>

              <div className={styles.resultsSubTitle}>Valores fijos</div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>Póliza de vida</span>
                <span className={styles.resultsValue}>{fmt(LIFE_POLICY)}</span>
              </div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>Uniformes</span>
                <span className={styles.resultsValue}>{fmt(UNIFORMS)}</span>
              </div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>Gastos administrativos</span>
                <span className={styles.resultsValue}>
                  {fmt(ADMIN_EXPENSES)}
                </span>
              </div>

              <div
                className={styles.resultsRow}
                style={{
                  borderTop: "1px dashed #e5e7eb",
                  marginTop: 4,
                  paddingTop: 4,
                }}
              >
                <span className={styles.resultsLabel}>
                  Costo mensual Ayudante
                </span>
                <span className={styles.resultsValueStrong}>
                  {fmt(helperCost.monthlyTotal)}
                </span>
              </div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>Costo diario (24 días)</span>
                <span className={styles.resultsValue}>
                  {fmt(helperCost.dailyCost)}
                </span>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ===== HORAS EXTRA ===== */}
      {activeTab === "extra" && (
        <SectionCard title="Horas extra" icon={<span>⏱️</span>}>
          {/* Selector de enfoque + semanas + jornada */}
          <div className={`${styles.row} ${styles.two}`}>
            <div>
              <label className={styles.label}>Enfoque de cálculo</label>
              <select
                value={state.overtimeMode}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    overtimeMode: e.target.value as OvertimeMode,
                  }))
                }
                className={styles.select}
              >
                <option value="pattern">Horas extra por semana (manual)</option>
                <option value="schedule">Horario de trabajo por semana</option>
              </select>
            </div>
            <div>
              <label className={styles.label}>
                Semanas con este patrón/horario
              </label>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={state.overtimeWeeksCount || ""}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    overtimeWeeksCount: Number(e.target.value || 1),
                  }))
                }
                className={styles.input}
                placeholder="Ej: 4"
              />
            </div>
          </div>

          <div className={`${styles.row}`} style={{ marginTop: 8 }}>
            <div>
              <label className={styles.label}>Tipo de jornada</label>
              <select
                value={state.overtimeShift}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    overtimeShift: e.target.value as OvertimeShift,
                  }))
                }
                className={styles.select}
              >
                <option value="diurno">Periodo diurno</option>
                <option value="nocturno">
                  Periodo nocturno / mixta iniciada en día
                </option>
                <option value="nocturno_prolongado">
                  Prolongación nocturna / mixta iniciada en noche
                </option>
              </select>
            </div>
          </div>

          {/* ===== MODO 1: PATRÓN MANUAL ===== */}
          {state.overtimeMode === "pattern" && (
            <>
              <p className={styles.help} style={{ marginTop: 6 }}>
                Ingresa directamente las horas extra por día. El sistema aplica
                automáticamente hasta <b>3 horas por día</b> y <b>9 horas por
                semana</b> al primer factor, y el resto al factor posterior,
                respetando domingos y feriados.
              </p>

              <div className={styles.tableWrap} style={{ marginTop: 8 }}>
                <table className={styles.table}>
                  <thead className={styles.thead}>
                    <tr>
                      <th>Día</th>
                      <th>Tipo de día</th>
                      <th>Horas extra</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tbody}>
                    {OVERTIME_DAY_NAMES.map((name, idx) => {
                      const cfg = activeWeekPattern.days[idx] ?? {
                        dayType:
                          idx === 6 ? ("domingo" as OvertimeDay) : ("normal" as OvertimeDay),
                        hours: 0,
                      };
                      return (
                        <tr key={name}>
                          <td>{name}</td>
                          <td>
                            <select
                              value={cfg.dayType}
                              onChange={(e) =>
                                updateOvertimeDayPattern(idx, {
                                  dayType: e.target.value as OvertimeDay,
                                })
                              }
                              className={styles.select}
                            >
                              <option value="normal">Normal</option>
                              <option value="domingo">Domingo</option>
                              <option value="feriado">
                                Día nacional o de duelo
                              </option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              inputMode="decimal"
                              value={cfg.hours === 0 ? "" : cfg.hours}
                              onChange={(e) =>
                                updateOvertimeDayPattern(idx, {
                                  hours: Number(e.target.value || 0),
                                })
                              }
                              className={styles.input}
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ===== MODO 2: HORARIO POR SEMANA ===== */}
          {state.overtimeMode === "schedule" && (
            <>
              <p className={styles.help} style={{ marginTop: 6 }}>
                Marca los días trabajados y define la hora de inicio y fin, más
                el tiempo de comidas. Para días hábiles se considera jornada
                ordinaria de <b>8 h netas</b> (equivalentes a 8.5 h incluyendo
                30 min de comida) y <b>5 h</b> los sábados. Todo lo que exceda
                ese límite se considera hora extra, con tope de <b>3 h/día</b> y{" "}
                <b>9 h/semana</b> al primer factor.
              </p>

              <div className={styles.tableWrap} style={{ marginTop: 8 }}>
                <table className={styles.table}>
                  <thead className={styles.thead}>
                    <tr>
                      <th>Día</th>
                      <th>Trabaja</th>
                      <th>Inicio</th>
                      <th>Tiempo de comidas (min)</th>
                      <th>Fin</th>
                      <th>Feriado / Patrio</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tbody}>
                    {OVERTIME_DAY_NAMES.map((name, idx) => {
                      const defaultMeal = idx <= 4 ? 30 : 0;
                      const cfg =
                        scheduleWeek.days[idx] ??
                        ({
                          enabled: false,
                          start: "08:00",
                          end: idx === 5 ? "13:00" : "17:00",
                          isHoliday: false,
                          mealMinutes: defaultMeal,
                        } as ScheduleDayConfig);
                      return (
                        <tr key={name}>
                          <td>{name}</td>
                          <td>
                            <input
                              type="checkbox"
                              checked={cfg.enabled}
                              onChange={(e) =>
                                setState((s) => {
                                  const week =
                                    s.overtimeScheduleWeek ||
                                    createEmptyScheduleWeek();
                                  const days = [...week.days];
                                  days[idx] = {
                                    ...cfg,
                                    enabled: e.target.checked,
                                  };
                                  return {
                                    ...s,
                                    overtimeScheduleWeek: { ...week, days },
                                  };
                                })
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="time"
                              value={cfg.start}
                              onChange={(e) =>
                                setState((s) => {
                                  const week =
                                    s.overtimeScheduleWeek ||
                                    createEmptyScheduleWeek();
                                  const days = [...week.days];
                                  days[idx] = { ...cfg, start: e.target.value };
                                  return {
                                    ...s,
                                    overtimeScheduleWeek: { ...week, days },
                                  };
                                })
                              }
                              className={styles.input}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              step={5}
                              inputMode="numeric"
                              value={
                                cfg.mealMinutes === 0
                                  ? ""
                                  : cfg.mealMinutes
                              }
                              onChange={(e) =>
                                setState((s) => {
                                  const week =
                                    s.overtimeScheduleWeek ||
                                    createEmptyScheduleWeek();
                                  const days = [...week.days];
                                  days[idx] = {
                                    ...cfg,
                                    mealMinutes: Number(e.target.value || 0),
                                  };
                                  return {
                                    ...s,
                                    overtimeScheduleWeek: { ...week, days },
                                  };
                                })
                              }
                              className={styles.input}
                              placeholder={defaultMeal ? String(defaultMeal) : "0"}
                            />
                          </td>
                          <td>
                            <input
                              type="time"
                              value={cfg.end}
                              onChange={(e) =>
                                setState((s) => {
                                  const week =
                                    s.overtimeScheduleWeek ||
                                    createEmptyScheduleWeek();
                                  const days = [...week.days];
                                  days[idx] = { ...cfg, end: e.target.value };
                                  return {
                                    ...s,
                                    overtimeScheduleWeek: { ...week, days },
                                  };
                                })
                              }
                              className={styles.input}
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={cfg.isHoliday}
                              onChange={(e) =>
                                setState((s) => {
                                  const week =
                                    s.overtimeScheduleWeek ||
                                    createEmptyScheduleWeek();
                                  const days = [...week.days];
                                  days[idx] = {
                                    ...cfg,
                                    isHoliday: e.target.checked,
                                  };
                                  return {
                                    ...s,
                                    overtimeScheduleWeek: { ...week, days },
                                  };
                                })
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Resumen de horas */}
          <div className={styles.resultsGroup} style={{ marginTop: 10 }}>
            <div className={styles.resultsBlock}>
              <div className={styles.resultsTitle}>
                Distribución de horas (todas las semanas)
              </div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>
                  Total horas extra ({weeksCount} semana/s)
                </span>
                <span className={styles.resultsValue}>
                  {overtimeTotals.totalHours.toFixed(2)}
                </span>
              </div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>Horas primer factor</span>
                <span className={styles.resultsValue}>
                  {overtimeTotals.tier1Hours.toFixed(2)}
                </span>
              </div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>
                  Horas factor posterior
                </span>
                <span className={styles.resultsValue}>
                  {overtimeTotals.tier2Hours.toFixed(2)}
                </span>
              </div>

              {state.overtimeMode === "schedule" && (
                <>
                  <div className={styles.resultsSubTitle}>
                    Horas extra por factor aplicado
                  </div>
                  {overtimeBuckets.length === 0 && (
                    <p className={styles.help}>
                      No hay horas extra registradas con este horario.
                    </p>
                  )}
                  {overtimeBuckets.map((b) => (
                    <div key={b.key} className={styles.resultsRow}>
                      <span className={styles.resultsLabel}>{b.label}</span>
                      <span className={styles.resultsValue}>
                        {b.hours.toFixed(2)} h
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Cálculo económico */}
            <div className={styles.resultsBlock}>
              <div className={styles.resultsTitle}>Cálculo económico</div>

              <div className={styles.resultsSubTitle}>Técnico</div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>Cantidad de técnicos</span>
                <span className={styles.resultsValue}>{state.qtyTechs}</span>
              </div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>
                  Horas extra (salario) por técnico
                </span>
                <span className={styles.resultsValue}>
                  {fmt(techOvertimeWagePerPerson)}
                </span>
              </div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>
                  Aportes sobre horas extra
                </span>
                <span className={styles.resultsValue}>
                  {fmt(techOvertimeWagePerPerson * OVERTIME_CONTRIBUTION_RATE)}
                </span>
              </div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>
                  Total horas extra por técnico
                </span>
                <span className={styles.resultsValue}>
                  {fmt(techOvertimeCostPerPerson)}
                </span>
              </div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>
                  Total técnicos (horas extra)
                </span>
                <span className={styles.resultsValue}>
                  {fmt(techOvertimeCost)}
                </span>
              </div>

              <div className={styles.resultsSubTitle}>Ayudante</div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>Cantidad de ayudantes</span>
                <span className={styles.resultsValue}>{state.qtyHelpers}</span>
              </div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>
                  Horas extra (salario) por ayudante
                </span>
                <span className={styles.resultsValue}>
                  {fmt(helperOvertimeWagePerPerson)}
                </span>
              </div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>
                  Aportes sobre horas extra
                </span>
                <span className={styles.resultsValue}>
                  {fmt(
                    helperOvertimeWagePerPerson * OVERTIME_CONTRIBUTION_RATE
                  )}
                </span>
              </div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>
                  Total horas extra por ayudante
                </span>
                <span className={styles.resultsValue}>
                  {fmt(helperOvertimeCostPerPerson)}
                </span>
              </div>
              <div className={styles.resultsRow}>
                <span className={styles.resultsLabel}>
                  Total ayudantes (horas extra)
                </span>
                <span className={styles.resultsValue}>
                  {fmt(helperOvertimeCost)}
                </span>
              </div>

              <div
                className={styles.resultsRow}
                style={{
                  borderTop: "1px dashed #e5e7eb",
                  marginTop: 4,
                  paddingTop: 4,
                }}
              >
                <span className={styles.resultsLabel}>
                  Total horas extra (Téc. + Ayud., con aportes)
                </span>
                <span className={styles.resultsValueStrong}>
                  {fmt(totalOvertime)}
                </span>
              </div>
            </div>
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
          title="EPP adicionales"
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
