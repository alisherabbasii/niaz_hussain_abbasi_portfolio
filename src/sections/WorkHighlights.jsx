import React from 'react';
import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } }
};

const projects = [
  {
    title: "Northern Highway Expansion",
    category: "Mountain Terrain",
    description: "Executed controlled blasting and leveling for a 50km highway stretch through rocky mountains.",
    tags: ["Blasting", "Surveying"],
    color: "bg-sky-50/60"
  },
  {
    title: "City Central Mall",
    category: "Commercial Layout",
    description: "Managed complete site layout from initial blueprints to foundations, ensuring millimeter precision.",
    tags: ["AutoCAD", "Supervision"],
    color: "bg-emerald-50/60"
  },
  {
    title: "River Dam Support Base",
    category: "Infrastructure",
    description: "Coordinated logistics and heavy machinery placement on uneven riverside terrain.",
    tags: ["Logistics", "Safety"],
    color: "bg-amber-50/60"
  }
];

const WorkHighlights = () => {
  return (
    <section id="work">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.h2 variants={fadeUp} className="section-title">Work Highlights</motion.h2>
        <motion.p variants={fadeUp} className="section-subtitle">
          Real-world execution and problem-solving.
        </motion.p>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {projects.map((project, idx) => (
            <motion.div
              key={idx}
              variants={fadeUp}
              className={`card ${project.color} group relative overflow-hidden flex flex-col h-full`}
            >
              {/* Background icon decoration */}
              <div className="absolute top-0 right-0 p-8 transform translate-x-1/2 -translate-y-1/2 opacity-[0.04] text-primary group-hover:scale-125 transition-transform duration-500">
                <Construction size={120} />
              </div>

              <div className="mb-auto relative z-10">
                <span className="text-xs font-bold uppercase tracking-widest text-accent mb-3 block">
                  {project.category}
                </span>
                <h3 className="text-xl font-bold mb-3 text-primary leading-snug">{project.title}</h3>
                <p className="text-slate-600 font-light leading-relaxed text-sm mb-6">
                  {project.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 relative z-10">
                {project.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-white/70 backdrop-blur text-xs font-semibold text-slate-600 rounded-full border border-white/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default WorkHighlights;
