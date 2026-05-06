import type { EdaPayload } from "@/lib/types";
import { BinaryStackBlockChart } from "./BinaryStackBlock";
import { CorrelationHeatmap } from "./CorrelationHeatmap";
import { HistogramBlockChart } from "./HistogramBlock";
import { LineSeriesBlockChart } from "./LineSeriesBlock";
import { PieBlockChart } from "./PieBlock";
import { ScatterBlockChart } from "./ScatterBlock";
import { TargetCharts } from "./TargetCharts";
import { TopBarBlockChart } from "./TopBarBlock";

export function ChartGrid({ eda }: { eda: EdaPayload }) {
  return (
    <div className="space-y-6">
      {eda.targetDist ? <TargetCharts dist={eda.targetDist} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        {eda.histograms.map((h) => (
          <HistogramBlockChart key={h.column} block={h} />
        ))}
        {eda.topBars.map((b) => (
          <TopBarBlockChart key={b.column} block={b} />
        ))}
        {eda.pies.map((p) => (
          <PieBlockChart key={p.column} block={p} />
        ))}
        {eda.scatter.map((s) => (
          <ScatterBlockChart key={`${s.x}-${s.y}`} block={s} />
        ))}
        {eda.lineSeries.map((l) => (
          <LineSeriesBlockChart key={l.column} block={l} />
        ))}
      </div>

      {eda.binaryStack.length ? <BinaryStackBlockChart rows={eda.binaryStack} /> : null}

      {eda.correlation.columns.length >= 2 ? <CorrelationHeatmap corr={eda.correlation} /> : null}
    </div>
  );
}
