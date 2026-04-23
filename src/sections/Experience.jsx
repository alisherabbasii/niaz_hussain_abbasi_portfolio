import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Ruler, Flame, Building2 } from 'lucide-react';

const slideLeft = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const slideRight = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.05 } }
};

const experiences = [
  {
    role: 'Survey Engineer & Document Controller',
    company: 'Infrastructure Projects',
    location: 'Pakistan',
    date: '2020 – Present',
    duration: '4+ yrs',
    description:
      'Leading land survey operations for large-scale infrastructure projects while managing document control — ensuring accurate records and seamless team communication using Oracle and MS Excel.',
    Icon: Ruler,
    tags: ['Oracle', 'MS Excel', 'GPS Surveying'],
    iconBg: 'bg-accent',
    ringColor: 'ring-accent/20',
    tagStyle: 'bg-accent/10 text-accent',
    borderColor: 'border-accent/40',
  },
  {
    role: 'Blasting Supervisor',
    company: 'Mountain Construction Projects',
    location: 'Northern Mountains, PK',
    date: '2016 – 2020',
    duration: '4 yrs',
    description:
      'Supervised controlled blasting operations on steep mountainous terrain, enabling major highway expansions through rocky passes with rigorous safety compliance and zero incidents.',
    Icon: Flame,
    tags: ['Safety Compliance', 'Mountain Terrain'],
    iconBg: 'bg-amber-400',
    ringColor: 'ring-amber-200',
    tagStyle: 'bg-amber-50 text-amber-600',
    borderColor: 'border-amber-300',
  },
  {
    role: 'Civil Supervisor & Drawing Expert',
    company: 'Construction Division',
    location: 'Pakistan',
    date: '2012 – 2016',
    duration: '4 yrs',
    description:
      'Managed site operations end-to-end — from Civil 3D and AutoCAD drawing interpretation to coordinating material logistics and teams for commercial and infrastructure projects.',
    Icon: Building2,
    tags: ['Civil 3D', 'AutoCAD', 'Site Management'],
    iconBg: 'bg-emerald-500',
    ringColor: 'ring-emerald-200',
    tagStyle: 'bg-emerald-50 text-emerald-600',
    borderColor: 'border-emerald-300',
  },
];

const ExperienceCard = ({ exp }) => (
  <div
    className={`card hover:-translate-y-1.5 transition-all duration-300`}
  >
    {/* Date badge */}
    <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${exp.borderColor} ${exp.tagStyle}`}>
        <Calendar size={11} />
        {exp.date}
      </span>
      <span className="text-xs text-slate-400 font-semibold">{exp.duration}</span>
    </div>

    <h3 className="text-base font-bold text-primary mb-1 leading-snug">{exp.role}</h3>

    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">
      <span className="flex items-center gap-1"><MapPin size={11} /> {exp.location}</span>
    </div>

    <p className="text-sm text-slate-500 leading-relaxed font-light mb-4">{exp.description}</p>

    <div className="flex flex-wrap gap-2">
      {exp.tags.map((tag) => (
        <span key={tag} className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${exp.tagStyle}`}>
          {tag}
        </span>
      ))}
    </div>
  </div>
);

const Experience = () => {
  return (
    <section id="experience">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-3">
          Experience
        </motion.p>
        <motion.h2 variants={fadeUp} className="section-title">
          Professional Journey
        </motion.h2>
        <motion.p variants={fadeUp} className="section-subtitle">
          A track record of execution in demanding environments.
        </motion.p>

        {/* Timeline */}
        <div className="relative mt-16">

          {/* Desktop center line */}
          <div className="hidden md:block absolute left-1/2 top-6 bottom-6 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent -translate-x-1/2 pointer-events-none" />

          {/* Mobile left border */}
          <div className="md:hidden absolute left-5 top-0 bottom-0 w-px bg-slate-200 pointer-events-none" />

          <div className="space-y-10 md:space-y-14">
            {experiences.map((exp, index) => {
              const isLeft = index % 2 === 0;
              const { Icon } = exp;

              return (
                <motion.div
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                  variants={isLeft ? slideLeft : slideRight}
                  className="relative md:grid md:grid-cols-2 md:items-center group"
                >
                  {/* Desktop icon dot — centered on the line */}
                  <motion.div
                    whileHover={{ scale: 1.12, rotate: 4 }}
                    className={`hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-2xl ${exp.iconBg} items-center justify-center ring-8 ${exp.ringColor} transition-transform duration-200 cursor-default`}
                    style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.25)' }}
                  >
                    <Icon size={22} className="text-white" />
                  </motion.div>

                  {/* Card on LEFT (even index) */}
                  {isLeft && (
                    <>
                      <div className="hidden md:block md:pr-16 group">
                        <ExperienceCard exp={exp} />
                      </div>
                      <div className="hidden md:block" />
                    </>
                  )}

                  {/* Card on RIGHT (odd index) */}
                  {!isLeft && (
                    <>
                      <div className="hidden md:block" />
                      <div className="hidden md:block md:pl-16 group">
                        <ExperienceCard exp={exp} />
                      </div>
                    </>
                  )}

                  {/* Mobile layout — always left-to-right with icon on border */}
                  <div className="md:hidden pl-14 group">
                    {/* Mobile icon on left border */}
                    <div className={`absolute left-0 top-5 w-10 h-10 rounded-xl ${exp.iconBg} flex items-center justify-center z-10`} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.1)' }}>
                      <Icon size={17} className="text-white" />
                    </div>
                    <ExperienceCard exp={exp} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Experience;
