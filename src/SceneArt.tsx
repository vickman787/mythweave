import { useId } from "react";
/** Only illustration regions are exposed. All interface text and controls are real HTML. */
export function SceneArt({
  kind = "landing",
  className = "",
}: {
  kind?: "landing" | "dashboard" | "recap" | "mobile";
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const crops = {
    landing: "550 70 730 580",
    dashboard: "700 145 410 360",
    recap: "0 245 838 650",
    mobile: "120 395 400 215",
  };
  const [x, y, width, height] = crops[kind].split(" ").map(Number);
  return (
    <svg
      className={`scene-art scene-art-${kind} ${className}`}
      viewBox={crops[kind]}
      aria-hidden="true"
      preserveAspectRatio={
        kind === "landing" ? "xMidYMid meet" : "xMidYMid slice"
      }
    >
      <defs>
        <clipPath id={id}>
          {kind === "dashboard" ? (
            <path d="M700 145H1110V505H850V340H700Z" />
          ) : (
            <rect x={x} y={y} width={width} height={height} />
          )}
        </clipPath>
      </defs>
      <image
        href={`/art/${kind}-source.png`}
        width="1600"
        height="899"
        clipPath={`url(#${id})`}
      />
    </svg>
  );
}
