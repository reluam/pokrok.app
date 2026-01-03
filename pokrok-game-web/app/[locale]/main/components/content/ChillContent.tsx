'use client'

export function ChillContent() {
  const chillPlaces = [
    // Tropical Beach - Line Art Style
    {
      name: 'Tropická pláž',
      background: 'linear-gradient(180deg, #E6F3FF 0%, #87CEEB 30%, #F4A460 70%, #DEB887 100%)',
      svg: (
        <svg viewBox="0 0 400 300" className="w-full h-full">
          {/* Sky */}
          <defs>
            <pattern id="skyGradient" patternUnits="userSpaceOnUse" width="400" height="150">
              <stop offset="0%" stopColor="#E6F3FF"/>
              <stop offset="100%" stopColor="#87CEEB"/>
            </pattern>
          </defs>
          
          {/* Background sky */}
          <rect width="400" height="150" fill="url(#skyGradient)"/>
          
          {/* Ocean waves */}
          <path d="M0,150 Q50,140 100,150 T200,150 T300,150 T400,150 L400,200 L0,200 Z" fill="#4682B4" stroke="#2E5B8A" strokeWidth="1"/>
          <path d="M0,160 Q30,155 60,160 T120,160 T180,160 T240,160 T300,160 T360,160 T400,160 L400,200 L0,200 Z" fill="#5A9BD4" stroke="#2E5B8A" strokeWidth="0.5"/>
          <path d="M0,170 Q40,165 80,170 T160,170 T240,170 T320,170 T400,170 L400,200 L0,200 Z" fill="#6BB6E8" stroke="#2E5B8A" strokeWidth="0.5"/>
          
          {/* Beach */}
          <path d="M0,200 Q100,190 200,200 T400,200 L400,300 L0,300 Z" fill="#DEB887" stroke="#CD853F" strokeWidth="1"/>
          
          {/* Palm trees */}
          {/* Left palm */}
          <line x1="80" y1="200" x2="80" y2="120" stroke="#8B4513" strokeWidth="3"/>
          <path d="M80,120 Q60,100 40,120 Q60,110 80,120 Q100,100 120,120 Q100,110 80,120" fill="none" stroke="#228B22" strokeWidth="2"/>
          <path d="M80,120 Q70,100 50,110 Q70,105 80,120 Q90,100 110,110 Q90,105 80,120" fill="none" stroke="#228B22" strokeWidth="1.5"/>
          
          {/* Right palm */}
          <line x1="320" y1="200" x2="320" y2="100" stroke="#8B4513" strokeWidth="4"/>
          <path d="M320,100 Q300,80 280,100 Q300,90 320,100 Q340,80 360,100 Q340,90 320,100" fill="none" stroke="#228B22" strokeWidth="2.5"/>
          <path d="M320,100 Q310,80 290,90 Q310,85 320,100 Q330,80 350,90 Q330,85 320,100" fill="none" stroke="#228B22" strokeWidth="2"/>
          
          {/* Center palm */}
          <line x1="200" y1="200" x2="200" y2="110" stroke="#8B4513" strokeWidth="3.5"/>
          <path d="M200,110 Q180,90 160,110 Q180,100 200,110 Q220,90 240,110 Q220,100 200,110" fill="none" stroke="#228B22" strokeWidth="2.2"/>
          <path d="M200,110 Q190,90 170,100 Q190,95 200,110 Q210,90 230,100 Q210,95 200,110" fill="none" stroke="#228B22" strokeWidth="1.8"/>
          
          {/* Sun */}
          <circle cx="350" cy="50" r="15" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
          <line x1="350" y1="20" x2="350" y2="15" stroke="#FFA500" strokeWidth="1"/>
          <line x1="365" y1="35" x2="370" y2="30" stroke="#FFA500" strokeWidth="1"/>
          <line x1="365" y1="65" x2="370" y2="70" stroke="#FFA500" strokeWidth="1"/>
          <line x1="335" y1="65" x2="330" y2="70" stroke="#FFA500" strokeWidth="1"/>
          <line x1="335" y1="35" x2="330" y2="30" stroke="#FFA500" strokeWidth="1"/>
          
          {/* Clouds */}
          <ellipse cx="100" cy="40" rx="20" ry="8" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
          <ellipse cx="120" cy="40" rx="15" ry="6" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
          <ellipse cx="110" cy="35" rx="12" ry="5" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
          
          <ellipse cx="250" cy="60" rx="18" ry="7" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
          <ellipse cx="270" cy="60" rx="12" ry="5" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
          
          {/* Small birds */}
          <path d="M150,80 Q155,75 160,80" fill="none" stroke="#2C3E50" strokeWidth="1"/>
          <path d="M180,70 Q185,65 190,70" fill="none" stroke="#2C3E50" strokeWidth="1"/>
          <path d="M220,90 Q225,85 230,90" fill="none" stroke="#2C3E50" strokeWidth="1"/>
        </svg>
      )
    },
    // Mountain Landscape
    {
      name: 'Horské panorama',
      background: 'linear-gradient(180deg, #E6F3FF 0%, #B0C4DE 20%, #708090 40%, #2F4F4F 100%)',
      svg: (
        <svg viewBox="0 0 400 300" className="w-full h-full">
          {/* Sky */}
          <rect width="400" height="150" fill="#E6F3FF"/>
          
          {/* Mountains */}
          <path d="M0,150 L50,80 L100,120 L150,60 L200,100 L250,40 L300,80 L350,50 L400,90 L400,150 Z" fill="#708090" stroke="#2F4F4F" strokeWidth="1"/>
          <path d="M0,150 L30,100 L60,130 L90,90 L120,110 L150,70 L180,100 L210,60 L240,90 L270,50 L300,80 L330,40 L360,70 L400,60 L400,150 Z" fill="#8A9BA8" stroke="#2F4F4F" strokeWidth="0.8"/>
          
          {/* Foreground mountains */}
          <path d="M0,150 L80,100 L160,130 L240,80 L320,110 L400,90 L400,150 Z" fill="#2F4F4F" stroke="#1A252F" strokeWidth="1.2"/>
          
          {/* Sun */}
          <circle cx="350" cy="50" r="12" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
          
          {/* Clouds */}
          <ellipse cx="100" cy="40" rx="25" ry="10" fill="none" stroke="#FFFFFF" strokeWidth="2"/>
          <ellipse cx="120" cy="40" rx="18" ry="8" fill="none" stroke="#FFFFFF" strokeWidth="2"/>
          <ellipse cx="110" cy="35" rx="15" ry="6" fill="none" stroke="#FFFFFF" strokeWidth="2"/>
          
          <ellipse cx="250" cy="60" rx="20" ry="8" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
          <ellipse cx="270" cy="60" rx="15" ry="6" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
          
          {/* Trees */}
          <line x1="50" y1="150" x2="50" y2="120" stroke="#8B4513" strokeWidth="2"/>
          <path d="M50,120 Q40,110 30,120 Q40,115 50,120 Q60,110 70,120 Q60,115 50,120" fill="none" stroke="#228B22" strokeWidth="1.5"/>
          
          <line x1="150" y1="150" x2="150" y2="110" stroke="#8B4513" strokeWidth="2.5"/>
          <path d="M150,110 Q140,100 130,110 Q140,105 150,110 Q160,100 170,110 Q160,105 150,110" fill="none" stroke="#228B22" strokeWidth="2"/>
          
          <line x1="300" y1="150" x2="300" y2="125" stroke="#8B4513" strokeWidth="2"/>
          <path d="M300,125 Q290,115 280,125 Q290,120 300,125 Q310,115 320,125 Q310,120 300,125" fill="none" stroke="#228B22" strokeWidth="1.5"/>
        </svg>
      )
    },
    // Forest
    {
      name: 'Tajemný les',
      background: 'linear-gradient(180deg, #E6F3FF 0%, #87CEEB 20%, #228B22 60%, #006400 100%)',
      svg: (
        <svg viewBox="0 0 400 300" className="w-full h-full">
          {/* Sky */}
          <rect width="400" height="120" fill="#E6F3FF"/>
          
          {/* Ground */}
          <rect width="400" height="180" y="120" fill="#228B22"/>
          
          {/* Trees */}
          {/* Left tree */}
          <line x1="80" y1="300" x2="80" y2="100" stroke="#8B4513" strokeWidth="4"/>
          <path d="M80,100 Q60,80 40,100 Q60,90 80,100 Q100,80 120,100 Q100,90 80,100" fill="none" stroke="#228B22" strokeWidth="3"/>
          <path d="M80,100 Q70,80 50,90 Q70,85 80,100 Q90,80 110,90 Q90,85 80,100" fill="none" stroke="#228B22" strokeWidth="2"/>
          
          {/* Center tree */}
          <line x1="200" y1="300" x2="200" y2="80" stroke="#8B4513" strokeWidth="5"/>
          <path d="M200,80 Q180,60 160,80 Q180,70 200,80 Q220,60 240,80 Q220,70 200,80" fill="none" stroke="#228B22" strokeWidth="3.5"/>
          <path d="M200,80 Q190,60 170,70 Q190,65 200,80 Q210,60 230,70 Q210,65 200,80" fill="none" stroke="#228B22" strokeWidth="2.5"/>
          
          {/* Right tree */}
          <line x1="320" y1="300" x2="320" y2="90" stroke="#8B4513" strokeWidth="4"/>
          <path d="M320,90 Q300,70 280,90 Q300,80 320,90 Q340,70 360,90 Q340,80 320,90" fill="none" stroke="#228B22" strokeWidth="3"/>
          <path d="M320,90 Q310,70 290,80 Q310,75 320,90 Q330,70 350,80 Q330,75 320,90" fill="none" stroke="#228B22" strokeWidth="2"/>
          
          {/* Sun */}
          <circle cx="350" cy="50" r="15" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
          
          {/* Birds */}
          <path d="M150,60 Q155,55 160,60" fill="none" stroke="#2C3E50" strokeWidth="1.5"/>
          <path d="M180,70 Q185,65 190,70" fill="none" stroke="#2C3E50" strokeWidth="1.5"/>
          <path d="M220,50 Q225,45 230,50" fill="none" stroke="#2C3E50" strokeWidth="1.5"/>
          
          {/* Small plants */}
          <path d="M50,300 Q45,290 40,300 Q45,295 50,300 Q55,290 60,300 Q55,295 50,300" fill="none" stroke="#228B22" strokeWidth="1"/>
          <path d="M120,300 Q115,290 110,300 Q115,295 120,300 Q125,290 130,300 Q125,295 120,300" fill="none" stroke="#228B22" strokeWidth="1"/>
        </svg>
      )
    }
  ]

  const randomPlace = chillPlaces[Math.floor(Math.random() * chillPlaces.length)]

  return (
    <div className="w-full h-full relative overflow-hidden" style={{
      background: randomPlace.background,
      minHeight: '400px'
    }}>
      {randomPlace.svg}
      
      {/* Place name */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-lg font-semibold text-center bg-black bg-opacity-30 px-4 py-2 rounded-lg">
        {randomPlace.name}
      </div>
    </div>
  )
}

