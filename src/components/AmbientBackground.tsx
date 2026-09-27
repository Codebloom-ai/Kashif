import React from 'react';

/**
 * AmbientBackground
 * 
 * Renders large, soft-edged organic blob shapes that drift continuously and independently
 * at rest with an authentic tactile grain overlay.
 *
 * Specifics:
 * - 3 asymmetrical organic SVG blob shapes (upper-right near hero, lower-left, lower-right near fold)
 * - Violet (#7C3AED / #6366F1), periwinkle/sky-blue (#0284C7 / #38BDF8), and soft lavender (#A78BFA / #C4B5FD)
 * - 16-18% opacity, distinctively visible against the #FAF8F5 warm off-white foundation
 * - Heavy diffuse blur (70-85px) for soft, luminous atmospheric clouds
 * - Independent non-synchronous animations (18s, 24s, 30s) running automatically at rest
 * - Subtle 2.8% grain/noise texture on top of shapes for a tactile, handcrafted paper feel
 * - Respects prefers-reduced-motion
 * - Sits at z-0 with pointer-events-none behind all interactive elements
 */
export const AmbientBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      {/* ========================================================================= */}
      {/* SHAPE 1: Large Soft Violet / Iris Blob (Upper-Right near Hero)           */}
      {/* 18s continuous drifting cycle, 85px diffuse blur, 18% opacity             */}
      {/* ========================================================================= */}
      <div
        className="absolute top-[2%] -right-[6%] sm:right-[1%] lg:right-[4%] w-[520px] h-[520px] sm:w-[620px] sm:h-[620px] lg:w-[700px] lg:h-[700px] animate-blob-1"
        style={{
          filter: 'blur(85px)',
          opacity: 0.18,
          willChange: 'transform',
        }}
      >
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="violetHeroBlobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="60%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>
          {/* Asymmetrical organic amoeba silhouette */}
          <path
            d="M421.5,317.5Q369,385,291.5,417Q214,449,141,409.5Q68,370,53.5,286Q39,202,96,140Q153,78,235.5,55Q318,32,388,88.5Q458,145,466,222.5Q474,300,421.5,317.5Z"
            fill="url(#violetHeroBlobGrad)"
          />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* SHAPE 2: Periwinkle / Sky-Blue Blob (Lower-Left)                          */}
      {/* 24s continuous drifting cycle, 85px diffuse blur, 17% opacity             */}
      {/* ========================================================================= */}
      <div
        className="absolute top-[44%] -left-[10%] sm:-left-[4%] lg:left-[2%] w-[480px] h-[480px] sm:w-[580px] sm:h-[580px] lg:w-[640px] lg:h-[640px] animate-blob-2"
        style={{
          filter: 'blur(85px)',
          opacity: 0.17,
          willChange: 'transform',
        }}
      >
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="skyMidBlobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="55%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          {/* Asymmetrical organic amoeba silhouette */}
          <path
            d="M439,324.5Q394,399,313,425Q232,451,162,408.5Q92,366,60,286Q28,206,82,141Q136,76,218.5,58Q301,40,378,88.5Q455,137,470,218.5Q485,300,439,324.5Z"
            fill="url(#skyMidBlobGrad)"
          />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* SHAPE 3: Soft Lilac / Lavender Blob (Lower-Right near the fold)          */}
      {/* 30s continuous drifting cycle, 70px diffuse blur, 18% opacity             */}
      {/* ========================================================================= */}
      <div
        className="absolute top-[72%] right-[2%] sm:right-[6%] lg:right-[10%] w-[380px] h-[380px] sm:w-[440px] sm:h-[440px] lg:w-[480px] lg:h-[480px] animate-blob-3"
        style={{
          filter: 'blur(70px)',
          opacity: 0.18,
          willChange: 'transform',
        }}
      >
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="lavenderFoldBlobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C4B5FD" />
              <stop offset="50%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          {/* Asymmetrical organic amoeba silhouette */}
          <path
            d="M393.5,306Q340,362,266,394Q192,426,132,377.5Q72,329,54,248.5Q36,168,99.5,115.5Q163,63,243.5,52.5Q324,42,387,97.5Q450,153,448.5,226.5Q447,300,393.5,306Z"
            fill="url(#lavenderFoldBlobGrad)"
          />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* TACTILE GRAIN/NOISE OVERLAY (2.8% fine noise draped on top of shapes)     */}
      {/* Gives tactile, handcrafted, editorial paper texture                       */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-0 bg-noise pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
};
