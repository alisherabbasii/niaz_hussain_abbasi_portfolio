import { motion } from 'framer-motion';
import { fadeUp, fadeIn, stagger, viewportOnce } from '../utils/motion';

const Values = () => {
  return (
    <section className="py-28 relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0c1526 50%, #0f1e35 100%)' }}>
      {/* Background layers */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(14,165,233,0.12) 0%, transparent 70%)' }}></div>
      <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-sky-900/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] bg-indigo-900/20 rounded-full blur-3xl pointer-events-none"></div>
      {/* Subtle top highlight */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(14,165,233,0.4), transparent)' }}></div>

      <motion.div
        className="max-w-4xl mx-auto text-center relative z-10 px-4"
        variants={stagger()}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <motion.p variants={fadeIn} className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-6">
          My Philosophy
        </motion.p>
        <motion.h2
          variants={fadeUp}
          className="text-3xl md:text-4xl lg:text-5xl font-heading font-black mb-8 leading-tight tracking-tight"
          style={{ color: 'transparent', backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 60%, #bae6fd 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}
        >
          "True engineered strength isn't just in concrete, it's in the character of the community."
        </motion.h2>
        <motion.p variants={fadeUp} className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
          Dedicated to pushing boundaries in construction while lifting up the people around me,
          leaving both structural and social legacies.
        </motion.p>
      </motion.div>
    </section>
  );
};

export default Values;
