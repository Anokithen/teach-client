interface SpinnerProps {
  size?: number;
  light?: boolean;
}

export function Spinner({ size = 24, light = false }: SpinnerProps) {
  return (
    <svg
      className="animate-spin"
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={light ? 'rgba(255,255,255,0.35)' : 'rgba(84,172,191,0.18)'}
        strokeWidth="4"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke={light ? '#FFFFFF' : '#54ACBF'}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
