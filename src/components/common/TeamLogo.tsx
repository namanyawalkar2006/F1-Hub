import React from 'react';

interface TeamLogoProps {
  teamName: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const TeamLogo: React.FC<TeamLogoProps> = ({ teamName, className = '', size = 'sm' }) => {
  const norm = (teamName || '').toLowerCase();

  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  }[size];

  // 1. Ferrari
  if (norm.includes('ferrari')) {
    return (
      <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${sizeClasses} ${className}`} title="Scuderia Ferrari">
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md">
          {/* Yellow Shield */}
          <path d="M 10 10 L 90 10 Q 90 70 50 115 Q 10 70 10 10 Z" fill="#FFEB00" stroke="#000" strokeWidth="3" />
          {/* Italian Tricolore Top Bar */}
          <rect x="13" y="12" width="24" height="10" fill="#009246" />
          <rect x="37" y="12" width="26" height="10" fill="#FFFFFF" />
          <rect x="63" y="12" width="24" height="10" fill="#CE2B37" />
          {/* Prancing Horse Silhouette */}
          <path
            d="M 52 35 C 50 32 46 34 45 37 C 43 40 47 43 45 47 C 42 50 38 52 40 56 C 42 60 45 62 43 68 C 41 74 36 82 38 88 C 40 92 45 88 47 84 C 50 78 52 72 55 68 C 58 64 62 61 64 56 C 66 51 63 46 60 44 C 57 42 55 38 52 35 Z"
            fill="#111111"
          />
          <text x="50" y="104" textAnchor="middle" fill="#111111" fontSize="12" fontWeight="900" fontFamily="sans-serif">S F</text>
        </svg>
      </div>
    );
  }

  // 2. Mercedes-AMG Petronas
  if (norm.includes('mercedes')) {
    return (
      <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${sizeClasses} ${className}`} title="Mercedes-AMG Petronas">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="44" fill="#0c0e12" stroke="#00A19B" strokeWidth="4" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#D1D5DB" strokeWidth="2.5" />
          {/* 3-Pointed Star */}
          <polygon points="50,15 54,46 50,50 46,46" fill="#F3F4F6" />
          <polygon points="80,68 53,52 50,50 55,47" fill="#E5E7EB" />
          <polygon points="20,68 45,47 50,50 47,52" fill="#D1D5DB" />
          {/* Inner metallic shading */}
          <circle cx="50" cy="50" r="6" fill="#9CA3AF" />
        </svg>
      </div>
    );
  }

  // 3. Red Bull Racing
  if (norm.includes('red bull') && !norm.includes('rb')) {
    return (
      <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${sizeClasses} ${className}`} title="Oracle Red Bull Racing">
        <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-md">
          {/* Sun */}
          <circle cx="50" cy="40" r="22" fill="#FACC15" />
          {/* Charging Bull Left */}
          <path d="M 12 48 Q 28 32 46 38 Q 42 52 30 55 Q 16 58 12 48 Z" fill="#DC2626" />
          <polygon points="36,36 30,30 35,32" fill="#F87171" />
          {/* Charging Bull Right */}
          <path d="M 88 48 Q 72 32 54 38 Q 58 52 70 55 Q 84 58 88 48 Z" fill="#DC2626" />
          <polygon points="64,36 70,30 65,32" fill="#F87171" />
          <text x="50" y="70" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="900" fontFamily="sans-serif">RED BULL</text>
        </svg>
      </div>
    );
  }

  // 4. McLaren
  if (norm.includes('mclaren')) {
    return (
      <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${sizeClasses} ${className}`} title="McLaren Formula 1 Team">
        <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-md">
          {/* McLaren Speedmark Arc */}
          <path
            d="M 15 48 C 35 25 70 20 88 38 C 76 32 45 32 28 58 C 42 42 68 36 85 45 C 55 45 30 56 15 48 Z"
            fill="#FF8000"
          />
          <text x="50" y="70" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="900" letterSpacing="1">MCLAREN</text>
        </svg>
      </div>
    );
  }

  // 5. Aston Martin
  if (norm.includes('aston')) {
    return (
      <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${sizeClasses} ${className}`} title="Aston Martin Aramco">
        <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-md">
          {/* British Racing Green Background Wing Shape */}
          <path d="M 10 25 Q 35 15 50 30 Q 65 15 90 25 Q 70 42 50 38 Q 30 42 10 25 Z" fill="#00594F" stroke="#22D3EE" strokeWidth="1.5" />
          <path d="M 18 26 L 82 26" stroke="#CED640" strokeWidth="1.5" />
          <text x="50" y="48" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="800" letterSpacing="0.5">ASTON MARTIN</text>
        </svg>
      </div>
    );
  }

  // 6. Alpine
  if (norm.includes('alpine')) {
    return (
      <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${sizeClasses} ${className}`} title="Alpine F1 Team">
        <svg viewBox="0 0 100 90" className="w-full h-full drop-shadow-md">
          <circle cx="50" cy="45" r="40" fill="#001428" stroke="#0093CC" strokeWidth="2.5" />
          {/* Alpine Slanted A with crossbar */}
          <path d="M 28 68 L 50 18 L 72 68 L 62 68 L 55 52 L 45 52 L 40 68 Z" fill="#0093CC" />
          {/* Tricolore accent */}
          <rect x="42" y="54" width="5" height="5" fill="#0055A4" />
          <rect x="47" y="54" width="6" height="5" fill="#FFFFFF" />
          <rect x="53" y="54" width="5" height="5" fill="#EF4135" />
        </svg>
      </div>
    );
  }

  // 7. Visa Cash App RB
  if (norm.includes('rb') || norm.includes('racing bulls') || norm.includes('alpha tauri')) {
    return (
      <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${sizeClasses} ${className}`} title="Visa Cash App RB">
        <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-md">
          <rect x="5" y="10" width="90" height="60" rx="8" fill="#09142B" stroke="#6692FF" strokeWidth="1.5" />
          {/* Bull Silhouette */}
          <path d="M 25 45 Q 40 28 58 35 Q 52 50 38 52 Z" fill="#FFFFFF" />
          <text x="70" y="38" textAnchor="middle" fill="#6692FF" fontSize="16" fontWeight="900">RB</text>
          <text x="70" y="54" textAnchor="middle" fill="#10B981" fontSize="9" fontWeight="800">VISA</text>
        </svg>
      </div>
    );
  }

  // 8. Kick Sauber / Stake
  if (norm.includes('sauber') || norm.includes('kick') || norm.includes('stake')) {
    return (
      <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${sizeClasses} ${className}`} title="Stake F1 Team Kick Sauber">
        <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-md">
          <rect x="8" y="12" width="84" height="56" rx="8" fill="#0B130B" stroke="#52E252" strokeWidth="2" />
          <text x="50" y="38" textAnchor="middle" fill="#52E252" fontSize="16" fontWeight="900" fontStyle="italic">Stake</text>
          <text x="50" y="55" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900" letterSpacing="1">KICK SAUBER</text>
        </svg>
      </div>
    );
  }

  // 9. Haas
  if (norm.includes('haas')) {
    return (
      <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${sizeClasses} ${className}`} title="Haas F1 Team">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="42" fill="#0e0e12" stroke="#E10600" strokeWidth="4" />
          {/* Haas H */}
          <rect x="30" y="26" width="10" height="48" fill="#E10600" />
          <rect x="60" y="26" width="10" height="48" fill="#E10600" />
          <rect x="30" y="45" width="40" height="10" fill="#E10600" />
          <text x="50" y="90" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="800">HAAS</text>
        </svg>
      </div>
    );
  }

  // 10. Williams
  if (norm.includes('williams')) {
    return (
      <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${sizeClasses} ${className}`} title="Williams Racing">
        <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-md">
          <rect x="8" y="10" width="84" height="60" rx="8" fill="#000A1A" stroke="#00A0DE" strokeWidth="2" />
          {/* Distinctive Williams W */}
          <path
            d="M 22 25 L 34 55 L 46 32 L 54 32 L 66 55 L 78 25 L 68 25 L 60 45 L 50 25 L 44 25 L 38 45 L 30 25 Z"
            fill="#00A0DE"
          />
          <text x="50" y="65" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800" letterSpacing="1">WILLIAMS</text>
        </svg>
      </div>
    );
  }

  // Generic F1 Badge Fallback
  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 rounded-lg bg-neutral-900 border border-neutral-800 ${sizeClasses} ${className}`}>
      <span className="font-black text-red-500 text-xs italic tracking-tighter">F1</span>
    </div>
  );
};
