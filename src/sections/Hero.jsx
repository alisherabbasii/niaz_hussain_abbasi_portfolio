import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11 } }
};

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center pt-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 -right-1/4 w-[900px] h-[900px] bg-accent/5 rounded-full blur-3xl -z-10 mix-blend-multiply"></div>
      <div className="absolute bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-slate-200/60 rounded-full blur-3xl -z-10 mix-blend-multiply"></div>

      <div className="w-full grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        <motion.div
          className="flex flex-col items-start text-left order-2 lg:order-1"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-sm font-medium text-slate-600 mb-7 w-fit"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Available for new projects
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.04] tracking-tight text-primary"
          >
            Civil Engineer <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-sky-500 to-accent-dark">
              Site Specialist
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-slate-500 mb-10 max-w-md font-light leading-relaxed"
          >
            Building structures with engineering precision, and empowering communities with human purpose.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3 w-full sm:w-auto">
            <a href="#contact" className="btn-primary w-full sm:w-auto">
              Start a Project
              <ArrowRight size={16} />
            </a>
            <a href="#experience" className="btn-outline w-full sm:w-auto">
              View Experience
            </a>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex items-center gap-6 text-sm text-slate-500 font-medium"
          >
            <div className="flex items-center gap-1.5">
              <MapPin size={15} className="text-accent" />
              Pakistan
            </div>
            <div className="h-4 w-px bg-slate-300"></div>
            <div>
              <span className="text-primary font-bold text-base">10+</span>{' '}
              Years Experience
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="order-1 lg:order-2 flex justify-center lg:justify-end relative"
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative w-72 h-72 md:w-96 md:h-96">
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 to-slate-100 rounded-[2rem] rotate-3 scale-105 transition-transform duration-500 hover:rotate-6"></div>
            <div className="absolute inset-0 bg-white rounded-[2rem] shadow-2xl border border-slate-100/80 overflow-hidden flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 mx-auto rounded-full mb-5 flex items-center justify-center shadow-inner">
                  <span className="text-4xl">👷‍♂️</span>
                </div>
                <p className="font-heading font-bold text-slate-800 text-lg">Niaz Hussain</p>
                <p className="text-sm text-slate-400 font-medium mt-1 tracking-wide uppercase text-xs">Civil Engineer</p>
              </div>
            </div>

            <motion.div
              className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100"
              initial={{ opacity: 0, x: -16, y: 16 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.8, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center font-bold shrink-0">
                  🚧
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Expertise in</p>
                  <p className="text-sm font-bold text-primary">Rocky Terrains</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
