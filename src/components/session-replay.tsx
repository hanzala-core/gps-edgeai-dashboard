"use client";

import { useEffect, useState } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { Cn0Chart } from "@/components/cn0-chart";
import { PvtCard } from "@/components/pvt-card";
import { ReceiverStatusCard } from "@/components/receiver-status";
import { SatelliteTable } from "@/components/satellite-table";
import { PvtStatusBadge } from "@/components/status-badge";
import { TrackPlot } from "@/components/track-plot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatTime } from "@/lib/format";
import type { Reading } from "@/lib/types";

const STEP_MS = 900;

export function SessionReplay({ readings }: { readings: Reading[] }) {
  const last = readings.length - 1;
  const [index, setIndex] = useState(last);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2>(1);

  const atEnd = index >= last;
  const isPlaying = playing && !atEnd;

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      setIndex((current) => Math.min(current + 1, last));
    }, STEP_MS / speed);

    return () => clearTimeout(timer);
  }, [isPlaying, index, last, speed]);

  if (readings.length === 0) return null;

  const current = readings[Math.min(index, last)];

  const togglePlay = () => {
    if (isPlaying) {
      setPlaying(false);
      return;
    }

    if (atEnd) setIndex(0);
    setPlaying(true);
  };

  const step = (delta: number) => {
    setPlaying(false);
    setIndex((value) => Math.min(Math.max(value + delta, 0), last));
  };

  return (
    <div className="space-y-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Replay</CardTitle>
          <CardDescription>
            Step through the session one reading at a time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setPlaying(false);
                setIndex(0);
              }}
              aria-label="Restart replay"
            >
              <RotateCcw aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => step(-1)}
              disabled={index === 0}
              aria-label="Previous reading"
            >
              <SkipBack aria-hidden="true" />
            </Button>
            <Button type="button" size="sm" onClick={togglePlay}>
              {isPlaying ? (
                <Pause aria-hidden="true" />
              ) : (
                <Play aria-hidden="true" />
              )}
              {isPlaying ? "Pause" : "Play"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => step(1)}
              disabled={index === last}
              aria-label="Next reading"
            >
              <SkipForward aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSpeed((value) => (value === 1 ? 2 : 1))}
              aria-label={`Playback speed ${speed} times`}
            >
              {speed}×
            </Button>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={last}
              step={1}
              value={index}
              onChange={(event) => {
                setPlaying(false);
                setIndex(Number(event.target.value));
              }}
              aria-label="Reading"
              aria-valuetext={`Reading ${index + 1} of ${readings.length}`}
              className="h-2 w-full cursor-pointer accent-foreground"
            />
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">
                Reading {index + 1} of {readings.length}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {formatTime(current.observedAt)}
              </span>
              <PvtStatusBadge status={current.pvt.status} />
              {current.anomaly ? (
                <Badge variant="destructive">Anomaly</Badge>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Track</CardTitle>
          <CardDescription>
            Simulated positions with no map tiles or external services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrackPlot readings={readings} activeIndex={index} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <PvtCard pvt={current.pvt} observedAt={current.observedAt} />
        <ReceiverStatusCard reading={current} />
      </div>

      <SatelliteTable satellites={current.satellites} />
      <Cn0Chart readings={readings} activeIndex={index} />
    </div>
  );
}
