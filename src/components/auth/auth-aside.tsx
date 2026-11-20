import { CircleCheck } from "lucide-react";

const POINTS = [
  "Readings recorded every two seconds",
  "Plain-language signal and fix labels",
  "Session history saved on this device",
];

export function AuthAside({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="hidden max-w-md lg:block">
      <h2 className="text-2xl font-semibold tracking-tight text-balance">
        {title}
      </h2>
      <p className="mt-3 text-sm text-muted-foreground">{body}</p>
      <ul className="mt-6 space-y-3">
        {POINTS.map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-sm">
            <CircleCheck
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
