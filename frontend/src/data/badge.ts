import React from "react"



const badges = () =>
    { (
        <div className="w-12 h-12">
        {/* School */}
        <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
        >
            {/* Bottle cap background */}
            <circle cx="50" cy="50" r="48" fill="#7C2529" /> {/* Maroon */}

            {/* Wavy cap edge (simplified shape for SVG badge-like feel) */}
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
            fill="#7C2529"
            />

            {/* M letter */}
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
        </svg>

        {/* Alumni */}
        <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        >
        {/* Bottle cap background */}
        <circle cx="50" cy="50" r="48" fill="#2C4F91" /> {/* Blue */}

        {/* Wavy cap edge */}
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
            fill="#2C4F91"
        />

        {/* Graduation Cap (Gold) */}
        <g transform="translate(25, 35) scale(0.5)">
            <path
            d="M50 10 L90 25 L50 40 L10 25 Z"
            fill="#FFD700"
            />
            <rect x="45" y="40" width="10" height="15" fill="#FFD700" />
            <line x1="90" y1="25" x2="90" y2="38" stroke="#FFD700" strokeWidth="3" />
            <circle cx="90" cy="38" r="2.5" fill="#FFD700" />
        </g>
        </svg>

        {/* Trusted Seller */}
        <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
        >
            {/* Bottle cap background */}
            <circle cx="50" cy="50" r="48" fill="#FFD700" /> {/* Yellow */}

            {/* Wavy cap edge */}
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
                fill="#FFD700"
            />

            {/* Handshake icon */}
            <path
                d="M35 45 C34 42, 38 42, 39 45
                L43 53 C44 55, 46 55, 47 53
                L50 48 L53 53 C54 55, 56 55, 57 53
                L61 45 C62 42, 66 42, 65 45
                L58 60 C57 62, 54 62, 52 60
                L50 56 L48 60 C46 62, 43 62, 42 60 Z"
                fill="#000000"
            />
        </svg>

        {/* Trusted Renter */}
        <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
        >
            {/* Bottle cap background */}
            <circle cx="50" cy="50" r="48" fill="#28a745" /> {/* Green */}

            {/* Wavy cap edge */}
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
                fill="#28a745"
            />

            {/* Rent contraction icon: house with inward arrows */}
            {/* House base */}
            <rect x="30" y="40" width="40" height="25" rx="3" ry="3" fill="#000" />
            {/* Roof */}
            <path d="M30 40 L50 25 L70 40 Z" fill="#000" />
            {/* Left inward arrow */}
            <line x1="20" y1="52" x2="30" y2="52" stroke="#000" strokeWidth="2" />
            <polyline points="25,47 30,52 25,57" fill="none" stroke="#000" strokeWidth="2" />
            {/* Right inward arrow */}
            <line x1="70" y1="52" x2="80" y2="52" stroke="#000" strokeWidth="2" />
            <polyline points="75,47 70,52 75,57" fill="none" stroke="#000" strokeWidth="2" />
        </svg>

        {/* Best rater */}
        <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
        >
            {/* Bottle cap background */}
            <circle cx="50" cy="50" r="48" fill="#000000" /> {/* Black */}

            {/* Wavy cap edge */}
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
                fill="#000000"
            />

            {/* Five stars in star shape */}
            {/* Center star */}
            <polygon
                points="50,35 54,47 67,47 56,55 60,67 50,59 40,67 44,55 33,47 46,47"
                fill="#FFD700"
                stroke="#FFC107"
                strokeWidth="1"
            />
            {/* Top left star */}
            <polygon
                points="36,30 39,36 45,36 40,40 42,46 36,42 30,46 32,40 27,36 33,36"
                fill="#FFD700"
                stroke="#FFC107"
                strokeWidth="0.8"
            />
            {/* Top right star */}
            <polygon
                points="64,30 67,36 73,36 68,40 70,46 64,42 58,46 60,40 55,36 61,36"
                fill="#FFD700"
                stroke="#FFC107"
                strokeWidth="0.8"
            />
            {/* Bottom left star */}
            <polygon
                points="37,60 40,66 46,66 41,70 43,76 37,72 31,76 33,70 28,66 34,66"
                fill="#FFD700"
                stroke="#FFC107"
                strokeWidth="0.8"
            />
            {/* Bottom right star */}
            <polygon
                points="63,60 66,66 72,66 67,70 69,76 63,72 57,76 59,70 54,66 60,66"
                fill="#FFD700"
                stroke="#FFC107"
                strokeWidth="0.8"
            />
        </svg>

        {/* Best reviewer */}
        <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
        >
            {/* Bottle cap background */}
            <circle cx="50" cy="50" r="48" fill="#ffffff" /> {/* White */}

            {/* Wavy cap edge */}
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
                fill="#ffffff"
            />

            {/* Pencil icon */}
            <g fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" transform="translate(30 30) scale(0.8)">
                {/* Pencil body */}
                <rect x="15" y="5" width="10" height="40" fill="#000" />
                {/* Pencil tip */}
                <path d="M15 5 L20 0 L25 5 Z" fill="#000" />
                {/* Pencil eraser */}
                <rect x="15" y="45" width="10" height="5" fill="#555" />
            </g>
        </svg>

        {/* Veteran */}
        <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
        >
            {/* Camouflage background pattern */}
            <defs>
                <pattern id="camo" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
                <rect width="20" height="20" fill="#4B5320" /> {/* Army green */}
                <circle cx="5" cy="5" r="7" fill="#6B4423" /> {/* Brown splotch */}
                <circle cx="15" cy="15" r="7" fill="#C2B280" /> {/* Beige splotch */}
                </pattern>
            </defs>

            {/* Background circle with camo pattern */}
            <circle cx="50" cy="50" r="48" fill="url(#camo)" />

            {/* Wavy cap edge in camo color */}
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
                fill="url(#camo)"
            />

            {/* Military helmet icon */}
            <g
                transform="translate(25 30) scale(1.2)"
                fill="#FFD700"
                stroke="#6B4423"
                strokeWidth="2"
            >
                {/* Helmet dome */}
                <ellipse cx="25" cy="20" rx="25" ry="15" />
                {/* Helmet base */}
                <rect x="5" y="20" width="40" height="15" rx="7" ry="7" />
                {/* Helmet front visor */}
                <path d="M5 20 Q25 10 45 20" stroke="#6B4423" strokeWidth="3" fill="none" />
            </g>
        </svg>
        </div>);
    }

export default badges;