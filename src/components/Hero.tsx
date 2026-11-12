import { lazy, Suspense } from 'react';
import eldionPortrait from '../assets/eldion-portrait.webp';
import { PROFILE } from '../lib/constants';

const Lanyard = lazy(() => import('./Lanyard'));

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative pt-20 pb-16 md:pt-28 md:pb-24 min-h-[720px] lg:min-h-[820px] flex items-center justify-center overflow-hidden"
    >
      {/* Interactive 3D Lanyard Card spanning the full Hero area, behind texts */}
      <div
        className="absolute inset-0 w-full h-full z-0 pointer-events-auto"
        aria-label="Interactive 3D Profile Card hanging on lanyard"
      >
        <Suspense fallback={null}>
          <Lanyard
            frontImage={eldionPortrait}
            backImage={eldionPortrait}
            cardColor="#141419"
            strapColor="#27272a"
            finish="glossy"
            metal="silver"
            size={0.28}
            anchor="right"
            strapLength={0.45}
            interactive={true}
            breeze={0.25}
          />
        </Suspense>
      </div>

      {/* Hero Content - in front of the 3D canvas (z-10) with text pass-through */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 pointer-events-none">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-center gap-8 sm:gap-12 lg:gap-16 w-full">
          {/* Name and Bio */}
          <div className="flex flex-col items-center lg:items-end text-center lg:text-right shrink-0 select-none">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-3">
              <span className="text-gradient">{PROFILE.name}</span>
            </h1>
            <p className="text-base sm:text-lg text-zinc-400">
              Software engineering student.
            </p>
          </div>

          {/* Reserved space matching where the 3D lanyard hangs on the right */}
          <div className="w-[220px] sm:w-[260px] lg:w-[300px] h-[320px] sm:h-[380px] lg:h-[440px] pointer-events-none shrink-0 hidden sm:block" />
        </div>
      </div>
    </section>
  );
}
