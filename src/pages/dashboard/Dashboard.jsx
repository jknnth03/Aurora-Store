import { useState, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend as ChartJSLegend,
  Filler,
} from "chart.js";
import { Bar, Line, Doughnut, Radar } from "react-chartjs-2";
import { useGetQaChecklistsQuery } from "../../features/api/qa-checklist/qaChecklistApi";
import "./Dashboard.scss";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  ChartJSLegend,
  Filler,
);

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const WEEK_LABELS = ["1st week", "2nd week", "3rd week", "4th week"];
const ORDINALS = ["", "1st", "2nd", "3rd", "4th", "5th"];

const C_ORANGE = "#f37925";
const C_AMBER = "#FAC775";
const C_RED = "#F09595";
const C_GREEN = "#97C459";

const flattenStores = (stores = []) =>
  stores.flatMap((store) =>
    (store.store_checklist ?? []).map((sc) => ({
      storeCode: store.code,
      storeName: store.name,
      storeLabel: `${store.code} - ${store.name}`,
      region: store.region?.name ?? "—",
      area: store.area?.name ?? "—",
      checklistName: sc.checklist?.name ?? "—",
      storeChecklistId: sc.id,
      weeklyRecord: sc.weekly_record ?? [],
      hasPreviousOverdue: sc.has_previous_overdue ?? false,
    })),
  );

const rowStatus = (row) => {
  if (row.hasPreviousOverdue && row.weeklyRecord.length === 0)
    return "Previous Month";
  const done = row.weeklyRecord.filter((w) => w.status === "Completed").length;
  if (done >= 4) return "Done";
  return "Pending";
};

const allWeeklyRecords = (rows) =>
  rows.flatMap((r) =>
    r.weeklyRecord.map((w) => ({
      ...w,
      storeLabel: r.storeLabel,
      checklistName: r.checklistName,
    })),
  );

const baseTooltip = {
  backgroundColor: "rgba(30,20,10,0.82)",
  titleColor: "#fff",
  bodyColor: "#e0d5c8",
  borderColor: "rgba(243,121,37,0.35)",
  borderWidth: 1,
  padding: 10,
  cornerRadius: 8,
};

const baseScales = (yLabel = "") => ({
  x: { grid: { display: false }, ticks: { color: "#888" } },
  y: {
    beginAtZero: true,
    grid: { color: "rgba(150,130,100,0.12)" },
    ticks: { color: "#888", callback: yLabel ? (v) => v + yLabel : undefined },
  },
});

const MetricCard = ({ label, value, sub, subType = "neutral" }) => (
  <div className="qad-metric-card">
    <p className="qad-metric-card__label">{label}</p>
    <p className="qad-metric-card__value">{value}</p>
    {sub && (
      <p className={`qad-metric-card__sub qad-metric-card__sub--${subType}`}>
        {sub}
      </p>
    )}
  </div>
);

const ChartLegend = ({ items }) => (
  <div className="qad-legend">
    {items.map(({ color, label }) => (
      <span key={label} className="qad-legend__item">
        <span className="qad-legend__dot" style={{ background: color }} />
        {label}
      </span>
    ))}
  </div>
);

const ProgressRow = ({ label, pct, color }) => (
  <div className="qad-progress-row">
    <div className="qad-progress-row__meta">
      <span>{label}</span>
      <span style={{ color, fontWeight: 500 }}>{pct.toFixed(1)}%</span>
    </div>
    <div className="qad-progress-row__track">
      <div
        className="qad-progress-row__fill"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  </div>
);

const ChartCard = ({ title, sub, children, className = "" }) => (
  <div className={`qad-chart-card ${className}`}>
    <p className="qad-chart-card__title">{title}</p>
    {sub && <p className="qad-chart-card__sub">{sub}</p>}
    {children}
  </div>
);

const LoadingSkeleton = () => (
  <div className="qad-skeleton-wrap">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="qad-skeleton-card" />
    ))}
  </div>
);

