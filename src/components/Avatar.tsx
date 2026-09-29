'use client';

interface AvatarProps {
  expression: 'normal' | 'happy' | 'speaking' | 'listening';
  size?: number;
}

export default function Avatar({ expression, size = 140 }: AvatarProps) {
  const isNormal = expression === 'normal';
  const isHappy = expression === 'happy';
  const isSpeaking = expression === 'speaking';
  const isListening = expression === 'listening';

  return (
    <div
      className={`avatar-wrap ${isSpeaking ? 'speaking' : ''}`}
      style={{ width: size, height: size * 1.14 }}
    >
      <svg viewBox="0 0 160 180" className="w-full h-full">
        <ellipse cx="80" cy="175" rx="38" ry="5" className="fill-border/40" />
        <rect x="52" y="128" rx="18" ry="18" width="56" height="44" className="fill-primary" />
        <rect x="70" y="118" width="20" height="16" rx="4" className="fill-skin" />
        <circle cx="80" cy="72" r="50" className="fill-skin" />
        <ellipse cx="80" cy="36" rx="52" ry="30" className="fill-hair" />
        <rect x="28" y="30" width="104" height="22" rx="6" className="fill-hair" />
        <path d="M38,52 Q42,38 56,34 Q48,46 50,56Z" className="fill-hair" />
        <path d="M122,52 Q118,38 104,34 Q112,46 110,56Z" className="fill-hair" />
        <circle cx="55" cy="82" r="9" className="fill-blush" />
        <circle cx="105" cy="82" r="9" className="fill-blush" />

        {/* Normal eyes */}
        {(isNormal || isSpeaking) && (
          <g>
            <circle cx="64" cy="68" r="5.5" className="fill-hair" />
            <circle cx="96" cy="68" r="5.5" className="fill-hair" />
            <circle cx="66" cy="66" r="1.8" fill="white" />
            <circle cx="98" cy="66" r="1.8" fill="white" />
          </g>
        )}
        {/* Happy eyes */}
        {isHappy && (
          <g>
            <path d="M54,68 Q64,58 74,68" className="stroke-hair" fill="none" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M86,68 Q96,58 106,68" className="stroke-hair" fill="none" strokeWidth="2.8" strokeLinecap="round" />
          </g>
        )}
        {/* Listening eyes */}
        {isListening && (
          <g>
            <circle cx="64" cy="68" r="7" className="fill-hair" />
            <circle cx="96" cy="68" r="7" className="fill-hair" />
            <circle cx="66.5" cy="65.5" r="2.5" fill="white" />
            <circle cx="98.5" cy="65.5" r="2.5" fill="white" />
          </g>
        )}

        {/* Normal mouth */}
        {(isNormal || isListening) && (
          <path d="M70,92 Q80,101 90,92" className="stroke-mouth" fill="none" strokeWidth="2.2" strokeLinecap="round" />
        )}
        {/* Speaking mouth */}
        {isSpeaking && (
          <ellipse cx="80" cy="94" rx="7" ry="5.5" className="fill-mouth" />
        )}
        {/* Happy mouth */}
        {isHappy && (
          <path d="M64,89 Q80,106 96,89" className="stroke-mouth" fill="white" strokeWidth="2.2" strokeLinecap="round" />
        )}
      </svg>
    </div>
  );
}
