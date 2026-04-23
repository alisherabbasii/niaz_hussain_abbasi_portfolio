import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Calendar } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.05 } }
};

const experiences = [
  {
    role: "Senior Survey Engineer",
    company: "Karachi Civil Division",
    location: "Karachi, PK",
    date: "2020 - Present",
    description: "Leading land survey operations for large-scale infrastructure projects. Specializing in topographic analysis and managing teams across difficult rocky sites.",
  },
  {
    role: "Blasting Supervisor",
    company: "Mountain Core Builders",
    location: "Northern Mountains",
    date: "2016 - 2020",
    description: "Supervised controlled detonations on steep mountainous terrain to pave paths for major highway expansions. Ensured zero safety incidents over 4 years.",
  },
  {
    role: "Civil Supervisor",
    company: "Urban Edge Construction",
    location: "Hyderabad, PK",
    date: "2012 - 2016",
    description: "Managed day-to-day site operations, interpreting construction drawings strictly, and organizing material logistics for commercial high-rises.",
  }
];

const Experience = () => {
  return (
    <section id="experience">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.h2 variants={fadeUp} className="section-title">Professional Journey</motion.h2>
        <motion.p variants={fadeUp} className="section-subtitle">
          A track record of execution in harsh environments.
        </motion.p>

        <div className="max-w-3xl mx-auto mt-12">
          <div className="relative border-l-2 border-slate-200 pl-8 ml-4 md:ml-0 md:pl-0 md:border-none space-y-12">

            {/* Vertical line for desktop */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2"></div>

            {experiences.map((exp, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className="relative flex flex-col md:flex-row justify-between items-center w-full group"
              >
                {/* Timeline dot */}
                <div className="absolute -left-[41px] md:left-1/2 w-5 h-5 rounded-full bg-white border-4 border-accent md:-translate-x-1/2 z-10 group-hover:scale-125 transition-transform duration-300 shadow-sm"></div>

                {/* Card (alternates sides on desktop) */}
                <div className={`w-full md:w-[45%] ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:order-2 text-left'}`}>
                  <div className="card border-none bg-white/80 hover:bg-white">
                    <h3 className="text-lg font-bold text-primary mb-1.5">{exp.role}</h3>
                    <div className={`flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide ${index % 2 === 0 ? 'md:justify-end' : 'justify-start'}`}>
                      <span className="flex items-center gap-1.5"><Briefcase size={12} /> {exp.company}</span>
                      <span className="flex items-center gap-1.5"><MapPin size={12} /> {exp.location}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-sm font-light">{exp.description}</p>
                  </div>
                </div>

                {/* Center date chip (desktop) */}
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center w-32 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm z-10">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Calendar size={11} /> {exp.date}
                  </span>
                </div>

                {/* Mobile date */}
                <div className="md:hidden mt-3 w-full flex items-center text-xs font-semibold text-slate-400 gap-1.5">
                  <Calendar size={13} /> {exp.date}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Experience;
