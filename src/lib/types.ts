export interface ProfileMissing {
  column: string;
  count: number;
  pct: number;
}

export interface ProfileNumericSummary {
  column: string;
  mean: number;
  std: number;
  min: number;
  q25: number;
  q50: number;
  q75: number;
  max: number;
}

export interface ProfileCategoricalSummary {
  column: string;
  unique: number;
  top5: { value: string; count: number }[];
}

export interface ProfilePayload {
  rowCount: number;
  columnCount: number;
  columns: string[];
  dtypes: { column: string; dtype: string }[];
  dtypeGroups: Record<string, number>;
  missing: ProfileMissing[];
  numericSummary: ProfileNumericSummary[];
  categoricalSummary: ProfileCategoricalSummary[];
  targetCandidate: string | null;
  limits?: { maxUploadBytes?: number };
}

export interface HistogramBlock {
  column: string;
  bins: number[];
  counts: number[];
}

export interface TopBarBlock {
  column: string;
  items: { label: string; count: number }[];
}

export interface PieBlock {
  column: string;
  items: { label: string; count: number }[];
}

export interface ScatterBlock {
  x: string;
  y: string;
  points: [number, number][];
}

export interface BinaryStackItem {
  column: string;
  zero: number;
  one: number;
  meanTargetIfZero?: number | null;
  meanTargetIfOne?: number | null;
}

export interface CorrelationPayload {
  columns: string[];
  matrix: (number | null)[][];
}

export interface TargetDistPayload {
  column: string;
  sortedIndex: { x: number[]; y: number[] };
  bins: number[];
  counts: number[];
}

export interface LineSeriesBlock {
  column: string;
  times: string[];
  values: (number | null)[];
  metric: string | null;
}

export interface EdaPayload {
  histograms: HistogramBlock[];
  topBars: TopBarBlock[];
  pies: PieBlock[];
  scatter: ScatterBlock[];
  binaryStack: BinaryStackItem[];
  correlation: CorrelationPayload;
  targetDist: TargetDistPayload | null;
  lineSeries: LineSeriesBlock[];
  meta: { numericColumnsConsidered: string[]; categoricalColumnsConsidered: string[] };
}

export interface InsightPayload {
  highlights: string[];
  anomalies: string[];
  actions: string[];
  model?: string;
}
