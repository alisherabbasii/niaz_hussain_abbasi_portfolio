import React from 'react';
import { motion } from 'framer-motion';

const Values = () => {
  return (
    <section className="py-28 relative overflow-hidden bg-primary text-white">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full bg-accent/15 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-sky-900/40 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div
        className="max-w-4xl mx-auto text-center relative z-10 px-4"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.p
          className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
        >
          My Philosophy
        </motion.p>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-black mb-8 text-white leading-tight tracking-tight">
          "True engineered strength isn't just in concrete, it's in the character of the community."
        </h2>
        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
          Dedicated to pushing boundaries in construction while lifting up the people around me,
          leaving both structural and social legacies.
        </p>
      </motion.div>
    </section>
  );
};

export default Values;
