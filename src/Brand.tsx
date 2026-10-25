export function Brand({
  small = false,
  stacked = false,
  onHome,
}: {
  small?: boolean;
  stacked?: boolean;
  onHome?: () => void;
}) {
  return (
    <a
      className={`brand ${stacked ? "brand-stacked" : ""}`}
      href="/"
      aria-label="Mythweave home"
      onClick={
        onHome
          ? (e) => {
              e.preventDefault();
              onHome();
            }
          : undefined
      }
    >
      {stacked ? (
        <img src="/brand/mythweave-original.png" alt="Mythweave" />
      ) : (
        <>
          <svg
            className="brand-mark"
            viewBox="310 200 640 660"
            aria-hidden="true"
          >
            <image
              href="/brand/mythweave-original.png"
              width="1264"
              height="1264"
            />
          </svg>
          {!small && (
            <svg
              className="brand-wordmark"
              viewBox="80 915 1100 130"
              aria-hidden="true"
            >
              <image
                href="/brand/mythweave-original.png"
                width="1264"
                height="1264"
              />
            </svg>
          )}
        </>
      )}
    </a>
  );
}
