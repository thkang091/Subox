'use client'
import React from "react"

const Badge = ({ bgColor, icon, title }: {
  bgColor: string
  icon: React.ReactNode
  title: string
}) => (
  <div 
    className="w-8 h-8 relative group cursor-help"
    title={title}
  >
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

    {/* Custom Tooltip */}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
      {title}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
    </div>
  </div>
)

const Badges = ({ listing, hostData, className }: {
  listing?: any
  hostData?: any
  className?: string
}) => {
  // Badge conditions for move out sale
  const hasUmnEmail = hostData?.badges?.studentVerified || (listing?.hostEmail && listing.hostEmail.includes('@umn.edu'))
  const isAlumni = hostData?.isAlumni
  const isTrustedSeller = hostData?.totalReviews >= 10 && hostData?.averageRating >= 4.5
  const isBestBuyer = hostData?.purchaseCount >= 15 // Example condition for best buyer
  const isBestRenter = hostData?.rentalCount >= 4 // Example condition for best renter
  const isActiveReviewer = hostData?.reviewsGivenCount >= 20
  const isBestRater = hostData?.averageRating >= 4.8

  // const hasUmnEmail = hostData?.badges?.studentVerified || (listing?.hostEmail && listing.hostEmail.includes('@umn.edu'))
  // const isAlumni = hostData?.badges?.studentVerified || (listing?.hostEmail && listing.hostEmail.includes('@umn.edu'))
  // const isTrustedSeller = hostData?.badges?.studentVerified || (listing?.hostEmail && listing.hostEmail.includes('@umn.edu'))
  // const isBestBuyer = hostData?.badges?.studentVerified || (listing?.hostEmail && listing.hostEmail.includes('@umn.edu'))
  // const isBestRenter = hostData?.badges?.studentVerified || (listing?.hostEmail && listing.hostEmail.includes('@umn.edu'))
  // const isActiveReviewer = hostData?.badges?.studentVerified || (listing?.hostEmail && listing.hostEmail.includes('@umn.edu'))
  // const isBestRater = hostData?.badges?.studentVerified || (listing?.hostEmail && listing.hostEmail.includes('@umn.edu'))

  const badges = []

  // School Badge (UMN Student)
  if (hasUmnEmail) {
    badges.push({
      key: 'school',
      bgColor: '#7A0019',
      title: 'UMN Student',
      icon: (
        <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Maroon base circle */}
        <circle cx="50" cy="50" r="48" fill="#7A0019" />
        
        {/* Wavy bottle cap edge */}
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
              fill="#7A0019"
            />
          );
        })}

        {/* Gold "M" */}
        <text
          x="50"
          y="64"
          textAnchor="middle"
          fontSize="45"
          fontWeight="900"
          fill="#FFCC33"
          fontFamily="Georgia, serif"
        >
          M
        </text>
      </svg>
      )
    })
  }

  // Alumni Badge
  if (isAlumni) {
    badges.push({
      key: 'alumni',
      bgColor: '#2196F3',
      title: 'Alumni',
      icon: (
        <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
        aria-label="Graduation Badge Icon"
        role="img"
      >
        <title>Graduation</title>

        {/* Blue circular base */}
        <circle cx="50" cy="50" r="48" fill="#2196F3" />

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
              fill="#2196F3"
            />
          );
        })}

        {/* Graduation Cap with Larger Size */}
        <g transform="translate(70, 34) scale(0.022, -0.022) translate(-2500, -2500)">
          <path d="M1538 2733 c-9 -2 -290 -133 -625 -291 -426 -202 -609 -293 -611
          -305 -3 -14 16 -26 77 -54 l81 -36 0 -217 c0 -119 3 -257 6 -306 l7 -89 -42
          -18 c-51 -23 -92 -80 -98 -139 -5 -54 29 -125 74 -153 28 -18 32 -25 33 -65 0
          -117 -50 -296 -110 -389 -40 -61 -99 -123 -143 -149 -29 -18 -41 -41 -32 -63
          6 -14 232 -185 259 -195 19 -7 77 46 114 104 68 106 77 222 37 446 -13 76 -27
          171 -31 211 -6 71 -6 72 19 79 36 9 87 55 103 93 32 75 4 163 -66 209 l-40 27
          0 283 c0 156 2 284 5 284 3 0 184 -84 403 -187 561 -263 583 -273 621 -273 23
          0 164 62 450 196 229 108 507 239 619 292 111 52 202 100 202 107 0 7 -6 17
          -12 22 -27 21 -1225 571 -1253 576 -16 3 -37 3 -47 0z"/>
          <path d="M2005 1628 c-198 -93 -377 -172 -397 -175 -60 -9 -109 9 -413 153
          -160 75 -314 147 -343 160 l-53 24 3 -273 3 -274 30 -43 c73 -106 261 -194
          500 -235 119 -20 353 -23 470 -6 266 40 471 138 542 258 l28 48 3 268 c2 147
          0 267 -5 266 -4 0 -170 -77 -368 -171z"/>
        </g>
      </svg>
      )
    })
  }

  // Trusted Seller Badge
  if (isTrustedSeller) {
    badges.push({
      key: 'trustedSeller',
      bgColor: '#FFD700',
      title: 'Trusted Seller',
      icon: (
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Yellow base */}
        <circle cx="50" cy="50" r="48" fill="#FFD700" />

        {/* Wavy edge (bottle cap) */}
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
          return <path key={i} d={`M${x1},${y1} Q${x2},${y2} ${x3},${y3} Z`} fill="#FFD700" />;
        })}

        {/* Larger Handshake Icon */}
        <g transform="translate(35, 63) scale(0.007, -0.007) translate(-2500, -2500)">
          <path d="M4245 8763 c-337 -82 -607 -271 -782 -548 -64 -100 -125 -256 -159
          -405 -24 -104 -24 -377 0 -470 57 -214 114 -343 212 -473 87 -115 223 -241
          339 -314 52 -33 207 -104 265 -122 159 -48 196 -53 370 -53 175 0 209 5 375
          55 245 74 506 278 652 512 27 42 106 208 114 238 60 224 58 216 59 394 0 135
          -4 189 -19 251 -35 148 -72 241 -153 384 -102 180 -382 420 -558 478 -14 5
          -50 18 -80 29 -126 48 -211 61 -398 60 -118 -1 -197 -6 -237 -16z m841 -724
          c32 -30 46 -84 34 -133 -8 -34 -60 -90 -387 -418 -403 -404 -409 -408 -489
          -393 -32 6 -65 33 -206 173 -133 131 -170 174 -179 204 -14 54 -2 101 35 137
          28 28 41 32 85 33 63 0 71 -5 189 -121 51 -50 100 -91 110 -91 9 0 157 140
          327 311 171 171 319 315 330 320 35 16 125 3 151 -22z"/>
          <path d="M1686 6187 c-17 -18 -53 -64 -79 -103 -74 -107 -133 -186 -691 -938
          -98 -133 -185 -250 -193 -261 -7 -11 -107 -147 -221 -302 -417 -567 -378 -509
          -368 -547 5 -21 137 -134 326 -278 19 -15 67 -52 105 -82 189 -151 239 -186
          264 -186 35 0 39 4 102 90 147 199 407 549 427 576 12 16 35 47 50 69 15 22
          39 56 54 75 34 44 384 517 435 588 47 65 75 103 241 327 74 99 142 191 152
          205 10 14 50 68 89 120 39 52 71 102 71 111 0 22 -33 57 -110 115 -78 59 -408
          320 -465 368 -65 54 -116 86 -138 86 -11 0 -34 -15 -51 -33z"/>
          <path d="M7655 6191 c-90 -43 -175 -81 -180 -81 -3 0 -35 -14 -72 -31 -88 -40
          -118 -54 -173 -77 -91 -40 -166 -73 -195 -87 -200 -90 -205 -94 -205 -136 0
          -16 6 -43 14 -61 8 -18 35 -84 60 -145 25 -62 67 -164 92 -225 48 -117 85
          -209 136 -338 16 -41 36 -88 43 -105 7 -16 26 -64 43 -105 16 -41 51 -127 77
          -190 26 -63 60 -148 76 -187 16 -40 42 -106 58 -145 16 -40 50 -125 76 -188
          26 -63 61 -149 77 -190 17 -41 36 -88 43 -105 12 -28 32 -76 105 -260 25 -64
          82 -201 147 -360 13 -33 32 -68 40 -77 20 -22 56 -23 96 -2 49 25 54 28 197
          89 73 31 141 61 149 65 9 4 32 15 51 23 19 9 65 30 103 46 37 17 69 31 72 31
          3 0 35 14 72 31 38 17 92 42 120 55 29 14 57 34 63 45 12 22 6 64 -18 119 -30
          71 -41 97 -72 175 -17 44 -37 94 -45 110 -7 17 -19 48 -28 70 -20 53 -76 192
          -92 230 -7 17 -28 66 -45 110 -17 44 -37 94 -45 110 -7 17 -19 48 -28 70 -20
          53 -76 192 -92 230 -7 17 -28 66 -45 110 -18 44 -38 94 -45 110 -7 17 -20 48
          -28 70 -8 22 -36 92 -62 155 -26 63 -61 149 -77 190 -17 41 -36 89 -43 105 -7
          17 -27 65 -44 108 -80 200 -139 346 -195 482 -25 61 -46 115 -46 121 0 19 -46
          54 -71 54 -13 0 -42 -9 -64 -19z"/>
          <path d="M4325 5511 c-57 -8 -172 -53 -229 -89 -22 -14 -83 -66 -135 -116
          -691 -659 -698 -667 -706 -709 -16 -86 16 -140 110 -183 127 -58 221 -76 390
          -76 185 0 299 27 450 104 219 113 269 132 380 147 169 21 343 -26 478 -130 40
          -32 507 -405 632 -506 33 -26 72 -57 86 -68 15 -11 73 -58 130 -104 138 -111
          171 -138 239 -191 31 -25 135 -108 231 -186 162 -130 296 -223 344 -237 11 -3
          45 -15 75 -27 54 -21 81 -28 205 -50 104 -18 182 -12 478 37 107 18 110 21 83
          85 -8 18 -29 69 -46 113 -18 44 -38 94 -45 110 -12 28 -32 76 -105 260 -15 39
          -49 122 -75 185 -26 63 -54 133 -62 155 -9 22 -21 54 -28 70 -8 17 -27 65 -44
          108 -54 135 -93 231 -106 262 -7 17 -28 66 -45 110 -17 44 -37 94 -45 110 -7
          17 -20 50 -30 75 -9 25 -23 59 -30 75 -7 17 -26 64 -43 105 -64 159 -95 236
          -107 265 -12 26 -58 141 -86 213 -12 30 -33 27 -104 -14 -203 -117 -325 -147
          -507 -125 -57 7 -136 19 -177 27 -40 8 -87 14 -103 14 -17 0 -67 7 -112 15
          -44 8 -126 21 -181 29 -55 9 -134 21 -175 27 -41 7 -91 13 -110 16 -19 2 -79
          10 -132 18 -54 8 -144 22 -200 30 -57 9 -143 22 -193 30 -110 18 -282 26 -350
          16z"/>
          <path d="M2377 5081 c-89 -120 -250 -338 -357 -485 -107 -146 -266 -361 -353
          -478 -87 -117 -197 -267 -244 -333 -47 -66 -101 -139 -120 -163 -43 -53 -39
          -67 32 -118 63 -45 135 -138 163 -210 11 -27 23 -80 27 -117 4 -37 11 -69 15
          -72 4 -2 31 13 60 35 91 68 191 110 301 128 91 15 107 15 199 0 292 -47 502
          -268 539 -566 6 -46 14 -88 17 -94 4 -6 27 -8 58 -4 121 15 284 -28 391 -102
          71 -49 111 -88 159 -157 79 -111 108 -194 116 -330 l5 -100 95 -6 c95 -5 210
          -40 251 -75 8 -8 19 -14 23 -14 4 0 32 -21 61 -47 107 -92 178 -228 194 -373
          l6 -55 95 -7 c140 -9 226 -38 331 -110 95 -64 160 -153 211 -285 20 -49 23
          -77 23 -188 0 -135 -2 -143 -56 -261 -11 -23 -17 -48 -14 -56 11 -29 105 -58
          186 -58 158 0 275 92 314 248 13 51 14 73 5 114 -16 78 -44 133 -92 180 -35
          36 -219 183 -372 298 -18 14 -78 60 -132 103 -55 43 -151 118 -215 167 -151
          115 -169 137 -169 202 0 66 33 113 90 128 74 20 68 24 425 -255 147 -115 221
          -172 350 -272 55 -42 135 -105 178 -140 162 -131 234 -155 362 -118 58 17 131
          74 163 128 34 55 47 138 33 205 -18 82 -60 137 -159 210 -89 64 -269 193 -422
          302 -149 106 -333 238 -414 297 -86 63 -116 101 -116 151 0 63 38 111 103 132
          61 19 60 20 509 -303 68 -48 165 -118 217 -155 51 -37 128 -92 170 -123 279
          -203 365 -236 498 -194 68 22 102 42 151 89 130 123 147 314 40 462 -23 32
          -132 120 -378 303 -190 141 -361 268 -380 281 -19 14 -42 30 -50 37 -8 6 -82
          61 -164 122 -82 61 -157 123 -168 138 -11 18 -18 46 -18 77 0 43 4 53 39 87
          35 35 44 39 91 39 47 0 59 -5 137 -61 47 -33 91 -65 97 -70 11 -10 443 -330
          531 -394 28 -20 143 -106 258 -191 114 -85 211 -154 216 -154 5 0 14 -6 20
          -14 11 -13 24 -17 116 -36 84 -18 242 46 294 118 45 64 61 114 61 198 0 59 -4
          85 -14 94 -8 6 -48 17 -88 25 -263 47 -387 114 -738 395 -81 65 -195 156 -294
          235 -127 101 -322 257 -361 290 -22 18 -89 72 -150 120 -60 47 -137 108 -170
          135 -334 270 -362 289 -469 309 -95 18 -165 0 -330 -83 -147 -74 -172 -85
          -271 -116 -136 -43 -190 -50 -370 -50 -176 0 -234 7 -360 46 -202 62 -306 136
          -375 264 -34 64 -35 68 -34 180 0 109 2 119 32 181 28 57 59 92 209 238 105
          102 173 175 167 181 -5 5 -151 10 -324 12 -284 3 -319 5 -360 23 -50 21 -121
          67 -140 90 -7 8 -16 15 -21 15 -5 0 -82 -99 -172 -219z"/>
          <path d="M1903 2995 c-103 -25 -168 -79 -293 -245 -36 -47 -70 -92 -76 -100
          -7 -8 -32 -40 -56 -70 -280 -354 -310 -404 -316 -522 -6 -125 33 -217 132
          -304 76 -68 137 -89 251 -88 93 2 121 10 207 63 36 22 110 108 264 309 43 57
          128 167 187 245 153 199 161 217 161 347 -1 125 -18 170 -93 252 -56 61 -112
          95 -191 114 -66 16 -108 16 -177 -1z"/>
          <path d="M2612 2302 c-64 -33 -107 -73 -177 -166 -30 -39 -98 -128 -152 -198
          -306 -396 -305 -395 -323 -487 -8 -39 -7 -71 1 -115 36 -189 214 -313 397
          -276 65 13 150 55 184 90 14 15 112 136 198 246 78 98 268 333 286 353 12 13
          36 52 53 87 27 55 31 75 31 144 0 146 -63 246 -201 320 -52 27 -65 30 -150 30
          -82 -1 -101 -4 -147 -28z"/>
          <path d="M3335 1622 c-79 -33 -95 -50 -255 -252 -72 -92 -163 -203 -183 -225
          -36 -39 -77 -109 -88 -149 -18 -68 -6 -167 28 -228 66 -117 207 -185 331 -159
          95 21 142 59 244 196 37 50 88 117 112 150 132 176 159 214 183 265 37 78 41
          145 12 222 -29 79 -102 155 -175 181 -61 21 -156 21 -209 -1z"/>
          <path d="M4005 1053 c-72 -30 -97 -50 -167 -140 -38 -48 -75 -95 -81 -103
          -119 -148 -142 -197 -141 -299 2 -109 39 -182 121 -242 77 -55 117 -69 198
          -69 122 0 204 51 292 183 26 39 50 77 53 82 3 6 23 37 45 70 67 102 77 131 78
          225 0 72 -4 93 -26 136 -68 134 -245 209 -372 157z"/>
        </g>
      </svg>
      )
    })
  }

  // Best Buyer Badge
  if (isBestBuyer) {
    badges.push({
      key: 'bestBuyer',
      bgColor: '#4CAF50',
      title: 'Best Buyer',
      icon: (
        <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-label="Rent contract badge icon"
      role="img"
    >
      <title>Best Buyer</title>

      {/* Green circular base */}
      <circle cx="50" cy="50" r="48" fill="#4CAF50" />

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
            fill="#4CAF50"
          />
        );
      })}

      {/* Money Icon */}
      <g transform="translate(72, 27) scale(0.02, -0.02) translate(-2500, -2500)">
        <path d="M744 2360 c-229 -13 -453 -52 -657 -115 l-87 -26 0 -630 c0 -385 4
        -629 9 -629 6 0 64 13 130 29 515 126 1005 129 1968 11 134 -17 247 -30 253
        -30 7 0 10 211 10 630 l0 629 -32 5 c-112 19 -783 98 -933 110 -240 20 -489
        26 -661 16z m169 -192 c-69 -71 -108 -137 -140 -233 -23 -70 -27 -97 -27 -215
        -1 -114 3 -146 22 -210 28 -88 69 -167 123 -231 l39 -46 -143 -7 c-130 -7
        -182 -12 -348 -32 l-56 -6 -7 38 c-19 101 -79 175 -168 205 l-53 18 -3 220
        c-2 195 -1 221 13 221 29 0 92 38 125 76 42 48 60 92 60 148 0 25 3 47 8 49
        31 20 336 54 497 56 l109 1 -51 -52z m830 -4 l227 -27 0 -27 c0 -47 28 -124
        60 -162 34 -41 120 -88 162 -88 l28 0 0 -220 0 -220 -31 0 c-52 0 -107 -21
        -150 -59 -45 -38 -89 -119 -89 -163 0 -20 -5 -28 -17 -28 -24 0 -450 40 -491
        46 l-33 5 50 55 c102 111 155 262 155 439 0 177 -49 318 -151 434 l-47 53 50
        -6 c27 -3 151 -18 277 -32z m-533 -132 c0 -13 12 -22 38 -30 56 -17 84 -52 90
        -112 l5 -50 -71 0 -71 0 -3 38 c-2 29 -7 37 -23 37 -15 0 -21 -8 -23 -28 -4
        -36 11 -53 99 -108 79 -50 109 -96 109 -170 0 -81 -43 -140 -122 -169 -21 -7
        -28 -16 -28 -35 0 -21 -5 -25 -30 -25 -26 0 -30 3 -30 29 0 24 -5 30 -30 34
        -16 4 -46 22 -67 40 -33 31 -37 40 -41 96 l-4 61 71 0 71 0 0 -54 c0 -37 4
        -56 14 -59 22 -9 36 14 36 59 0 45 -6 53 -110 127 -60 44 -83 86 -83 152 0 70
        27 109 94 132 34 12 49 23 49 35 0 13 8 18 30 18 22 0 30 -5 30 -18z"/>
        <path d="M2470 1796 c0 -108 4 -196 9 -198 5 -1 17 -79 25 -173 9 -93 19 -188
        22 -211 6 -40 5 -41 -25 -47 l-31 -6 0 -151 0 -150 -28 0 c-15 0 -82 7 -147
        16 -98 13 -179 15 -445 11 -434 -8 -730 -37 -1022 -103 -59 -13 -109 -24 -112
        -24 -3 0 -6 10 -6 23 0 37 -49 125 -84 152 -39 30 -62 31 -202 9 -97 -15 -103
        -18 -99 -38 2 -11 12 -106 21 -211 9 -104 18 -191 19 -193 2 -2 79 21 172 51
        193 63 380 107 573 136 294 43 353 46 991 46 l617 0 -4 30 c-7 45 -114 1182
        -114 1205 0 18 -7 20 -65 20 l-65 0 0 -194z"/>
        <path d="M2730 1661 c0 -24 87 -953 94 -998 l5 -33 -140 0 -139 0 0 -35 c0
        -41 0 -41 -155 -50 -460 -26 -956 -109 -1293 -216 -51 -17 -95 -29 -96 -27 -1
        2 -10 24 -20 50 -22 61 -98 130 -161 148 -50 14 -92 11 -178 -15 -45 -13 -57
        -20 -53 -33 2 -9 21 -111 42 -227 20 -116 38 -212 40 -214 2 -2 62 22 134 53
        509 219 938 299 1944 361 131 8 240 16 241 17 2 2 -48 280 -109 618 -107 586
        -113 615 -134 618 -16 3 -22 -2 -22 -17z"/>
      </g>
    </svg>
      )
    })
  }

  // Best Renter Badge
  if (isBestRenter) {
    badges.push({
      key: 'bestRenter',
      bgColor: '#faf362ff',
      title: 'Best Renter',
      icon: (
        <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-label="Rent contract badge icon"
      role="img"
    >
      <title>Best Renter</title>

      {/* Green circular base */}
      <circle cx="50" cy="50" r="48" fill="#4CAF50" />

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
            fill="#4CAF50"
          />
        );
      })}

      {/* Even Bigger Center Icon */}
      <g transform="translate(33, 77) scale(0.0045, -0.0045) translate(-2500, -2500)">
        <path d="M4495 13910 c-265 -26 -538 -108 -790 -239 -91 -47 -89 -46 -210
        -125 -278 -182 -549 -479 -694 -760 -23 -44 -38 -83 -34 -87 5 -4 71 -33 148
        -63 77 -31 149 -60 160 -65 11 -5 39 -17 63 -26 47 -20 50 -30 23 -83 -17 -34
        -54 -146 -94 -281 -19 -62 -11 -87 30 -97 53 -14 169 -90 240 -158 147 -138
        225 -304 248 -521 11 -112 -30 -305 -84 -395 -11 -19 -24 -42 -27 -50 -10 -22
        -73 -100 -115 -141 -161 -160 -408 -245 -636 -218 -182 21 -340 90 -458 201
        -145 135 -211 258 -250 462 -19 99 -19 154 1 252 39 195 124 338 271 455 74
        59 224 139 261 139 24 0 52 30 52 56 0 11 7 45 15 75 8 30 23 81 32 114 21 80
        61 200 84 253 29 68 26 78 -27 86 -133 18 -419 -3 -609 -44 -283 -62 -589
        -203 -817 -376 -142 -108 -299 -259 -389 -374 -24 -30 -46 -57 -50 -60 -9 -7
        -118 -175 -147 -225 -82 -146 -161 -340 -207 -510 -9 -33 -23 -83 -31 -111 -8
        -28 -14 -62 -14 -75 0 -13 -7 -57 -15 -98 -22 -105 -22 -479 0 -604 59 -333
        154 -578 323 -838 93 -142 255 -323 390 -434 39 -33 62 -74 62 -112 0 -15 -21
        -107 -46 -203 -25 -96 -49 -191 -53 -211 -4 -19 -11 -41 -15 -47 -3 -6 -10
        -30 -15 -54 -5 -24 -16 -70 -25 -103 -10 -33 -37 -139 -62 -235 -25 -96 -54
        -209 -65 -250 -11 -41 -24 -91 -28 -110 -5 -19 -19 -71 -31 -115 -12 -44 -26
        -96 -31 -115 -4 -19 -17 -69 -29 -110 -12 -41 -24 -101 -27 -133 -6 -59 -1
        -75 62 -212 55 -119 85 -185 85 -189 0 -3 19 -44 41 -93 71 -152 82 -199 57
        -246 -15 -29 -13 -28 -243 -181 -110 -73 -211 -146 -225 -161 -43 -46 -35 -98
        39 -250 35 -71 83 -171 107 -220 59 -121 59 -154 1 -209 -23 -23 -74 -60 -112
        -84 -207 -127 -309 -197 -327 -226 -35 -56 -29 -77 112 -371 101 -211 103
        -218 71 -272 -13 -21 -49 -47 -108 -79 -48 -26 -106 -58 -128 -70 -22 -13 -64
        -36 -94 -51 -126 -65 -141 -120 -70 -252 23 -42 57 -105 77 -141 19 -36 38
        -69 42 -75 4 -5 22 -37 40 -70 18 -33 45 -82 60 -110 15 -27 44 -81 65 -120
        93 -172 134 -213 199 -201 18 4 87 38 152 77 65 39 135 80 154 90 19 11 51 29
        70 40 19 12 100 59 180 106 80 47 186 109 237 139 50 30 101 65 111 79 11 14
        30 58 41 98 27 91 51 171 66 222 26 84 82 275 165 570 5 17 18 62 30 100 12
        39 25 84 30 100 104 368 146 513 166 570 8 23 14 48 14 57 0 10 6 32 14 50 8
        18 35 107 61 198 72 256 86 303 94 330 8 24 24 79 55 185 7 28 27 95 44 150
        16 55 44 152 62 215 39 141 105 365 135 465 36 116 150 512 165 573 5 19 13
        46 18 60 5 15 17 54 27 87 9 33 23 78 30 100 7 22 27 92 45 155 64 232 67 240
        114 261 22 10 54 19 70 19 54 0 222 47 366 103 377 144 721 412 991 772 89
        118 239 379 239 416 0 21 -20 29 -73 29 -63 0 -230 37 -382 86 -201 64 -343
        132 -536 259 -151 99 -185 138 -195 227 -12 106 30 178 133 225 57 26 147 33
        196 14 15 -6 73 -41 130 -78 129 -86 128 -85 217 -129 79 -38 296 -110 415
        -138 103 -23 268 -32 282 -15 6 8 19 61 29 119 28 158 26 510 -4 677 -22 122
        -59 265 -87 336 -8 20 -22 56 -31 80 -9 23 -43 96 -75 162 -239 495 -678 881
        -1219 1073 -65 23 -72 41 -35 95 14 21 25 40 25 43 0 15 145 189 220 264 189
        190 453 352 685 420 215 63 325 80 525 80 200 0 310 -17 525 -80 101 -29 263
        -104 370 -170 182 -112 347 -263 479 -438 84 -111 209 -341 204 -374 -3 -24
        -12 -29 -93 -54 -210 -64 -438 -252 -565 -465 -88 -149 -141 -409 -120 -591 5
        -40 14 -131 20 -203 5 -71 19 -233 30 -360 11 -126 23 -267 27 -311 l6 -81
        -59 -35 c-114 -66 -265 -121 -459 -168 -27 -6 -114 -18 -193 -24 -163 -15
        -166 -17 -202 -103 -13 -32 -38 -89 -56 -128 -60 -130 -84 -187 -84 -201 0 -8
        21 -15 57 -20 83 -10 385 4 473 22 231 47 318 72 453 126 68 28 102 37 109 30
        6 -6 14 -64 19 -129 4 -65 13 -149 18 -188 6 -38 11 -95 11 -125 0 -30 7 -116
        15 -190 8 -74 21 -205 29 -290 16 -171 41 -258 103 -364 82 -141 55 -113 1008
        -1055 253 -250 658 -651 900 -890 242 -239 625 -617 850 -840 226 -223 599
        -593 830 -822 231 -229 439 -428 462 -443 37 -22 53 -26 120 -26 64 1 85 5
        116 24 36 22 141 125 962 935 176 174 635 627 1020 1007 385 380 850 839 1034
        1020 360 355 381 382 381 474 0 93 -20 117 -417 509 -202 201 -561 556 -798
        791 -236 234 -651 644 -921 910 -269 267 -780 772 -1135 1122 -355 351 -672
        658 -704 684 -68 52 -219 144 -238 144 -7 0 -17 4 -22 9 -20 18 -154 51 -250
        61 -128 13 -408 39 -550 50 -159 13 -333 30 -470 46 -67 8 -141 14 -165 14
        -25 0 -108 7 -185 15 -77 8 -210 21 -295 30 -85 8 -225 21 -310 30 -85 8 -174
        15 -197 15 -47 0 -64 13 -82 62 -27 71 -44 115 -59 153 -25 62 -130 264 -161
        310 -100 146 -132 189 -213 282 -175 200 -419 387 -658 504 -112 55 -264 115
        -360 142 -208 58 -327 77 -535 82 -99 2 -220 0 -270 -5z m4963 -4039 c55 -28
        97 -79 117 -140 17 -51 17 -56 0 -115 l-18 -61 -570 -565 c-313 -311 -583
        -574 -601 -585 -24 -16 -48 -20 -111 -20 -69 0 -85 4 -115 25 -45 32 -51 38
        -78 81 -29 49 -31 153 -2 208 23 46 1132 1146 1182 1172 46 25 147 25 196 0z
        m1216 -1233 c148 -42 222 -202 150 -324 -35 -59 -1121 -1132 -1177 -1161 -100
        -54 -245 -15 -301 81 -33 57 -37 156 -7 214 17 34 1108 1122 1163 1160 21 15
        92 40 117 41 7 1 32 -4 55 -11z"/>
        <path d="M2655 11695 c-103 -38 -193 -144 -216 -254 -13 -62 -1 -160 27 -212
        63 -122 233 -212 357 -188 118 22 211 90 261 191 22 43 26 66 26 133 0 71 -4
        90 -30 142 -36 71 -103 141 -168 174 -59 30 -194 37 -257 14z"/>
      </g>
    </svg>
      )
    })
  }

  // Active Reviewer Badge
  if (isActiveReviewer) {
    badges.push({
      key: 'activeReviewer',
      bgColor: '#000',
      title: 'Active Reviewer',
      icon: (
        <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-label="Pencil Badge Icon"
      role="img"
    >
      <title>Active Reviewer</title>

      {/* White circular base */}
      <circle cx="50" cy="50" r="48" fill="#FFFFFF" />

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
            fill="#FFFFFF"
            stroke="#000"
            strokeWidth="1"
          />
        );
      })}

      {/* Centered, Larger Pencil */}
      <g transform="translate(50, 50) scale(1.1) rotate(-45) translate(-22, -22)">
        
        {/* Eraser */}
        <rect x="20" y="0" width="10" height="5" fill="#000" />

        {/* Body */}
        <rect x="20" y="7" width="10" height="23" fill="#000" />

        {/* Tip */}
        <polygon points="20,30 30,30 25,40" fill="#000" />

      </g>
    </svg>
      )
    })
  }

  // Best Rater Badge (5 Stars)
  if (isBestRater) {
    badges.push({
      key: 'bestRater',
      bgColor: '#000',
      title: 'Best Rater',
      icon: (
        <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        aria-label="Five Star Badge Icon"
        role="img"
      >
        <title>Best Rater</title>

        {/* Black circular base */}
        <circle cx="50" cy="50" r="48" fill="#000" />

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
              fill="#000"
            />
          );
        })}

        {/* Five Stars smaller for spacing */}
        <g>
          {[...Array(5)].map((_, i) => {
            const angle = (i * 360) / 5 - 90;
            const rad = (angle * Math.PI) / 180;
            const r = 20;
            const cx = 50 + r * Math.cos(rad);
            const cy = 50 + r * Math.sin(rad);

            const starPoints = [];
            const numPoints = 5;
            const outerRadius = 10; // Slightly larger
            const innerRadius = 5;

            for (let j = 0; j < numPoints * 2; j++) {
              const isOuter = j % 2 === 0;
              const radius = isOuter ? outerRadius : innerRadius;
              const pointAngle = (j * Math.PI) / numPoints - Math.PI / 2;
              const x = cx + radius * Math.cos(pointAngle);
              const y = cy + radius * Math.sin(pointAngle);
              starPoints.push(`${x},${y}`);
            }

            return (
              <polygon
                key={i}
                points={starPoints.join(" ")}
                fill="#FFD700"
              />
            );
          })}
        </g>
      </svg>
      )
    })
  }

  // If no badges, return null
  if (badges.length === 0) return null

  return (
    <div className={`flex items-center ${className || ''}`} style={{ marginLeft: 'auto' }}>
      {badges.map((badge, index) => (
        <div 
          key={badge.key}
          className="relative"
          style={{ 
            marginLeft: index > 0 ? '-12px' : '0',
            zIndex: index + 1
          }}
        >
          <Badge
            bgColor={badge.bgColor}
            title={badge.title}
            icon={badge.icon}
          />
        </div>
      ))}
    </div>
  )
}

export default Badges