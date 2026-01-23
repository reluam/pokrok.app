"use client";

interface DecorativeShapesProps {
  position?: "left" | "right";
  variant?: "default" | "hero";
}

export default function DecorativeShapes({ position = "right", variant = "default" }: DecorativeShapesProps) {
  const isLeft = position === "left";
  const isHero = variant === "hero";
  
  return (
    <div className="decorative-shapes absolute inset-0 overflow-hidden pointer-events-none">
      {/* Random wavy doodle */}
      <svg 
        className="absolute"
        style={{
          top: isLeft ? '15%' : '25%',
          [isLeft ? 'left' : 'right']: isLeft ? '5%' : '8%',
          width: '120px',
          height: '60px',
          transform: isLeft ? 'rotate(-10deg)' : 'rotate(15deg)',
        }}
        viewBox="0 0 120 60"
        fill="none"
      >
        <path
          d="M10,30 Q30,15 50,30 T90,30 Q100,25 110,30"
          stroke="#FF8C42"
          strokeWidth="2.5"
          opacity="0.12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      
      {/* Another small doodle */}
      <svg 
        className="absolute"
        style={{
          bottom: isLeft ? '20%' : '30%',
          [isLeft ? 'left' : 'right']: isLeft ? '8%' : '12%',
          width: '80px',
          height: '40px',
          transform: isLeft ? 'rotate(20deg)' : 'rotate(-25deg)',
        }}
        viewBox="0 0 80 40"
        fill="none"
      >
        <path
          d="M5,20 Q20,5 40,20 T75,20"
          stroke="#4ECDC4"
          strokeWidth="2"
          opacity="0.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      
      {/* Extra wavy shapes for hero */}
      {isHero && (
        <>
          {/* Top left wave */}
          <svg 
            className="absolute"
            style={{
              top: '10%',
              left: '3%',
              width: '100px',
              height: '50px',
              transform: 'rotate(-15deg)',
            }}
            viewBox="0 0 100 50"
            fill="none"
          >
            <path
              d="M5,25 Q20,10 40,25 T80,25"
              stroke="#FF8C42"
              strokeWidth="2"
              opacity="0.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          {/* Top right wave */}
          <svg 
            className="absolute"
            style={{
              top: '15%',
              right: '5%',
              width: '90px',
              height: '45px',
              transform: 'rotate(20deg)',
            }}
            viewBox="0 0 90 45"
            fill="none"
          >
            <path
              d="M5,22 Q25,8 50,22 T85,22"
              stroke="#4ECDC4"
              strokeWidth="2"
              opacity="0.08"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          {/* Middle left wave */}
          <svg 
            className="absolute"
            style={{
              top: '50%',
              left: '2%',
              width: '110px',
              height: '55px',
              transform: 'rotate(-5deg)',
            }}
            viewBox="0 0 110 55"
            fill="none"
          >
            <path
              d="M10,27 Q30,12 55,27 T100,27"
              stroke="#B0A7F5"
              strokeWidth="2"
              opacity="0.09"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          {/* Bottom right wave */}
          <svg 
            className="absolute"
            style={{
              bottom: '15%',
              right: '3%',
              width: '95px',
              height: '48px',
              transform: 'rotate(10deg)',
            }}
            viewBox="0 0 95 48"
            fill="none"
          >
            <path
              d="M5,24 Q22,10 45,24 T90,24"
              stroke="#FF8C42"
              strokeWidth="2"
              opacity="0.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          {/* Bottom left wave */}
          <svg 
            className="absolute"
            style={{
              bottom: '10%',
              left: '6%',
              width: '85px',
              height: '42px',
              transform: 'rotate(-20deg)',
            }}
            viewBox="0 0 85 42"
            fill="none"
          >
            <path
              d="M5,21 Q20,8 40,21 T75,21"
              stroke="#4ECDC4"
              strokeWidth="2"
              opacity="0.08"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </>
      )}
    </div>
  );
}
