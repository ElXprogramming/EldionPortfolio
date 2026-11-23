import { lazy, Suspense, useEffect, useState } from 'react';
import eldionPortrait from '../assets/eldion-portrait.webp';
import { PROFILE } from '../lib/constants';

const Lanyard = lazy(() => import('./Lanyard'));

export default function Hero() {
  const [mountLanyard, setMountLanyard] = useState(false);

  // Defer WebGL lanyard chunk load until after first paint so Hero text renders immediately
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMountLanyard(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section
      id="hero"
      className="relative pt-24 pb-12 sm:pt-20 sm:pb-16 md:pt-28 md:pb-24 min-h-[700px] lg:min-h-[820px] flex items-end sm:items-center justify-center overflow-hidden"
    >
      {/* Interactive 3D Lanyard Card spanning the full Hero area, behind texts */}
      <div
        className="absolute inset-0 w-full h-full z-0 pointer-events-auto"
        aria-label="Interactive 3D Profile Card hanging on lanyard"
      >
        {mountLanyard && (
          <Suspense fallback={null}>
            <Lanyard
              frontImage={eldionPortrait}
              backImage={eldionPortrait}
              cardColor="#141419"
              strapColor="#27272a"
              size={0.28}
              anchor="right"
              strapLength={0.45}
              interactive={true}
              breeze={0.25}
            />
          </Suspense>
        )}
      </div>

      {/* Hero Content - in front of the 3D canvas (z-10) with text pass-through */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 pointer-events-none">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-center gap-8 sm:gap-12 lg:gap-12 xl:gap-16 w-full">
          {/* Name and Bio */}
          <div className="flex flex-col items-center lg:items-end text-center lg:text-right min-w-0 select-none">
            <h1 className="text-3xl sm:text-5xl xl:text-6xl font-bold tracking-tight text-white mb-3">
              <span className="text-gradient">{PROFILE.name}</span>
            </h1>
            <p className="text-base sm:text-lg text-zinc-400">
              Software engineering student.
            </p>
          </div>

          {/* Reserved space matching where the 3D lanyard hangs on the right */}
          <div className="hidden sm:block sm:w-[240px] lg:w-[260px] xl:w-[300px] sm:h-[360px] lg:h-[420px] pointer-events-none shrink-0" />
        </div>
      </div>
    </section>
  );
}
