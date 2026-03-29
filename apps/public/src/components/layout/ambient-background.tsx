'use client';

export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface-0)' }}
    >
      {/* Orb 1 — indigo ellipse, top-center, primary accent */}
      <div
        style={{
          position: 'absolute',
          width: '900px',
          height: '600px',
          background:
            'radial-gradient(ellipse at 40% 50%, rgba(99,102,241,0.22) 0%, transparent 65%)',
          top: '-250px',
          left: '30%',
          filter: 'blur(90px)',
          animation: 'float-1 22s ease-in-out infinite',
        }}
      />
      {/* Orb 2 — violet ellipse, bottom-right (bleeds off edge) */}
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '500px',
          background:
            'radial-gradient(ellipse at 60% 40%, rgba(139,92,246,0.18) 0%, transparent 65%)',
          bottom: '0%',
          right: '-5%',
          filter: 'blur(80px)',
          animation: 'float-2 32s ease-in-out infinite',
        }}
      />
      {/* Orb 3 — indigo ellipse, bottom-left (bleeds off edge) */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '400px',
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.12) 0%, transparent 60%)',
          bottom: '10%',
          left: '-8%',
          filter: 'blur(70px)',
          animation: 'float-1 35s ease-in-out infinite reverse',
        }}
      />
      {/* Orb 4 — static horizontal indigo streak at mid-page (Linear-style horizon) */}
      <div
        style={{
          position: 'absolute',
          width: '1200px',
          height: '200px',
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.07) 0%, transparent 70%)',
          top: '45%',
          left: '50%',
          transform: 'translateX(-50%)',
          filter: 'blur(100px)',
        }}
      />
      {/* Noise texture overlay — adds Raycast-style grain depth */}
      <div
        className="noise-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.035,
        }}
      />
    </div>
  );
}
