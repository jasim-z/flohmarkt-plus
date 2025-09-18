export default function FleaMarketIllustration() {
  return (
    <svg
      viewBox="0 0 420 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto max-w-md"
      aria-hidden="true"
    >
      {/* Sky background */}
      <rect width="420" height="340" rx="32" fill="#FDF6EC" />
      {/* City skyline silhouette */}
      <g>
        <rect x="30" y="220" width="60" height="40" fill="#B7C9E2" />
        <rect x="100" y="200" width="40" height="60" fill="#A3B18A" />
        <rect x="150" y="210" width="30" height="50" fill="#B5838D" />
        <rect x="190" y="190" width="50" height="70" fill="#6D6875" />
        <rect x="250" y="215" width="40" height="45" fill="#E5989B" />
        <rect x="300" y="205" width="60" height="55" fill="#F9C74F" />
        {/* Frauenkirche domes */}
        <ellipse cx="60" cy="220" rx="10" ry="12" fill="#6D6875" />
        <ellipse cx="80" cy="220" rx="10" ry="12" fill="#6D6875" />
      </g>
      {/* Market stall */}
      <g>
        <rect x="110" y="140" width="200" height="80" rx="10" fill="#F7B267" stroke="#B5838D" strokeWidth="3" />
        <rect x="110" y="180" width="200" height="40" rx="8" fill="#F4845F" />
        {/* Awning stripes */}
        <rect x="110" y="140" width="20" height="40" fill="#F25F5C" />
        <rect x="150" y="140" width="20" height="40" fill="#F25F5C" />
        <rect x="190" y="140" width="20" height="40" fill="#F25F5C" />
        <rect x="230" y="140" width="20" height="40" fill="#F25F5C" />
        <rect x="270" y="140" width="20" height="40" fill="#F25F5C" />
        <rect x="290" y="140" width="20" height="40" fill="#F25F5C" />
        {/* Stall legs */}
        <rect x="120" y="220" width="10" height="30" fill="#B5838D" />
        <rect x="280" y="220" width="10" height="30" fill="#B5838D" />
      </g>
      {/* Pretzel */}
      <g>
        <ellipse cx="340" cy="260" rx="22" ry="14" fill="#D9A066" />
        <ellipse cx="340" cy="260" rx="16" ry="8" fill="#F7B267" />
        <ellipse cx="332" cy="260" rx="3" ry="2" fill="#fff" />
        <ellipse cx="348" cy="260" rx="3" ry="2" fill="#fff" />
      </g>
      {/* Welcome text */}
      <text x="50%" y="80" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#6D6875" fontFamily="Nunito, sans-serif">
        Willkommen zum
      </text>
      <text x="50%" y="110" textAnchor="middle" fontSize="32" fontWeight="bold" fill="#F25F5C" fontFamily="Nunito, sans-serif">
        Flohmarkt+
      </text>
    </svg>
  );
} 