const STATUS_CLASS = {
  Done: "badge--done",
  Completed: "badge--done",
  Pending: "badge--pending",
  "Previous Month": "badge--prev",
};
const StatusBadge = ({ val }) => (
  <span className={`qad-badge ${STATUS_CLASS[val] ?? ""}`}>{val}</span>
);

const WeeklySummaryTable = ({ rows, weekNum }) => {
  const weekData = useMemo(() => {
    return rows.map((r) => {
      const rec = r.weeklyRecord.find((w) => w.week === weekNum);
      if (rec) {
        return {
          id: `${r.storeChecklistId}-w${weekNum}`,
          store: r.storeLabel,
          checklist: r.checklistName,
          grade: rec.weekly_grade
            ? `${parseFloat(rec.weekly_grade).toFixed(0)}%`
            : "—",
          doneOn: rec.attachment_uploaded_at
            ? new Date(rec.attachment_uploaded_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—",
          status: rec.status === "Completed" ? "Done" : rec.status,
        };
      }
      return {
        id: `${r.storeChecklistId}-w${weekNum}-p`,
        store: r.storeLabel,
        checklist: r.checklistName,
        grade: "—",
        doneOn: "—",
        status:
          r.hasPreviousOverdue && r.weeklyRecord.length === 0
            ? "Previous Month"
            : "Pending",
      };
    });
  }, [rows, weekNum]);

  return (
    <div className="qad-week-summary">
      <p className="qad-week-summary__title">Week {weekNum} summary</p>
      <div className="qad-week-summary__table-wrap">
        <table className="qad-week-summary__table">
          <thead>
            <tr>
              <th>Store</th>
              <th>Grade</th>
              <th>Done on</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {weekData.length === 0 ? (
              <tr>
                <td colSpan={4} className="qad-week-summary__empty">
                  No records
                </td>
              </tr>
            ) : (
              weekData.map((row) => (
                <tr key={row.id}>
                  <td>{row.store}</td>
                  <td>{row.grade}</td>
                  <td>{row.doneOn}</td>
                  <td>
                    <StatusBadge val={row.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const WeeklyView = ({ rows, month, year }) => {
  const weeklyRecords = useMemo(() => allWeeklyRecords(rows), [rows]);
  const storesWithRecs = useMemo(
    () => rows.filter((r) => r.weeklyRecord.length > 0),
    [rows],
  );
  const [selectedId, setSelectedId] = useState(null);

  const activeStore = useMemo(() => {
    if (selectedId)
      return (
        rows.find((r) => r.storeChecklistId === selectedId) ?? storesWithRecs[0]
      );
    return storesWithRecs[0] ?? null;
  }, [selectedId, rows, storesWithRecs]);

  const lineData = useMemo(() => {
    const gradeByWeek = Array(4).fill(null);
    (activeStore?.weeklyRecord ?? []).forEach((w) => {
      if (w.week >= 1 && w.week <= 4)
        gradeByWeek[w.week - 1] = parseFloat(w.weekly_grade ?? 0);
    });
    return {
      labels: WEEK_LABELS,
      datasets: [
        {
          label: "Grade (%)",
          data: gradeByWeek,
          borderColor: C_ORANGE,
          backgroundColor: "rgba(243,121,37,0.09)",
          tension: 0.35,
          fill: true,
          pointRadius: gradeByWeek.map((g) => (g !== null ? 6 : 0)),
          pointBackgroundColor: gradeByWeek.map((g) =>
            g !== null ? C_ORANGE : "transparent",
          ),
          spanGaps: false,
        },
      ],
    };
  }, [activeStore]);

  const completedWeeks = weeklyRecords.filter(
    (w) => w.status === "Completed",
  ).length;
  const totalSlots = rows.length * 4;
  const bestRecord = weeklyRecords.reduce(
    (best, w) =>
      parseFloat(w.weekly_grade ?? 0) > parseFloat(best?.weekly_grade ?? -1)
        ? w
        : best,
    null,
  );
  const pendingCount = rows.filter((r) => rowStatus(r) === "Pending").length;

  return (
    <div className="qad-view">
      <div className="qad-metric-row">
        <MetricCard
          label="Total weekly slots"
          value={totalSlots}
          sub={`${MONTHS[month - 1]} ${year}`}
        />
        <MetricCard
          label="Completed weeks"
          value={`${completedWeeks} / ${totalSlots}`}
          sub={activeStore?.storeLabel ?? "—"}
          subType="up"
        />
        <MetricCard
          label="Best week grade"
          value={
            bestRecord
              ? `${parseFloat(bestRecord.weekly_grade).toFixed(1)}%`
              : "—"
          }
          sub={
            bestRecord
              ? `Week ${bestRecord.week} · ${bestRecord.storeLabel}`
              : "—"
          }
          subType="up"
        />
        <MetricCard
          label="Pending this month"
          value={pendingCount}
          sub={pendingCount > 0 ? "stores not yet complete" : "All up to date"}
          subType={pendingCount > 0 ? "warn" : "up"}
        />
      </div>

      <ChartCard
        title={
          storesWithRecs.length > 0 ? (
            <select
              className="qad-store-select__select qad-store-select__select--inline"
              value={activeStore?.storeChecklistId ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}>
              {storesWithRecs.map((r) => (
                <option key={r.storeChecklistId} value={r.storeChecklistId}>
                  {r.storeLabel} — {r.checklistName}
                </option>
              ))}
            </select>
          ) : (
            "Weekly grade trend"
          )
        }
        sub={
          activeStore
            ? `Weekly grade trend · ${activeStore.checklistName}`
            : "No completed records yet"
        }
        className="qad-chart-card--full">
        <div className="qad-chart-wrap">
          <Line
            data={lineData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: baseTooltip },
              scales: {
                ...baseScales("%"),
                y: { ...baseScales("%").y, min: 0, max: 110 },
              },
            }}
          />
        </div>
      </ChartCard>

      <div className="qad-weekly-summaries">
        {[1, 2, 3, 4].map((wk) => (
          <WeeklySummaryTable key={wk} rows={rows} weekNum={wk} />
        ))}
      </div>
    </div>
  );
};

const MonthlyView = ({ rows, month, year }) => {
  const storeNames = useMemo(
    () => [...new Set(rows.map((r) => r.storeName))],
    [rows],
  );
  const weeklyRecords = useMemo(() => allWeeklyRecords(rows), [rows]);

  const storeStats = useMemo(
    () =>
      storeNames.map((name) => {
        const sr = rows.filter((r) => r.storeName === name);
        const done = sr.filter((r) => rowStatus(r) === "Done").length;
        const pending = sr.filter((r) => rowStatus(r) === "Pending").length;
        const prev = sr.filter((r) => rowStatus(r) === "Previous Month").length;
        const grades = sr.flatMap((r) =>
          r.weeklyRecord.map((w) => parseFloat(w.weekly_grade ?? 0)),
        );
        const avg = grades.length
          ? grades.reduce((a, b) => a + b, 0) / grades.length
          : 0;
        return { name, done, pending, prev, avgGrade: avg };
      }),
    [rows, storeNames],
  );

  const groupedBar = {
    labels: storeNames,
    datasets: [
      {
        label: "Done",
        data: storeStats.map((s) => s.done),
        backgroundColor: C_ORANGE,
        borderRadius: 4,
      },
      {
        label: "Pending",
        data: storeStats.map((s) => s.pending),
        backgroundColor: C_AMBER,
        borderRadius: 4,
      },
      {
        label: "Previous month",
        data: storeStats.map((s) => s.prev),
        backgroundColor: C_RED,
        borderRadius: 4,
      },
    ],
  };

  const radarColors = [C_ORANGE, C_RED, C_AMBER, C_GREEN];
  const radar = {
    labels: ["W1", "W2", "W3", "W4"],
    datasets: storeNames.map((name, i) => {
      const sr = rows.filter((r) => r.storeName === name);
      const weekGrades = [1, 2, 3, 4].map((wk) => {
        const recs = sr.flatMap((r) =>
          r.weeklyRecord.filter((w) => w.week === wk),
        );
        return recs.length
          ? recs.reduce((a, w) => a + parseFloat(w.weekly_grade ?? 0), 0) /
              recs.length
          : 0;
      });
      const c = radarColors[i % radarColors.length];
      return {
        label: name,
        data: weekGrades,
        borderColor: c,
        backgroundColor: `${c}22`,
        pointBackgroundColor: c,
      };
    }),
  };

  const totalRows = rows.length;
  const doneCount = rows.filter((r) => rowStatus(r) === "Done").length;
  const pendCount = rows.filter((r) => rowStatus(r) === "Pending").length;
  const prevCount = rows.filter(
    (r) => rowStatus(r) === "Previous Month",
  ).length;
  const allGrades = weeklyRecords.map((w) => parseFloat(w.weekly_grade ?? 0));
  const avgGrade = allGrades.length
    ? allGrades.reduce((a, b) => a + b, 0) / allGrades.length
    : 0;

  return (
    <div className="qad-view">
      <div className="qad-metric-row">
        <MetricCard
          label="Checklists this month"
          value={totalRows}
          sub={`${pendCount} pending`}
          subType={pendCount > 0 ? "warn" : "up"}
        />
        <MetricCard
          label="Done"
          value={doneCount}
          sub={`${totalRows ? ((doneCount / totalRows) * 100).toFixed(0) : 0}% completion`}
          subType="up"
        />
        <MetricCard
          label="Avg grade"
          value={avgGrade > 0 ? `${avgGrade.toFixed(1)}%` : "—"}
          sub={
            avgGrade > 0 ? "based on completed weeks" : "No graded weeks yet"
          }
          subType={avgGrade >= 70 ? "up" : "down"}
        />
        <MetricCard
          label="Previous month"
          value={prevCount}
          sub={prevCount > 0 ? "stores with overdue" : "None overdue"}
          subType={prevCount > 0 ? "down" : "up"}
        />
      </div>

      <div className="qad-chart-row qad-chart-row--wide">
        <ChartCard
          title={`Checklist completion by store — ${MONTHS[month - 1]} ${year}`}>
          <ChartLegend
            items={[
              { color: C_ORANGE, label: "Done" },
              { color: C_AMBER, label: "Pending" },
              { color: C_RED, label: "Previous month" },
            ]}
          />
          <div className="qad-chart-wrap">
            <Bar
              data={groupedBar}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: baseTooltip },
                scales: { ...baseScales() },
              }}
            />
          </div>
        </ChartCard>

        <ChartCard title="Store grade comparison by week">
          <div className="qad-chart-wrap">
            <Radar
              data={radar}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: baseTooltip },
                scales: {
                  r: {
                    min: 0,
                    max: 100,
                    ticks: { display: false },
                    grid: { color: "rgba(150,130,100,0.15)" },
                  },
                },
              }}
            />
          </div>
        </ChartCard>
      </div>

      <ChartCard
        title="Store performance this month"
        className="qad-chart-card--full">
        <div className="qad-progress-list">
          {storeStats.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              No graded data this month.
            </p>
          )}
          {[...storeStats]
            .sort((a, b) => b.avgGrade - a.avgGrade)
            .map((r) => (
              <ProgressRow
                key={r.name}
                label={r.name}
                pct={r.avgGrade}
                color={
                  r.avgGrade >= 80
                    ? C_GREEN
                    : r.avgGrade >= 60
                      ? C_ORANGE
                      : r.avgGrade > 0
                        ? C_AMBER
                        : C_RED
                }
              />
            ))}
        </div>
      </ChartCard>
    </div>
  );
};

