import React from 'react';
import { motion } from 'framer-motion';
import { PenTool, Mountain, ClipboardCheck } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } }
};

const skillCategories = [
  {
    title: "Engineering Tools",
    icon: <PenTool size={20} />,
    skills: ["Civil 3D", "AutoCAD", "GPS Surveying", "Construction Drawings", "Site Leveling"]
  },
  {
    title: "Project Management",
    icon: <ClipboardCheck size={20} />,
    skills: ["Document Control", "MS Excel", "Oracle", "Team Supervision", "Safety Compliance"]
  },
  {
    title: "Specialized Sites",
    icon: <Mountain size={20} />,
    skills: ["Rocky Terrains", "Mountain Blasting", "High-Altitude Sites", "Erosion Control", "Trenching"]
  }
];

const Skills = () => {
  return (
    <section id="skills" className="bg-white border-y border-slate-100">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.h2 variants={fadeUp} className="section-title">Core Competencies</motion.h2>
        <motion.p variants={fadeUp} className="section-subtitle">
          Hard skills balanced with effective project management.
        </motion.p>

        <motion.div
          className="grid md:grid-cols-3 gap-8 mt-12"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {skillCategories.map((category, idx) => (
            <motion.div key={idx} variants={fadeUp} className="card bg-secondary/30">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="p-2.5 bg-white text-accent rounded-lg shadow-sm border border-slate-100">
                  {category.icon}
                </div>
                <h3 className="text-base font-semibold">{category.title}</h3>
              </div>
              <ul className="space-y-3">
                {category.skills.map((skill, sIdx) => (
                  <li key={sIdx} className="flex items-center gap-3 text-slate-600 text-sm font-medium group">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full group-hover:bg-accent group-hover:scale-150 transition-all duration-300 shrink-0"></div>
                    {skill}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Skills;
