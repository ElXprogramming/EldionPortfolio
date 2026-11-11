import Lanyard from './Lanyard';
import eldionPortrait from '../assets/eldion-portrait.webp';
import { PROFILE } from '../lib/constants';

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative pt-24 pb-16 md:pt-32 md:pb-24 min-h-[720px] flex items-center overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left area - clean open dark space */}
          <div className="hidden lg:block lg:col-span-2" />

          {/* Right side area: Name and Bio & 3D Lanyard Card */}
          <div className="lg:col-span-10 flex flex-col-reverse lg:flex-row items-center lg:items-center justify-end gap-8 sm:gap-12">
            {/* Name and Bio - placed at the right side */}
            <div className="flex flex-col items-center lg:items-end text-center lg:text-right max-w-lg">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-4">
                <span className="text-gradient">{PROFILE.name}</span>
              </h1>
              <p className="text-base sm:text-lg text-zinc-300 leading-relaxed">
                Software engineering student eager to learn and gather new experiences through solving real-world
                problems. Experienced in full-stack web development and implementing LLM solutions, with strong
                proficiency in modern JavaScript, TypeScript, CSS, SQL, and Python.
              </p>
            </div>

            {/* Profile Card hanging in Lanyard - at the right side of screen */}
            <div
              className="w-[280px] sm:w-[320px] md:w-[350px] h-[460px] sm:h-[500px] relative flex-shrink-0"
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
      </div>
    </section>
  );
}
