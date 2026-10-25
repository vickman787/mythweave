export function Icon({
  name,
  className = "",
}: {
  name: "twitch" | "party" | "compass" | "branch" | "weaver" | "warden";
  className?: string;
}) {
  return (
    <svg
      className={`ui-icon ${className}`}
      viewBox="0 0 40 40"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "twitch" ? (
        <>
          <path
            d="M9 5h28v23L25 39h-8v-7H6V11z"
            fill="currentColor"
            stroke="none"
          />
          <path d="M12 9v19h9v6l7-6h5V9z" fill="#14101f" stroke="none" />
          <path d="M21 14v8m7-8v8" strokeWidth="3" />
        </>
      ) : name === "party" ? (
        <>
          <circle cx="20" cy="13" r="5" fill="currentColor" />
          <circle cx="7" cy="16" r="4" fill="currentColor" />
          <circle cx="33" cy="16" r="4" fill="currentColor" />
          <path
            d="M10 32v-5c0-9 20-9 20 0v5zM1 30v-4c0-5 5-8 10-6m28 10v-4c0-5-5-8-10-6"
            fill="currentColor"
            stroke="none"
          />
        </>
      ) : name === "compass" ? (
        <>
          <circle cx="20" cy="20" r="14" strokeOpacity=".45" />
          <path d="m20 1 4 14 15 5-15 4-4 15-4-15L1 20l15-5z" />
          <path d="m20 8 3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="currentColor" />
          <circle cx="20" cy="20" r="3" fill="#151021" />
        </>
      ) : name === "branch" ? (
        <>
          <path d="m10 34 16-28M15 25l-9-9m13 2 11-3m-8-2-6-8m-4 24 16-3m-2-7 9-10M12 23 9 8" />
          <path d="m7 16-2-6m22 5 5-7" strokeWidth="1" />
        </>
      ) : name === "warden" ? (
        <>
          <path d="m7 8 13-5 13 5v11c0 10-13 18-13 18S7 29 7 19z" />
          <path d="m20 8 3 9 9 2-9 3-3 10-3-10-9-3 9-2z" />
        </>
      ) : (
        <>
          <path d="M20 4C8 18 5 22 10 30c5 8 21 0 20-9C29 10 12 12 6 28h28C28 12 11 10 10 21c-1 9 15 17 20 9 5-8 2-12-10-26Z" />
          <circle cx="20" cy="22" r="4" />
        </>
      )}
    </svg>
  );
}
