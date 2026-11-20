import type { Reading } from "@/lib/types";

const WIDTH = 800;
const HEIGHT = 210;
const PAD = 20;
const MIN_SPAN = 0.00015;

type TrackPoint = {
  index: number;
  lat: number;
  lon: number;
};

type ProjectedPoint = TrackPoint & {
  x: number;
  y: number;
};

function project(points: TrackPoint[]): ProjectedPoint[] {
  if (points.length === 0) return [];

  const latitudes = points.map((point) => point.lat);
  const longitudes = points.map((point) => point.lon);
  const meanLat =
    (latitudes.reduce((sum, value) => sum + value, 0) / latitudes.length) *
    (Math.PI / 180);
  const lonScale = Math.cos(meanLat);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);

  const latSpan = Math.max(maxLat - minLat, MIN_SPAN);
  const lonSpan = Math.max((maxLon - minLon) * lonScale, MIN_SPAN);
  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;

  const innerWidth = WIDTH - PAD * 2;
  const innerHeight = HEIGHT - PAD * 2;
  const scale = Math.min(innerWidth / lonSpan, innerHeight / latSpan);
  const offsetX = (WIDTH - lonSpan * scale) / 2;
  const offsetY = (HEIGHT - latSpan * scale) / 2;

  return points.map((point) => ({
    ...point,
    x: offsetX + ((point.lon - centerLon) * lonScale + lonSpan / 2) * scale,
    y: offsetY + ((centerLat - point.lat) + latSpan / 2) * scale,
  }));
}

function segments(points: ProjectedPoint[]): ProjectedPoint[][] {
  const result: ProjectedPoint[][] = [];
  let current: ProjectedPoint[] = [];

  for (const point of points) {
    if (current.length > 0 && point.index !== current[current.length - 1].index + 1) {
      result.push(current);
      current = [];
    }
    current.push(point);
  }

  if (current.length > 0) result.push(current);
  return result;
}

function polyline(points: ProjectedPoint[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export function TrackPlot({
  readings,
  activeIndex,
}: {
  readings: Reading[];
  activeIndex?: number;
}) {
  const points = project(
    readings.flatMap((reading, index) =>
      reading.pvt.lat !== null && reading.pvt.lon !== null
        ? [{ index, lat: reading.pvt.lat, lon: reading.pvt.lon }]
        : [],
    ),
  );

  if (points.length === 0) {
    return (
      <p className="py-8 text-sm text-muted-foreground">
        No position fixes were recorded, so there is no track to draw.
      </p>
    );
  }

  const activePointIndex =
    activeIndex === undefined
      ? points.length - 1
      : points.reduce(
          (best, point, index) =>
            point.index <= activeIndex ? index : best,
          0,
        );
  const active = points[activePointIndex];
  const start = points[0];
  const travelled = points.slice(0, activePointIndex + 1);
  const showFuture = activePointIndex < points.length - 1;
  const hasGap = points.some(
    (point, index) => index > 0 && point.index !== points[index - 1].index + 1,
  );

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Simulated walking track with ${points.length} position ${
          points.length === 1 ? "fix" : "fixes"
        }`}
      >
        {showFuture ? (
          <g className="stroke-border" fill="none">
            {segments(points).map((segment, index) => (
              <polyline
                key={index}
                points={polyline(segment)}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
          </g>
        ) : null}

        {points.slice(1).map((point, index) => {
          const previous = points[index];
          if (point.index === previous.index + 1) return null;

          return (
            <line
              key={`gap-${point.index}`}
              x1={previous.x}
              y1={previous.y}
              x2={point.x}
              y2={point.y}
              className="stroke-muted-foreground"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          );
        })}

        <g className="stroke-foreground" fill="none">
          {segments(travelled).map((segment, index) => (
            <polyline
              key={index}
              points={polyline(segment)}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        </g>

        <circle
          cx={start.x}
          cy={start.y}
          r={4}
          className="fill-background stroke-foreground"
          strokeWidth={2}
        />

        <circle
          cx={active.x}
          cy={active.y}
          r={10}
          className="fill-foreground/10"
        />
        <circle
          cx={active.x}
          cy={active.y}
          r={4.5}
          className="fill-foreground"
        />
      </svg>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block size-2.5 rounded-full border-2 border-foreground bg-background"
          />
          Start
        </span>
        {hasGap ? (
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block w-5 border-t border-dashed border-muted-foreground"
            />
            No fix between readings
          </span>
        ) : null}
      </div>
    </div>
  );
}
