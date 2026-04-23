import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Layers, FileText } from 'lucide-react';
import niazProfileImg from '../assets/niaz_bhai_profile_img.png';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11 } }
};

const FloatingBadge = ({ children, delay, className }) => (
  <motion.div
    className={`absolute bg-white/95 backdrop-blur-sm px-3.5 py-2.5 rounded-2xl border border-white/80 ${className}`}
    style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)' }}
    initial={{ opacity: 0, scale: 0.8, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center pt-24 overflow-hidden">
      {/* Premium layered gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-sky-50/50 -z-10"></div>
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/6 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-100/70 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-indigo-50/50 rounded-full blur-3xl -z-10"></div>
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '2.5rem 2.5rem' }}
      ></div>

      <div className="w-full grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* Left: Text */}
        <motion.div
          className="flex flex-col items-start text-left order-2 lg:order-1"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200/80 text-sm font-semibold text-slate-600 mb-7 w-fit"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)' }}
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Available for new projects
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-[4.75rem] font-extrabold mb-4 leading-[1.06] tracking-tight text-primary"
          >
            Niaz Hussain{' '}
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-sky-500 to-blue-600">
                Abbasi
              </span>
              <motion.span
                className="absolute -bottom-1 left-0 h-[3px] bg-gradient-to-r from-accent to-sky-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.85, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-6"
          >
            Civil Engineer · Survey Engineer · Document Controller
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-slate-500 mb-10 max-w-md font-light leading-relaxed"
          >
            Building structures with engineering precision, and empowering communities with human purpose.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3 w-full sm:w-auto">
            <a
              href="#contact"
              className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-accent to-sky-500 text-white font-semibold text-sm shadow-lg shadow-accent/20 hover:shadow-accent/35 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 w-full sm:w-auto"
            >
              Start a Project
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
            </a>
            <a
              href="#experience"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:border-accent/60 hover:text-accent hover:bg-accent/4 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 w-full sm:w-auto"
            >
              View Experience
            </a>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center gap-5 text-sm text-slate-500 font-medium"
          >
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-accent" />
              Pakistan
            </div>
            <div className="h-4 w-px bg-slate-200"></div>
            <div>
              <span className="text-primary font-extrabold text-base">10+</span>{' '}
              Years Experience
            </div>
            <div className="h-4 w-px bg-slate-200"></div>
            <div>
              <span className="text-primary font-extrabold text-base">4</span>{' '}
              Core Roles
            </div>
          </motion.div>
        </motion.div>

        {/* Right: Image + Floating badges */}
        <motion.div
          className="order-1 lg:order-2 flex justify-center lg:justify-end relative"
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative w-72 h-72 md:w-[22rem] md:h-[22rem]">
            {/* Glow halo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 via-sky-200/30 to-transparent rounded-[2.5rem] rotate-3 scale-[1.08] blur-md -z-10"></div>
            {/* Tilted decorative frame */}
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 to-slate-100 rounded-[2.5rem] rotate-3 scale-105 transition-transform duration-500 group-hover:rotate-6"></div>
            {/* Image card */}
            <div className="absolute inset-0 bg-white rounded-[2.5rem] border border-slate-100/60 overflow-hidden" style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.06)' }}>
              <img
                src={niazProfileImg}
                alt="Niaz Hussain Abbasi"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Badge: Rocky Terrain — bottom-left */}
            <FloatingBadge delay={0.8} className="-bottom-5 -left-7 z-10">
              <div className="flex gap-2.5 items-center">
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 text-base">
                  🏔️
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide leading-none mb-0.5">Expertise</p>
                  <p className="text-sm font-bold text-primary leading-none">Rocky Terrains</p>
                </div>
              </div>
            </FloatingBadge>

            {/* Badge: Civil 3D — top-right */}
            <FloatingBadge delay={1.0} className="-top-5 -right-7 z-10">
              <div className="flex gap-2.5 items-center">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                  <Layers size={16} className="text-sky-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide leading-none mb-0.5">Tools</p>
                  <p className="text-sm font-bold text-primary leading-none">Civil 3D & AutoCAD</p>
                </div>
              </div>
            </FloatingBadge>

            {/* Badge: Doc Controller — bottom-right */}
            <FloatingBadge delay={1.15} className="-bottom-5 -right-7 z-10">
              <div className="flex gap-2.5 items-center">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <FileText size={15} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide leading-none mb-0.5">Also</p>
                  <p className="text-sm font-bold text-primary leading-none">Doc Controller</p>
                </div>
              </div>
            </FloatingBadge>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
