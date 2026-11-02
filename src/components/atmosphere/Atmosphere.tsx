import React from 'react';

export type AtmosphereVariant = 'hero' | 'app' | 'report' | 'auth';

export function Atmosphere({ variant = 'app' }: { variant?: AtmosphereVariant }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
      {/* Background gradients according to variant */}
      {variant === 'hero' && (
        <>
          {/* Base gradient shifting from steel blue to ocean blue down to navy */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, #365D82 0%, #1D4468 35%, #10243B 68%, #07111F 100%)',
              opacity: 0.85,
            }}
          />
          {/* Top-right primary light source */}
          <div
            className="absolute -top-32 -right-32 w-[900px] h-[750px] rounded-full blur-[140px] opacity-40"
            style={{
              background: 'radial-gradient(circle, rgba(220, 239, 248, 0.45) 0%, rgba(121, 200, 223, 0.20) 45%, transparent 70%)',
            }}
          />
          {/* Bottom-left secondary bloom */}
          <div
            className="absolute top-[55%] -left-32 w-[600px] h-[600px] rounded-full blur-[140px] opacity-25"
            style={{
              background: 'radial-gradient(circle, rgba(121, 200, 223, 0.3) 0%, transparent 65%)',
            }}
          />
          {/* Subtle diagonal beam of light */}
          <div
            className="absolute -top-1/4 -right-1/4 w-[140%] h-[120%] rotate-[-24deg] opacity-10 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 40%, rgba(220, 239, 248, 0.5) 50%, transparent 60%)',
            }}
          />
        </>
      )}

      {variant === 'app' && (
        <>
          {/* Navy ground with calm top bloom */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[420px] pointer-events-none opacity-35"
            style={{
              background: 'radial-gradient(70% 380px at 50% -8%, rgba(83, 127, 165, 0.35), transparent)',
            }}
          />
        </>
      )}

      {variant === 'report' && (
        <>
          {/* Top right gentle bloom */}
          <div
            className="absolute -top-20 right-0 w-[700px] h-[450px] rounded-full blur-[120px] opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(83, 127, 165, 0.4) 0%, transparent 70%)',
            }}
          />
          {/* Stage back-bloom */}
          <div
            className="absolute top-[280px] left-[20%] w-[500px] h-[400px] rounded-full blur-[140px] opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(121, 200, 223, 0.25) 0%, transparent 70%)',
            }}
          />
        </>
      )}

      {variant === 'auth' && (
        <>
          {/* Light source anchored on top left */}
          <div
            className="absolute -top-32 -left-32 w-[800px] h-[700px] rounded-full blur-[140px] opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(220, 239, 248, 0.35) 0%, rgba(83, 127, 165, 0.2) 50%, transparent 70%)',
            }}
          />
        </>
      )}

      {/* Static Film-Grain Overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.035] mix-blend-overlay pointer-events-none">
        <filter id="stagesense-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#stagesense-noise)" />
      </svg>
    </div>
  );
}
