import React from "react";

const RentContractBadgeIcon: React.FC = () => (
<div className="w-12 h-12">
  <svg
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
    aria-label="Military Medal Badge Icon"
    role="img"
  >
    <title>Military Medal Badge Icon</title>

    {/* Military green circular base */}
    <circle cx="50" cy="50" r="48" fill="#4B5320" />

    {/* Wavy edge */}
    {[...Array(20)].map((_, i) => {
      const angle = (i * 360) / 20;
      const rad = (angle * Math.PI) / 180;
      const rOuter = 50;
      const rInner = 45;
      const x1 = 50 + rOuter * Math.cos(rad);
      const y1 = 50 + rOuter * Math.sin(rad);
      const x2 = 50 + rInner * Math.cos(rad + Math.PI / 40);
      const y2 = 50 + rInner * Math.sin(rad + Math.PI / 40);
      const x3 = 50 + rOuter * Math.cos(rad + Math.PI / 20);
      const y3 = 50 + rOuter * Math.sin(rad + Math.PI / 20);
      return (
        <path
          key={i}
          d={`M${x1},${y1} Q${x2},${y2} ${x3},${y3} Z`}
          fill="#4B5320"
        />
      );
    })}

    {/* Military Medal Icon */}
    <g transform="translate(50, 50) scale(0.7) translate(-25, -25)" stroke="#000" strokeWidth="2" fill="none">
      
      {/* Ribbon */}
      <path d="M10 5 L40 5 L35 20 L15 20 Z" />
      <line x1="17" y1="5" x2="17" y2="20" />
      <line x1="25" y1="5" x2="25" y2="20" />
      <line x1="33" y1="5" x2="33" y2="20" />

      {/* Connecting lines to star */}
      <line x1="15" y1="20" x2="25" y2="30" />
      <line x1="35" y1="20" x2="25" y2="30" />

      {/* Star */}
      <polygon
        points="25,35 28,42 35,43 30,48 32,55 25,51 18,55 20,48 15,43 22,42"
        fill="none"
        stroke="#000"
        strokeWidth="2"
      />

    </g>
  </svg>
</div>

);

export default RentContractBadgeIcon;
