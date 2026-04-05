'use client';

export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {/* Orb 1 — indigo ellipse, top-center */}
      <div
        className="absolute"
        style={{
          width: '900px',
          height: '600px',
          background:
            'radial-gradient(ellipse at 40% 50%, var(--tp-accent-glow) 0%, transparent 65%)',
          top: '-250px',
          left: '30%',
          filter: 'blur(90px)',
          animation: 'float-1 22s ease-in-out infinite',
          opacity: 'var(--orb-opacity, 1)',
        }}
      />
      {/* Orb 2 — violet ellipse, bottom-right */}
      <div
        className="absolute"
        style={{
          width: '600px',
          height: '500px',
          background:
            'radial-gradient(ellipse at 60% 40%, var(--tp-accent-secondary-glow, color-mix(in oklch, var(--tp-accent-secondary) 20%, transparent)) 0%, transparent 65%)',
          bottom: '0%',
          right: '-5%',
          filter: 'blur(80px)',
          animation: 'float-2 32s ease-in-out infinite',
        }}
      />
      {/* Orb 3 — indigo ellipse, bottom-left */}
      <div
        className="absolute"
        style={{
          width: '500px',
          height: '400px',
          background:
            'radial-gradient(ellipse at 50% 50%, var(--tp-accent-subtle) 0%, transparent 60%)',
          bottom: '10%',
          left: '-8%',
          filter: 'blur(70px)',
          animation: 'float-1 35s ease-in-out infinite reverse',
        }}
      />
      {/* Horizon streak */}
      <div
        className="absolute"
        style={{
          width: '1200px',
          height: '200px',
          background:
            'radial-gradient(ellipse at 50% 50%, var(--tp-accent-subtle) 0%, transparent 70%)',
          top: '45%',
          left: '50%',
          transform: 'translateX(-50%)',
          filter: 'blur(100px)',
        }}
      />
      {/* Noise texture — reduced opacity in light mode */}
      <div
        className="noise-overlay fixed inset-0 dark:opacity-[0.035] opacity-[0.02]"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
}
