import React from 'react';

const GlowAvatar = ({ isListening, isSpeaking, size = 180 }) => {
  // Determine state
  const state = isListening ? 'listening' : isSpeaking ? 'speaking' : 'idle';

  const barCount = 12;
  const barColors = {
    speaking:  'var(--amber)',
    listening: 'var(--cyan-bright)',
    idle:      'var(--text-4)',
  };
  const color = barColors[state];

  return (
    <div
      className={`wv-root ${state === 'speaking' ? 'glow-avatar-active' : state === 'listening' ? 'glow-avatar-listening' : ''}`}
      style={{ width: size, height: size }}
      aria-label={`AI interviewer is ${state}`}
    >
      {/* Animated concentric rings */}
      <div className="wv-ring wv-ring-1" style={{ borderColor: state === 'idle' ? 'var(--border)' : color }} />
      <div className="wv-ring wv-ring-2" style={{ borderColor: state === 'idle' ? 'var(--border)' : color }} />

      {/* Core panel */}
      <div className="wv-core">
        {/* Waveform bars */}
        <div className="wv-bars">
          {Array.from({ length: barCount }).map((_, i) => {
            const delay = (i * 80) % 700;
            const isEdge = i === 0 || i === barCount - 1;
            const isNearEdge = i === 1 || i === barCount - 2;
            const baseH = isEdge ? 12 : isNearEdge ? 20 : 32;

            return (
              <div
                key={i}
                className="wv-bar"
                style={{
                  background: color,
                  animationDelay: `${delay}ms`,
                  animationDuration: state === 'listening' ? '0.7s' : state === 'speaking' ? '0.5s' : '0s',
                  animationName: state === 'idle' ? 'none' : 'waveBar',
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite',
                  height: `${baseH}px`,
                  maxHeight: `${Math.floor(size * 0.38)}px`,
                  opacity: state === 'idle' ? 0.2 : 0.9,
                  transform: state === 'idle' ? 'scaleY(0.3)' : undefined,
                  transformOrigin: 'bottom',
                  transition: state === 'idle' ? 'all 0.4s ease' : 'none',
                }}
              />
            );
          })}
        </div>

        {/* State label */}
        <div className="wv-label" style={{ color }}>
          {state === 'speaking'  ? 'THINKING' :
           state === 'listening' ? 'LISTENING' : 'STANDBY'}
        </div>
      </div>

      <style>{`
        .wv-root {
          position: relative; display: flex;
          align-items: center; justify-content: center;
          border-radius: 50%; flex-shrink: 0;
        }
        .wv-ring {
          position: absolute; inset: 0; border-radius: 50%;
          border: 1px solid; pointer-events: none;
          transition: border-color 0.5s ease;
        }
        .wv-ring-1 { animation: spin 16s linear infinite; }
        .wv-ring-2 { inset: 12px; animation: spin 10s linear infinite reverse; }
        .wv-core {
          width: 70%; height: 70%; border-radius: 50%;
          background: var(--surface-2); border: 1px solid var(--border-2);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 10px;
          overflow: hidden; position: relative; z-index: 1;
        }
        .wv-bars {
          display: flex; align-items: center; gap: 3px;
          height: 40px; padding: 0 4px;
        }
        .wv-bar {
          width: 3px; border-radius: 2px; flex-shrink: 0;
        }
        .wv-label {
          font-family: var(--font-mono); font-size: 8px;
          font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; transition: color 0.4s ease;
        }

        @keyframes waveBar {
          0%, 100% { transform: scaleY(0.3); }
          50%       { transform: scaleY(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GlowAvatar;