const YearlyView = ({ rowsByMonth, year }) => {
  const donePerMonth = rowsByMonth.map(
    (r) => r.filter((x) => rowStatus(x) === "Done").length,
  );
  const pendingPerMonth = rowsByMonth.map(
    (r) => r.filter((x) => rowStatus(x) === "Pending").length,
  );
  const prevPerMonth = rowsByMonth.map(
    (r) => r.filter((x) => rowStatus(x) === "Previous Month").length,
  );
  const avgGradePerMonth = rowsByMonth.map((rows) => {
    const g = allWeeklyRecords(rows).map((w) =>
      parseFloat(w.weekly_grade ?? 0),
    );
    return g.length ? g.reduce((a, b) => a + b, 0) / g.length : null;
  });

  const stackedBar = {
    labels: MONTHS,
    datasets: [
      {
        label: "Done",
        data: donePerMonth,
        backgroundColor: C_ORANGE,
        borderRadius: 3,
        stack: "s",
      },
      {
        label: "Pending",
        data: pendingPerMonth,
        backgroundColor: C_AMBER,
        borderRadius: 3,
        stack: "s",
      },
      {
        label: "Previous month",
        data: prevPerMonth,
        backgroundColor: C_RED,
        borderRadius: 3,
        stack: "s",
      },
    ],
  };

  const totalDone = donePerMonth.reduce((a, b) => a + b, 0);
  const totalPending = pendingPerMonth.reduce((a, b) => a + b, 0);
  const totalPrev = prevPerMonth.reduce((a, b) => a + b, 0);
  const totalAll = totalDone + totalPending + totalPrev;

  const donut = {
    labels: ["Done", "Pending", "Previous month"],
    datasets: [
      {
        data: [totalDone, totalPending, totalPrev],
        backgroundColor: [C_ORANGE, C_AMBER, C_RED],
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const gradeLine = {
    labels: MONTHS,
    datasets: [
      {
        label: "Avg grade",
        data: avgGradePerMonth,
        borderColor: C_ORANGE,
        backgroundColor: "rgba(243,121,37,0.08)",
        tension: 0.4,
        fill: true,
        pointRadius: avgGradePerMonth.map((g) => (g !== null ? 5 : 0)),
        pointBackgroundColor: C_ORANGE,
        spanGaps: false,
      },
    ],
  };

  const allStores = [...new Set(rowsByMonth.flat().map((r) => r.storeName))];
  const pct = totalAll > 0 ? ((totalDone / totalAll) * 100).toFixed(0) : 0;
  const allGrades = rowsByMonth.flatMap((rows) =>
    allWeeklyRecords(rows).map((w) => parseFloat(w.weekly_grade ?? 0)),
  );
  const overallAvg = allGrades.length
    ? (allGrades.reduce((a, b) => a + b, 0) / allGrades.length).toFixed(1)
    : null;

  return (
    <div className="qad-view">
      <div className="qad-metric-row">
        <MetricCard
          label="Total checklists"
          value={totalAll}
          sub={`${year} year to date`}
        />
        <MetricCard
          label="Completion rate"
          value={`${pct}%`}
          sub={`${totalDone} of ${totalAll} done`}
          subType={Number(pct) >= 70 ? "up" : "down"}
        />
        <MetricCard
          label="Avg grade"
          value={overallAvg ? `${overallAvg}%` : "—"}
          sub="across all completed weeks"
          subType={parseFloat(overallAvg) >= 70 ? "up" : "down"}
        />
        <MetricCard
          label="Stores"
          value={allStores.length}
          sub={allStores.join(" · ")}
        />
      </div>

      <div className="qad-chart-row qad-chart-row--wide">
        <ChartCard title={`Monthly completion rate — ${year}`}>
          <ChartLegend
            items={[
              { color: C_ORANGE, label: "Done" },
              { color: C_AMBER, label: "Pending" },
              { color: C_RED, label: "Previous month" },
            ]}
          />
          <div className="qad-chart-wrap">
            <Bar
              data={stackedBar}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { ...baseTooltip, mode: "index" },
                },
                scales: {
                  x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: { color: "#888" },
                  },
                  y: { stacked: true, ...baseScales().y },
                },
              }}
            />
          </div>
        </ChartCard>

        <ChartCard title="Overall status breakdown">
          <div className="qad-chart-wrap qad-chart-wrap--donut">
            <Doughnut
              data={donut}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "68%",
                plugins: { legend: { display: false }, tooltip: baseTooltip },
              }}
            />
          </div>
          <ChartLegend
            items={[
              {
                color: C_ORANGE,
                label: `Done ${totalAll > 0 ? ((totalDone / totalAll) * 100).toFixed(0) : 0}%`,
              },
              {
                color: C_AMBER,
                label: `Pending ${totalAll > 0 ? ((totalPending / totalAll) * 100).toFixed(0) : 0}%`,
              },
              {
                color: C_RED,
                label: `Prev. ${totalAll > 0 ? ((totalPrev / totalAll) * 100).toFixed(0) : 0}%`,
              },
            ]}
          />
        </ChartCard>
      </div>

      <ChartCard
        title={`Avg grade per month — ${year}`}
        className="qad-chart-card--full">
        <div className="qad-chart-wrap qad-chart-wrap--short">
          <Line
            data={gradeLine}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: baseTooltip },
              scales: {
                ...baseScales("%"),
                y: { ...baseScales("%").y, min: 0, max: 110 },
              },
            }}
          />
        </div>
      </ChartCard>
    </div>
  );
};

