export default function LoadingSpinner({ size = 48, text = 'Loading...', fullscreen = true }) {
  const containerClass = `loading-spinner${fullscreen ? ' loading-spinner--fullscreen' : ''}`;

  return (
    <div className={containerClass} role="status" aria-live="polite">
      <svg
        className="spinner"
        width={size}
        height={size}
        viewBox="0 0 50 50"
        aria-hidden="true"
      >
        <circle className="spinner-track" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
        <path
          className="spinner-head"
          d="M45 25a20 20 0 0 1-20 20"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      <div className="spinner-text">{text}</div>
    </div>
  );
}
