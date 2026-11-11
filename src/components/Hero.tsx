import Lanyard from './Lanyard';
import eldionPortrait from '../assets/eldion-portrait.webp';
import { PROFILE } from '../lib/constants';

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative pt-16 pb-12 md:pt-20 md:pb-16 min-h-[820px] lg:min-h-[880px] flex items-center overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-center gap-8 sm:gap-12 lg:gap-16 w-full">
          {/* Name and Bio - placed at the right side */}
          <div className="flex flex-col items-center lg:items-end text-center lg:text-right shrink-0">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-3">
              <span className="text-gradient">{PROFILE.name}</span>
            </h1>
            <p className="text-base sm:text-lg text-zinc-400">
              Software engineering student.
            </p>
          </div>

          {/* Profile Card hanging in Lanyard - expanded viewing space */}
          <div
            className="w-full sm:w-[460px] md:w-[540px] lg:w-[620px] xl:w-[680px] h-[580px] sm:h-[680px] md:h-[760px] lg:h-[840px] relative flex-shrink-0"
            aria-label="Interactive 3D Profile Card hanging on lanyard"
          >
            <Lanyard
              frontImage={eldionPortrait}
              backImage={eldionPortrait}
              cardColor="#141419"
              strapColor="#27272a"
              finish="glossy"
              metal="silver"
              size={0.65}
              interactive={true}
              breeze={0.3}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
