import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Layers } from 'lucide-react';
import { Button } from '../components/ui';
import { fadeUp, stagger, EASE_PREMIUM } from '../utils/motion';
import niazProfile480 from '../assets/niaz-profile-480.webp';
import niazProfile720 from '../assets/niaz-profile-720.webp';
import niazProfile960 from '../assets/niaz-profile-960.webp';

const Hero = () => {
  return (
    <section
      id="home"
      className="relative flex items-center overflow-hidden pt-28 pb-16 lg:min-h-[85vh] lg:pt-32 lg:pb-20"
    >
      {/* Background: soft page tint + a restrained technical/blueprint grid — no unrelated decorative blobs */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white -z-10" />
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'linear-gradient(to bottom, black, transparent 80%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 80%)',
          opacity: 0.5,
        }}
      />

      <div className="w-full grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-center">
        {/* Left: copy */}
        <motion.div
          className="flex flex-col items-start text-left order-2 lg:order-1"
          variants={stagger(0.09, 0.05)}
          initial="hidden"
          animate="visible"
        >
          <motion.p variants={fadeUp} className="eyebrow mb-5">
            Civil Engineer · Survey Engineer · Document Controller
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold mb-5 leading-[1.08] tracking-tight text-primary"
          >
            Niaz Hussain <span className="text-accent-strong">Abbasi</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg text-slate-600 mb-9 max-w-lg font-light leading-relaxed"
          >
            Leading survey engineering, civil supervision, and document control on
            infrastructure projects across Pakistan — turning technical drawings into
            safety-compliant results on some of the country&rsquo;s most demanding
            mountain and rocky terrain.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3 w-full sm:w-auto">
            <Button href="#contact" icon={ArrowRight}>
              Start a Project
            </Button>
            <Button href="#experience" variant="outline">
              View Experience
            </Button>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-500 font-medium"
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
              Available for new projects
            </span>
            <span className="hidden sm:block h-4 w-px bg-slate-200" aria-hidden="true" />
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} className="text-accent-strong" aria-hidden="true" />
              Pakistan
            </span>
            <span className="hidden sm:block h-4 w-px bg-slate-200" aria-hidden="true" />
            <span>
              <span className="text-primary font-extrabold">10+</span> Years Experience
            </span>
          </motion.div>
        </motion.div>

        {/* Right: portrait */}
        <motion.div
          className="order-1 lg:order-2 flex justify-center lg:justify-end"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: EASE_PREMIUM }}
        >
          <div className="relative w-52 h-52 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-[22rem] lg:h-[22rem]">
            {/* Corner marks — restrained technical-drawing motif */}
            <span
              className="absolute -top-3 -left-3 w-7 h-7 border-t-2 border-l-2 border-accent-strong/40 rounded-tl-md pointer-events-none"
              aria-hidden="true"
            />
            <span
              className="absolute -bottom-3 -right-3 w-7 h-7 border-b-2 border-r-2 border-accent-strong/40 rounded-br-md pointer-events-none"
              aria-hidden="true"
            />

            <div
              className="relative w-full h-full rounded-3xl overflow-hidden border border-slate-200 bg-white"
              style={{ boxShadow: 'var(--shadow-xl)' }}
            >
              <img
                src={niazProfile720}
                srcSet={`${niazProfile480} 480w, ${niazProfile720} 720w, ${niazProfile960} 960w`}
                sizes="(min-width: 1024px) 22rem, (min-width: 768px) 20rem, 45vw"
                width={960}
                height={960}
                alt="Niaz Hussain Abbasi, Civil Engineer and Survey Engineer"
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>

            {/* Compact credential chip — real, verified tools only */}
            <div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 lg:left-auto lg:right-4 lg:translate-x-0 inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full pl-2 pr-3.5 py-1.5"
              style={{ boxShadow: 'var(--shadow-md)' }}
            >
              <span className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Layers size={12} className="text-accent-strong" aria-hidden="true" />
              </span>
              <span className="text-xs font-bold text-primary whitespace-nowrap">Civil 3D · AutoCAD</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