const YearlyWrapper = ({ year }) => {
  const queries = [
    useGetQaChecklistsQuery({ month: 1, year }),
    useGetQaChecklistsQuery({ month: 2, year }),
    useGetQaChecklistsQuery({ month: 3, year }),
    useGetQaChecklistsQuery({ month: 4, year }),
    useGetQaChecklistsQuery({ month: 5, year }),
    useGetQaChecklistsQuery({ month: 6, year }),
    useGetQaChecklistsQuery({ month: 7, year }),
    useGetQaChecklistsQuery({ month: 8, year }),
    useGetQaChecklistsQuery({ month: 9, year }),
    useGetQaChecklistsQuery({ month: 10, year }),
    useGetQaChecklistsQuery({ month: 11, year }),
    useGetQaChecklistsQuery({ month: 12, year }),
  ];

  const isLoading = queries.some((q) => q.isLoading);
  const rowsByMonth = queries.map((q) =>
    flattenStores(q.data?.data?.data ?? []),
  );

  if (isLoading) return <LoadingSkeleton />;
  return <YearlyView rowsByMonth={rowsByMonth} year={year} />;
};

const TABS = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

const Dashboard = () => {
  const now = new Date();
  const [activeTab, setActiveTab] = useState("weekly");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = useGetQaChecklistsQuery({ month, year });
  const rows = useMemo(() => flattenStores(data?.data?.data ?? []), [data]);

  const renderView = () => {
    if (activeTab === "yearly") return <YearlyWrapper year={year} />;
    if (isLoading) return <LoadingSkeleton />;
    if (activeTab === "weekly")
      return <WeeklyView rows={rows} month={month} year={year} />;
    if (activeTab === "monthly")
      return <MonthlyView rows={rows} month={month} year={year} />;
    return null;
  };

  return (
    <div className="qad">
      <div className="qad__header">
        <div className="qad__header-left">
          <div>
            <h1 className="qad__title">Aurora Store — QA Dashboard</h1>
            <p className="qad__subtitle">
              QA Checklist monitoring · {MONTHS[month - 1]} {year}
            </p>
          </div>
        </div>

        <div className="qad__filters">
          {activeTab !== "yearly" && (
            <select
              className="qad__filter-select"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          )}
          <select
            className="qad__filter-select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}>
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="qad__tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`qad__tab${activeTab === t.key ? " qad__tab--active" : ""}`}
            onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="qad__body">{renderView()}</div>
    </div>
  );
};

export default Dashboard;
