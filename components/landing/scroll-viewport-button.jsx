"use client";

export default function ScrollViewportButton({
  ariaLabel = "Rolar para baixo",
  buttonClassName,
  iconClassName,
  ringClassName,
}) {
  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={() =>
        window.scrollBy({ top: window.innerHeight, behavior: "smooth" })
      }
      aria-label={ariaLabel}
    >
      <span className={ringClassName} aria-hidden="true" />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        className={iconClassName} 
        aria-hidden="true"
      >
        <path d="M12 16l-6-6h12z" />
      </svg>
    </button>
  );
}
