import React from 'react';
import { motion } from 'framer-motion';
import { Target, Compass, HardHat } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } }
};

const About = () => {
  return (
    <section id="about" className="relative">
      <div className="absolute inset-0 bg-white/50 -skew-y-2 z-0 transform origin-top-left border-y border-slate-100"></div>

      <motion.div
        className="relative z-10 max-w-4xl mx-auto"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.h2 variants={fadeUp} className="section-title">
          The Story Behind the Hard Hat
        </motion.h2>
        <motion.p variants={fadeUp} className="section-subtitle">
          A dedicated professional with extensive experience in civil engineering and construction,
          specifically in challenging terrains.
        </motion.p>

        <motion.div variants={fadeUp} className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-[1.0625rem] text-slate-600 leading-[1.75] font-light">
            <p>
              I began my journey in engineering not just to build structures, but to overcome the most
              demanding environments nature has to offer. My expertise lies in navigating rocky terrains,
              managing intense blasting operations, and ensuring structural integrity where others see
              impossible hurdles.
            </p>
            <blockquote className="border-l-4 border-accent pl-5 py-1 italic font-medium text-slate-700 text-base leading-relaxed">
              "My philosophy revolves around precision, safety, and community impact. Every site is an
              opportunity to uplift the environment and the people around it."
            </blockquote>
            <p>
              Beyond the blueprints, I am driven by a profound commitment to my community. Whether
              through my social work, my poetry, or my digital voice, I strive to empower and inspire.
            </p>
          </div>

          <motion.div
            className="grid gap-5"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <motion.div variants={fadeUp} className="card flex items-start gap-4">
              <div className="p-3 bg-accent/10 text-accent rounded-xl shrink-0">
                <Target size={22} />
              </div>
              <div>
                <h3 className="text-base font-semibold mb-1">Precision</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Exact calculation and careful site management, minimizing risks in volatile environments.
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="card flex items-start gap-4">
              <div className="p-3 bg-accent/10 text-accent rounded-xl shrink-0">
                <HardHat size={22} />
              </div>
              <div>
                <h3 className="text-base font-semibold mb-1">Safety First</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Rigorous adherence to compliance and safety during extreme operations like mountain blasting.
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="card flex items-start gap-4">
              <div className="p-3 bg-accent/10 text-accent rounded-xl shrink-0">
                <Compass size={22} />
              </div>
              <div>
                <h3 className="text-base font-semibold mb-1">Leadership</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Guiding teams with empathy and authority to deliver projects on time.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default About;
