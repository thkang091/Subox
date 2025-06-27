'use client'
import React from "react"

const Badge = ({ bgColor, icon }: {
  bgColor: string
  icon: React.ReactNode
}) => (
  <div className="w-12 h-12">
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* Background bottle cap */}
      <path
        d="M50,2 
          C54,10 66,6 70,12 
          C74,18 86,14 88,22 
          C90,30 98,34 96,42 
          C94,50 100,58 94,64 
          C88,70 90,82 82,86 
          C74,90 70,98 62,96 
          C54,94 46,100 38,96 
          C30,92 26,94 18,88 
          C10,82 12,70 6,64 
          C0,58 6,50 4,42 
          C2,34 10,30 12,22 
          C14,14 26,18 30,12 
          C34,6 46,10 50,2 Z"
        fill={bgColor}
      />

      {/* Icon */}
      {icon}
    </svg>
  </div>
)

const Badges = () => {
  return (
    <div className="flex flex-wrap gap-4">
      {/* Badge 1: School (Maroon) */}
      <Badge
        bgColor="#7C2529"
        icon={
          <text
            x="50%"
            y="60%"
            textAnchor="middle"
            fill="#FFD700"
            fontSize="40"
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
            dy=".3em"
          >
            M
          </text>
        }
      />

      {/* Badge 2: Alumni (Blue) */}
      <Badge
        bgColor="#2C4F91"
        icon={
          <g transform="translate(25, 35) scale(0.5)">
            <path d="M50 10 L90 25 L50 40 L10 25 Z" fill="#000" />
            <rect x="45" y="40" width="10" height="15" fill="#000" />
            <line x1="90" y1="25" x2="90" y2="38" stroke="#000" strokeWidth="3" />
            <circle cx="90" cy="38" r="2.5" fill="#000" />
          </g>
        }
      />

      {/* Badge 3: Trusted Seller (Yellow, Handshake) */}
      <Badge
        bgColor="#F4B400"
        icon={
          <g transform="translate(28, 35) scale(0.035)">
            <path
              fill="#000"
              d="M480.5 131.9l-54.5-54.5c-14.6-14.6-38.3-14.6-52.9 0l-61.1 61.1-33.1-33.1c-14.6-14.6-38.3-14.6-52.9 0l-54.5 54.5c-14.6 14.6-14.6 38.3 0 52.9l33.1 33.1-138.5 138.5c-19.4 19.4-19.4 50.9 0 70.3l52.9 52.9c19.4 19.4 50.9 19.4 70.3 0l138.5-138.5 33.1 33.1c14.6 14.6 38.3 14.6 52.9 0l54.5-54.5c14.6-14.6 14.6-38.3 0-52.9l-33.1-33.1 61.1-61.1c14.6-14.6 14.6-38.3 0-52.9z"
            />
          </g>
        }
      />

      {/* Badge 4: Best Rater (Black) */}
      <Badge
        bgColor="#000000"
        icon={
          <g transform="translate(50, 50)" fill="#FFD700">
            {Array.from({ length: 5 }).map((_, i) => {
              const angle = (i * 72) * (Math.PI / 180);
              const radius = 18;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              return (
                <polygon
                  key={i}
                  points="0,-6 1.8,-1.8 6,0 1.8,1.8 0,6 -1.8,1.8 -6,0 -1.8,-1.8"
                  transform={`translate(${x}, ${y}) scale(0.8)`}
                />
              );
            })}
          </g>
        }
      />
    </div>
  )
}

export default Badges
