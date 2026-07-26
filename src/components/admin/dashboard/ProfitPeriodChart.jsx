import { BarChart3, CalendarDays, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const profitFormatter = new Intl.NumberFormat("ar-EG-u-nu-latn", {
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
  style: "currency",
});

const compactProfitFormatter = new Intl.NumberFormat("ar-EG-u-nu-latn", {
  maximumFractionDigits: 1,
  notation: "compact",
});

function formatProfit(value) {
  return value === null || value === undefined ? "غير متاح" : profitFormatter.format(Number(value) || 0);
}

export default function ProfitPeriodChart({
  loading = false,
  range,
  series = [],
  total = null,
}) {
  const availablePoints = useMemo(
    () => series.filter((point) => Number.isFinite(point.value)),
    [series],
  );
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    setActiveId(availablePoints.at(-1)?.id || "");
  }, [availablePoints]);

  const chart = useMemo(() => {
    if (!availablePoints.length) return null;

    const values = availablePoints.map((point) => point.value);
    const minimum = Math.min(0, ...values);
    const maximum = Math.max(minimum === 0 && Math.max(...values) === 0 ? 1 : 0, ...values);
    const span = Math.max(maximum - minimum, 1);
    const zeroPosition = ((maximum - 0) / span) * 100;
    const highestPoint = availablePoints.reduce(
      (highest, point) => (point.value > highest.value ? point : highest),
      availablePoints[0],
    );

    return {
      average: values.reduce((sum, value) => sum + value, 0) / values.length,
      highestPoint,
      maximum,
      minimum,
      points: series.map((point) => {
        if (!Number.isFinite(point.value)) return { ...point, available: false };
        const valuePosition = ((maximum - point.value) / span) * 100;
        return {
          ...point,
          available: true,
          barHeight: Math.max(2.5, Math.abs(valuePosition - zeroPosition)),
          barTop: Math.min(valuePosition, zeroPosition),
          dotTop: valuePosition,
          positive: point.value >= 0,
        };
      }),
      zeroPosition,
    };
  }, [availablePoints, series]);

  const activePoint = chart?.points.find((point) => point.id === activeId && point.available)
    || availablePoints.at(-1)
    || null;
  const rangeLabel = range?.label || "الفترة المحددة";

  return (
    <section className="admin-profit-chart-panel" aria-labelledby="admin-profit-chart-title">
      <span className="admin-profit-chart-ambient admin-profit-chart-ambient-one" aria-hidden="true" />
      <span className="admin-profit-chart-ambient admin-profit-chart-ambient-two" aria-hidden="true" />

      <header className="admin-profit-chart-header">
        <div className="admin-profit-chart-heading">
          <span className="admin-profit-chart-heading-icon"><BarChart3 /></span>
          <div>
            <span className="admin-profit-chart-kicker"><Sparkles /> تحليل مباشر</span>
            <h2 id="admin-profit-chart-title">رسم أرباح الفترة المحددة</h2>
            <p>يتحدّث تلقائيًا عند تغيير فلتر التاريخ.</p>
          </div>
        </div>
        <span className="admin-profit-chart-range"><CalendarDays /> {rangeLabel}</span>
      </header>

      {loading ? (
        <div className="admin-profit-chart-loading" aria-label="جارٍ تحميل بيانات الأرباح">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      ) : chart ? (
        <>
          <div className="admin-profit-chart-stats">
            <article className="is-total">
              <span>صافي أرباح الفترة</span>
              <strong dir="ltr">{formatProfit(total)}</strong>
            </article>
            <article>
              <span>متوسط النقطة</span>
              <strong dir="ltr">{formatProfit(chart.average)}</strong>
            </article>
            <article>
              <span>أعلى ربح</span>
              <strong dir="ltr">{formatProfit(chart.highestPoint.value)}</strong>
              <small>{chart.highestPoint.label}</small>
            </article>
          </div>

          <div className="admin-profit-chart-active" aria-live="polite">
            <span>{activePoint?.label}</span>
            <strong dir="ltr">{formatProfit(activePoint?.value)}</strong>
          </div>

          <div className="admin-profit-chart-canvas">
            <div className="admin-profit-chart-y-axis" aria-hidden="true">
              <span>{compactProfitFormatter.format(chart.maximum)} $</span>
              <span>{compactProfitFormatter.format((chart.maximum + chart.minimum) / 2)} $</span>
              <span>{compactProfitFormatter.format(chart.minimum)} $</span>
            </div>
            <div className="admin-profit-chart-plot" style={{ "--profit-zero": `${chart.zeroPosition}%` }}>
              <span className="admin-profit-chart-grid-line is-top" aria-hidden="true" />
              <span className="admin-profit-chart-grid-line is-middle" aria-hidden="true" />
              <span className="admin-profit-chart-grid-line is-bottom" aria-hidden="true" />
              <span className="admin-profit-chart-zero-line" aria-hidden="true" />

              <div
                className="admin-profit-chart-columns"
                style={{ gridTemplateColumns: `repeat(${chart.points.length}, minmax(0, 1fr))` }}
              >
                {chart.points.map((point) => (
                  <button
                    key={point.id}
                    type="button"
                    disabled={!point.available}
                    onClick={() => point.available && setActiveId(point.id)}
                    onFocus={() => point.available && setActiveId(point.id)}
                    onPointerEnter={() => point.available && setActiveId(point.id)}
                    className={`admin-profit-chart-column ${point.id === activePoint?.id ? "is-active" : ""} ${point.positive ? "is-positive" : "is-negative"}`}
                    style={point.available ? {
                      "--profit-bar-height": `${point.barHeight}%`,
                      "--profit-bar-top": `${point.barTop}%`,
                      "--profit-dot-top": `${point.dotTop}%`,
                    } : undefined}
                    aria-label={point.available ? `${point.label}: ${formatProfit(point.value)}` : `${point.label}: غير متاح`}
                  >
                    {point.available ? (
                      <>
                        <span className="admin-profit-chart-bar" />
                        <span className="admin-profit-chart-dot" />
                      </>
                    ) : (
                      <span className="admin-profit-chart-missing">—</span>
                    )}
                    <span className="admin-profit-chart-date">{point.shortLabel}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="admin-profit-chart-note">
            <TrendingUp />
            كل عمود يمثل صافي الربح الحقيقي لنقطة زمنية داخل الفترة المختارة.
          </p>
        </>
      ) : (
        <div className="admin-profit-chart-empty">
          <BarChart3 />
          <strong>لا توجد بيانات أرباح قابلة للرسم</strong>
          <span>جرّب اختيار فترة أخرى من فلتر التاريخ.</span>
        </div>
      )}
    </section>
  );
}
