import './PirateCaptain.css'

export default function PirateCaptain({ greedLevel = 0 }) {
  const eyeColor = greedLevel < 0.5 ? '#00ddff' : greedLevel < 0.75 ? '#ffaa00' : '#ff3344'
  const glowColor = greedLevel < 0.5 ? 'rgba(0,191,255,0.5)' : greedLevel < 0.75 ? 'rgba(255,170,0,0.5)' : 'rgba(255,51,68,0.5)'
  const beardColor = greedLevel < 0.5 ? '#0066aa' : greedLevel < 0.75 ? '#6644aa' : '#883344'

  return (
    <div className="captain-container">
      <svg viewBox="0 0 200 260" className="captain-svg">
        <defs>
          <radialGradient id="captainGlow" cx="50%" cy="35%" r="55%">
            <stop offset="0%" stopColor={glowColor} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="neonGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient glow */}
        <ellipse cx="100" cy="110" rx="95" ry="110" fill="url(#captainGlow)" />

        {/* ===== HAT ===== */}
        <path d="M40 100 Q45 55 100 42 Q155 55 160 100 L148 106 Q100 92 52 106 Z"
          fill="#081030" stroke="#1a4aaa" strokeWidth="1.5" />
        <path d="M34 106 Q100 120 166 106 Q160 98 100 92 Q40 98 34 106Z"
          fill="#0a1840" stroke="#1a4aaa" strokeWidth="1.2" />
        {/* Hat feather */}
        <path d="M140 76 Q158 52 150 34 Q156 54 146 72" fill="none" stroke="#00bfff" strokeWidth="2" opacity="0.5" filter="url(#softGlow)">
          <animate attributeName="d" values="M140 76 Q158 52 150 34 Q156 54 146 72;M140 76 Q160 50 152 32 Q158 52 146 72;M140 76 Q158 52 150 34 Q156 54 146 72" dur="4s" repeatCount="indefinite" />
        </path>
        {/* Skull on hat */}
        <g transform="translate(85, 62)">
          <circle cx="15" cy="10" r="9" fill="none" stroke={eyeColor} strokeWidth="1.5" opacity="0.7" filter="url(#neonGlow)" />
          <circle cx="11" cy="8" r="2" fill={eyeColor} opacity="0.8" />
          <circle cx="19" cy="8" r="2" fill={eyeColor} opacity="0.8" />
          <path d="M12 14 Q15 16 18 14" fill="none" stroke={eyeColor} strokeWidth="0.8" opacity="0.5" />
          <path d="M5 20 L25 20" stroke={eyeColor} strokeWidth="1.5" opacity="0.5" />
          <path d="M5 20 L3 18 M5 20 L3 22" stroke={eyeColor} strokeWidth="1" opacity="0.4" />
          <path d="M25 20 L27 18 M25 20 L27 22" stroke={eyeColor} strokeWidth="1" opacity="0.4" />
        </g>

        {/* ===== FACE (ghost-like rounded shape) ===== */}
        <ellipse cx="100" cy="130" rx="48" ry="46" fill="#0a1a40" stroke="#1a4aaa" strokeWidth="1.5" opacity="0.9" />

        {/* ===== STAR EYES (large, prominent) ===== */}
        <g filter="url(#neonGlow)">
          <polygon points="78,118 81,126 89,126 83,131 85,139 78,134 71,139 73,131 67,126 75,126"
            fill={eyeColor} opacity="0.9">
            <animate attributeName="opacity" values="0.9;0.5;0.9" dur="3s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="scale" values="1;1.05;1" dur="2s" repeatCount="indefinite" additive="sum" />
          </polygon>
          <polygon points="122,118 125,126 133,126 127,131 129,139 122,134 115,139 117,131 111,126 119,126"
            fill={eyeColor} opacity="0.9">
            <animate attributeName="opacity" values="0.9;0.5;0.9" dur="3s" repeatCount="indefinite" begin="0.3s" />
            <animateTransform attributeName="transform" type="scale" values="1;1.05;1" dur="2s" repeatCount="indefinite" begin="0.5s" additive="sum" />
          </polygon>
        </g>

        {/* Smirk */}
        <path d="M84 150 Q100 158 116 150" fill="none" stroke="#1a4aaa" strokeWidth="2" opacity="0.4" />

        {/* ===== BEARD (flowing, wavy) ===== */}
        <g opacity="0.5" filter="url(#softGlow)">
          <path d="M60 155 Q70 180 80 190 Q90 200 100 205 Q110 200 120 190 Q130 180 140 155"
            fill="none" stroke={beardColor} strokeWidth="2.5">
            <animate attributeName="d"
              values="M60 155 Q70 180 80 190 Q90 200 100 205 Q110 200 120 190 Q130 180 140 155;M60 155 Q68 182 78 193 Q90 203 100 208 Q110 203 122 193 Q132 182 140 155;M60 155 Q70 180 80 190 Q90 200 100 205 Q110 200 120 190 Q130 180 140 155"
              dur="5s" repeatCount="indefinite" />
          </path>
          <path d="M65 158 Q75 178 85 188 Q95 198 100 200 Q105 198 115 188 Q125 178 135 158"
            fill="none" stroke={beardColor} strokeWidth="2" opacity="0.7">
            <animate attributeName="d"
              values="M65 158 Q75 178 85 188 Q95 198 100 200 Q105 198 115 188 Q125 178 135 158;M65 158 Q73 180 83 191 Q95 201 100 204 Q105 201 117 191 Q127 180 135 158;M65 158 Q75 178 85 188 Q95 198 100 200 Q105 198 115 188 Q125 178 135 158"
              dur="5s" repeatCount="indefinite" begin="0.5s" />
          </path>
          <path d="M70 160 Q80 175 90 185 Q100 195 100 195 Q100 195 110 185 Q120 175 130 160"
            fill="none" stroke={beardColor} strokeWidth="1.5" opacity="0.5">
            <animate attributeName="d"
              values="M70 160 Q80 175 90 185 Q100 195 100 195 Q100 195 110 185 Q120 175 130 160;M70 160 Q78 177 88 188 Q100 198 100 198 Q100 198 112 188 Q122 177 130 160;M70 160 Q80 175 90 185 Q100 195 100 195 Q100 195 110 185 Q120 175 130 160"
              dur="5s" repeatCount="indefinite" begin="1s" />
          </path>
        </g>
      </svg>
    </div>
  )
}
