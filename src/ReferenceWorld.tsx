import { useId } from "react";
/** Illustration-only crop; objective, resources and controls remain live HTML. */
export function World({
  encounter = 0,
  bridge = false,
  stones = false,
  shelter = false,
  ward = false,
  restored = false,
}: {
  encounter?: number;
  bridge?: boolean;
  stones?: boolean;
  shelter?: boolean;
  ward?: boolean;
  restored?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={`world-art scene-${encounter}`}
      viewBox="0 0 1040 545"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`The Shattered Observatory, illustrated floating ruins. ${bridge ? "A woven bridge spans the crossing. " : ""}${stones ? "Moonlit stepping stones reveal a sheltered crossing. " : ""}${shelter ? "A restored shelter protects the party. " : ""}${ward ? "A protective ward surrounds the tower. " : ""}${restored ? "The restored beacon shines." : ""}`}
    >
      <defs>
        <radialGradient id={id + "sky"}>
          <stop stopColor="#222037" />
          <stop offset="1" stopColor="#0d1125" />
        </radialGradient>
        <filter id={id + "blur"}>
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <filter id={id + "glow"}>
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <clipPath id={id + "art"}>
          <path d="M0 210H340V0H1040V545H0Z" />
        </clipPath>
        <mask id={id + "crossing"}>
          <rect width="1040" height="545" fill="white" />
          {!bridge && (
            <path
              d="M455 335Q650 230 905 165"
              fill="none"
              stroke="black"
              strokeWidth="125"
              filter={`url(#${id}blur)`}
            />
          )}
        </mask>
        <linearGradient id={id + "beam"} x2="0" y2="1">
          <stop stopColor="#fae4a9" stopOpacity=".5" />
          <stop offset="1" stopColor="#fae4a9" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1040" height="545" fill={`url(#${id}sky)`} />
      {Array.from({ length: 35 }, (_, i) => (
        <circle
          key={i}
          cx={(i * 137) % 1040}
          cy={(i * i * 17) % 545}
          r={i % 5 === 0 ? 1.5 : 0.6}
          fill="#d3c6ed"
          opacity=".4"
        />
      ))}
      <g clipPath={`url(#${id}art)`}>
        <image
          href="/art/gameplay-source.png"
          x="-15"
          y="-100"
          width="1600"
          height="899"
          mask={`url(#${id}crossing)`}
        />
      </g>
      {stones && (
        <g fill="#aaa2c7" stroke="#decff3" strokeWidth="2">
          {Array.from({ length: 7 }, (_, i) => (
            <g key={i}>
              <path d={`m${470 + i * 56} ${345 - i * 25} 21-9 24 7-20 12z`} />
              <circle
                cx={492 + i * 56}
                cy={330 - i * 25}
                r="2"
                fill="#f0d697"
              />
            </g>
          ))}
        </g>
      )}
      {bridge && (
        <path
          d="M455 335Q650 230 905 165"
          fill="none"
          stroke="#eed599"
          strokeWidth="4"
          opacity=".22"
          filter={`url(#${id}glow)`}
        />
      )}
      {encounter === 1 && !ward && (
        <g fill="none" stroke="#c5acf1" opacity=".8">
          <path
            d="m575 0-35 95 45-15-60 105m214-185-25 65 37-8-42 84"
            strokeWidth="3"
          />
          <path
            d="M300 30q230-100 640 50"
            strokeWidth="50"
            opacity=".12"
            filter={`url(#${id}blur)`}
          />
        </g>
      )}
      {ward && (
        <g>
          <ellipse
            cx="840"
            cy="155"
            rx="183"
            ry="200"
            fill="#a78bfa"
            fillOpacity=".12"
            stroke="#cfb2fa"
            strokeWidth="2"
          />
          <ellipse
            cx="840"
            cy="155"
            rx="167"
            ry="187"
            fill="none"
            stroke="#cdb2f1"
            strokeOpacity=".4"
            strokeDasharray="5 12"
          />
        </g>
      )}
      {shelter && (
        <g fill="none" stroke="#e2c78e">
          <path
            d="M270 365v-65q55-105 110 0v65"
            strokeWidth="16"
            stroke="#847489"
          />
          <path d="M278 361v-61q47-89 94 0v61" strokeWidth="3" />
          <path d="m302 265 22-20 23 20" strokeWidth="4" />
        </g>
      )}
      {restored && (
        <g>
          <path d="M945 0h45l35 270H910Z" fill={`url(#${id}beam)`} />
          <circle
            cx="972"
            cy="99"
            r="29"
            fill="#f5d89a"
            opacity=".8"
            filter={`url(#${id}glow)`}
          />
          <path
            d="m972 67 7 25 25 7-25 7-7 25-7-25-25-7 25-7z"
            fill="#fff2c7"
          />
        </g>
      )}
    </svg>
  );
}
