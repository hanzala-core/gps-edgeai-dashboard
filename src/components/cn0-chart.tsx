import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatTime } from "@/lib/format";
import type { Reading } from "@/lib/types";

const WIDTH = 640;
const HEIGHT = 180;
const PAD = { top: 12, right: 12, bottom: 26, left: 36 };
const MIN = 15;
const MAX = 55;
const THRESHOLD = 30;

type Point = { at: string; value: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function averageCn0(reading: Reading): Point | null {
  const values = reading.satellites
    .map((satellite) => satellite.cn0)
    .filter((value): value is number => value !== null);

  if (values.length === 0) return null;

  return {
    at: reading.observedAt,
    value: values.reduce((sum, value) => sum + value, 0) / values.length,
  };
}

export function Cn0Chart({
  readings,
  activeIndex,
}: {
  readings: Reading[];
  activeIndex?: number;
}) {
  const series = readings
    .map(averageCn0)
    .filter((point): point is Point => point !== null);

  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;

  const x = (index: number) =>
    PAD.left +
    (series.length <= 1 ? 0 : (index / (series.length - 1)) * innerWidth);
  const y = (value: number) =>
    PAD.top + (1 - (clamp(value, MIN, MAX) - MIN) / (MAX - MIN)) * innerHeight;

  const selectedIndex =
    activeIndex === undefined
      ? series.length - 1
      : Math.min(Math.max(activeIndex, 0), series.length - 1);
  const selected = series[selectedIndex];

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Average C/N₀</CardTitle>
        <CardDescription>
          Latest {series.length} of {readings.length} readings
        </CardDescription>
      </CardHeader>
      <CardContent>
        {series.length < 2 ? (
          <p className="py-6 text-sm text-muted-foreground">
            Waiting for at least two readings.
          </p>
        ) : (
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="h-auto w-full"
            role="img"
            aria-label="Average carrier-to-noise density per reading"
          >
            {[20, 30, 40, 50].map((tick) => (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={WIDTH - PAD.right}
                  y1={y(tick)}
                  y2={y(tick)}
                  className="stroke-border"
                  strokeWidth={1}
                  strokeDasharray={tick === THRESHOLD ? "4 4" : undefined}
                />
                <text
                  x={PAD.left - 6}
                  y={y(tick) + 3}
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px]"
                >
                  {tick}
                </text>
              </g>
            ))}

            <polyline
              points={series.map((point, index) => `${x(index)},${y(point.value)}`).join(" ")}
              fill="none"
              className="stroke-foreground"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            <circle
              cx={x(series.length - 1)}
              cy={y(series[series.length - 1].value)}
              r={3}
              className="fill-foreground"
            />

            {selected ? (
              <g>
                <line
                  x1={x(selectedIndex)}
                  x2={x(selectedIndex)}
                  y1={PAD.top}
                  y2={HEIGHT - PAD.bottom}
                  className="stroke-muted-foreground"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={x(selectedIndex)}
                  cy={y(selected.value)}
                  r={4}
                  className="fill-foreground stroke-background"
                  strokeWidth={2}
                />
              </g>
            ) : null}

            <text
              x={PAD.left}
              y={HEIGHT - 6}
              className="fill-muted-foreground text-[10px]"
            >
              {formatTime(series[0].at)}
            </text>
            <text
              x={WIDTH - PAD.right}
              y={HEIGHT - 6}
              textAnchor="end"
              className="fill-muted-foreground text-[10px]"
            >
              {formatTime(series[series.length - 1].at)}
            </text>
          </svg>
        )}
      </CardContent>
    </Card>
  );
}
