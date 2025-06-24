import React from "react"



const badges = () =>
    { return (
        <div className="w-12 h-12">
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
        </div>);
    }

export default badges;