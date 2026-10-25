import { useId } from "react";
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
      viewBox="0 0 1000 680"
      role="img"
      aria-label={`Floating observatory ruins in a star-filled sky. ${bridge ? "A woven bridge spans the crossing. " : ""}${stones ? "Moonlit stepping stones reveal a sheltered crossing. " : ""}${shelter ? "A restored shelter protects the party. " : ""}${ward ? "A protective ward surrounds the tower. " : ""}${restored ? "The restored beacon shines." : ""}`}
    >
      <defs>
        <radialGradient id={id + "sky"}>
          <stop stopColor={restored ? "#55518c" : "#37335c"} />
          <stop offset="1" stopColor="#100f22" />
        </radialGradient>
        <linearGradient id={id + "rock"} x2=".4" y2="1">
          <stop stopColor="#625c79" />
          <stop offset="1" stopColor="#1b1a32" />
        </linearGradient>
        <linearGradient id={id + "light"} x2="0" y2="1">
          <stop stopColor="#eadbb0" />
          <stop offset="1" stopColor="#9f83d8" stopOpacity="0" />
        </linearGradient>
        <filter id={id + "glow"}>
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <rect width="1000" height="680" fill={`url(#${id}sky)`} />
      {encounter === 1 && (
        <g fill="none" stroke="#c7b0ef" opacity=".45">
          <path
            d="m770 10-30 92 48-12-66 109m-379-176-27 79 43-10-51 87"
            strokeWidth="3"
          />
          <path
            d="M40 160q350-150 850-40M20 190q440-170 940-20"
            strokeWidth="12"
            opacity=".13"
          />
        </g>
      )}
      {Array.from({ length: 75 }, (_, i) => (
        <circle
          key={i}
          cx={(i * 137.5) % 1000}
          cy={(i * i * 31) % 550}
          r={i % 7 === 0 ? 1.8 : 0.8}
          fill="#e9d8b4"
          opacity={0.2 + (i % 5) * 0.14}
        />
      ))}
      <circle cx="720" cy="140" r="84" fill="#c4b7df" opacity=".06" />
      <circle
        cx="720"
        cy="140"
        r="65"
        fill="none"
        stroke="#ae9ac8"
        strokeWidth=".8"
        opacity=".25"
      />
      <path d="M660 140h120M720 80v120" stroke="#ae9ac8" opacity=".2" />
      <g opacity=".2" fill="#827492">
        <path d="m0 385 150-110 75 80 135-160 110 160 110-90 180 150 150-105v200H0" />
        <path d="m30 450 180-100 220 110 190-125 230 130 150-120v280H0" />
      </g>
      <g opacity=".5" fill={`url(#${id}rock)`}>
        <path d="m80 220 90-25 70 20-40 20-40 65-35-65z" />
        <path d="m825 330 65-20 90 25-55 20-25 80-40-77z" />
        <path d="m70 545 110-30 95 30-75 35-25 100-45-95z" />
      </g>
      <g>
        <path
          d="m350 428 190-43 209 43-50 46-65 140-31-60-49 100-57-90-38 35-44-109z"
          fill={`url(#${id}rock)`}
        />
        <path d="m350 428 190-43 209 43-168 45z" fill="#737084" />
        <path d="m370 432 173-31 175 31-142 24z" fill="#3d4152" />
        <path
          d="m420 456 20 92m60-77 20 83m110-90-18 69m75-78-26 58"
          stroke="#a392ad"
          strokeOpacity=".18"
          strokeWidth="2"
        />
      </g>
      <g stroke="#b5a9c4" strokeWidth="2">
        <path d="M480 418V259h158v170" fill="#49465c" />
        <path d="M470 266q89-148 178 0z" fill="#676078" />
        <path d="M485 251q74-101 147 0" fill="none" stroke="#c4b6ce" />
        <path d="M558 174v-34m-12 4h24" />
        <path d="M498 418V288h25v140m70-2V288h25v137" fill="#6d657b" />
        <path d="M535 425V297q24-23 46 0v132" fill="#1e2037" />
        <path
          d="M546 422V309q12-15 24 0v115"
          fill={restored ? "#ead9a0" : "#8978ad"}
          opacity={restored ? 1 : 0.55}
        />
        <path d="M462 430h194m-184-10h175" />
        <path
          d="m480 259 64-8m-3-75 15 57m18-57-10 57m-84 110h18m120 0h20"
          opacity=".5"
        />
      </g>
      <ellipse
        cx="561"
        cy="443"
        rx="87"
        ry="18"
        fill="none"
        stroke="#d5b87e"
        opacity=".7"
      />
      <ellipse
        cx="561"
        cy="443"
        rx="65"
        ry="11"
        fill="none"
        stroke="#a598d2"
        opacity=".5"
      />
      {restored && (
        <g>
          <path
            d="m558 0-43 445h87L568 0"
            fill={`url(#${id}light)`}
            opacity=".5"
          />
          <circle
            cx="558"
            cy="307"
            r="22"
            fill="#ead9a0"
            filter={`url(#${id}glow)`}
          />
          <path
            d="m558 276 6 24 23 7-23 7-6 25-7-25-24-7 24-7z"
            fill="#fff2c6"
          />
        </g>
      )}
      {ward && (
        <ellipse
          cx="558"
          cy="340"
          rx="140"
          ry="150"
          fill="#a78bfa"
          fillOpacity=".06"
          stroke="#c3a7ff"
          strokeDasharray="8 8"
          strokeOpacity=".65"
        />
      )}
      <g>
        <path d="m0 545 160-80 200 74-84 70-43 71H0" fill="#292c3e" />
        <path d="m0 545 160-80 200 74-172 25z" fill="#636175" />
        <path d="m30 541 133-59 151 56-125 8z" fill="#424958" />
        <path
          d="M160 491v-95m-22 22 22-26 21 28m-21-9-22 36m22-32 27 32"
          stroke="#b1a18c"
          strokeWidth="7"
        />
        <path d="m172 560 55 88m-118-87 13 68" stroke="#7f758a" opacity=".4" />
      </g>
      {stones && (
        <g fill="#bcb0d8" stroke="#e3d4f5" strokeWidth="2">
          {Array.from({ length: 6 }, (_, i) => (
            <g key={i}>
              <ellipse cx={285 + i * 23} cy={532 - i * 14} rx="16" ry="6" />
              <path
                d={`m${285 + i * 23} ${532 - i * 14 - 18} 0 -9`}
                stroke="#e8cc8a"
              />
            </g>
          ))}
        </g>
      )}
      {shelter && (
        <g fill="none" stroke="#bfb0c8">
          <path d="M185 537v-43q35-80 70 0v43" strokeWidth="15" />
          <path
            d="m175 538 88 0m-51-82 15-15 15 15"
            stroke="#e8cc8a"
            strokeWidth="3"
          />
          <path
            d="M199 529v-34q21-44 42 0v34"
            stroke="#a78bfa"
            strokeWidth="3"
          />
        </g>
      )}
      {bridge ? (
        <g stroke="#a89679" strokeWidth="9">
          <path d="M271 528Q319 474 412 443" fill="none" />
          <path d="M276 543Q330 490 422 454" fill="none" />
          {Array.from({ length: 9 }, (_, i) => (
            <path
              key={i}
              d={`m${280 + i * 15} ${522 - i * 8} 10 16`}
              stroke="#d0b994"
              strokeWidth="5"
            />
          ))}
        </g>
      ) : !stones ? (
        <g fill="#94829f" opacity=".7">
          <path d="m294 509 20-9 8 17-19 6z" />
          <path d="m342 480 15-8 6 12-14 8z" />
          <path d="m382 463 15-7 6 9-14 6z" />
        </g>
      ) : null}
      <g fill="#ddc68d">
        <circle cx="212" cy="510" r="5" />
        <path d="m207 516-6 24h22l-6-24z" />
        <circle cx="235" cy="517" r="4" />
        <path d="m231 522-5 20h18l-5-20z" />
      </g>
      <path
        d="M0 620Q240 545 500 610T1000 600v80H0"
        fill="#17182c"
        opacity=".5"
      />
      <path
        d="M0 650Q340 585 580 640T1000 620"
        fill="none"
        stroke="#9e91b9"
        opacity=".12"
        strokeWidth="45"
      />
    </svg>
  );
}
