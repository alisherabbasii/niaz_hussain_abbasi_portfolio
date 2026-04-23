import React from 'react';
import { motion } from 'framer-motion';
import { Mountain, Building2, Waves, ArrowUpRight } from 'lucide-react';

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
    title: 'Northern Highway Expansion',
    category: 'Mountain Terrain',
    description:
      'Executed controlled blasting and precise leveling for a 50 km highway stretch through rocky mountain passes.',
    tags: ['Blasting', 'Surveying', 'GPS'],
    gradient: 'from-sky-500 via-blue-600 to-indigo-700',
    Icon: Mountain,
    stat: '50 km',
    statLabel: 'Highway carved',
  },
  {
    title: 'City Central Mall',
    category: 'Commercial Layout',
    description:
      'Managed the full site layout from initial blueprints to foundations using Civil 3D, ensuring millimeter-level precision.',
    tags: ['AutoCAD', 'Civil 3D', 'Supervision'],
    gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    Icon: Building2,
    stat: '±1 mm',
    statLabel: 'Layout precision',
  },
  {
    title: 'River Dam Support Base',
    category: 'Infrastructure',
    description:
      'Coordinated logistics and heavy machinery placement on uneven riverside terrain with zero safety incidents.',
    tags: ['Logistics', 'Safety', 'Document Control'],
    gradient: 'from-amber-500 via-orange-500 to-rose-600',
    Icon: Waves,
    stat: '0',
    statLabel: 'Safety incidents',
  },
];

const ProjectCard = ({ project }) => {
  const { Icon } = project;
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ scale: 1.025, boxShadow: '0 20px 60px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.14)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="relative h-80 rounded-2xl overflow-hidden cursor-default group transition-all duration-300"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.1)' }}
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient}`} />

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      {/* Large decorative icon */}
      <div className="absolute -bottom-6 -right-6 text-white/10 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 ease-out pointer-events-none">
        <Icon size={180} strokeWidth={0.6} />
      </div>

      {/* Default visible content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
        {/* Category badge */}
        <div className="flex items-start justify-between">
          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.15em] text-white/80 bg-white/15 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20">
            {project.category}
          </span>
          {/* Arrow icon — fades in on hover */}
          <div className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm border border-white/20 shrink-0">
            <ArrowUpRight size={15} className="text-white" />
          </div>
        </div>

        {/* Title + stat row */}
        <div className="flex items-end justify-between gap-4">
          <h3 className="text-xl font-bold text-white leading-tight drop-shadow-sm">
            {project.title}
          </h3>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-white leading-none">{project.stat}</p>
            <p className="text-[10px] text-white/60 uppercase tracking-wide mt-0.5">{project.statLabel}</p>
          </div>
        </div>
      </div>

      {/* Hover overlay — slides up from bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/25 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-20 p-6 flex flex-col justify-end">
        <p className="text-white/90 text-sm leading-relaxed font-light mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 bg-white/15 text-xs font-semibold text-white rounded-full border border-white/25 backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const WorkHighlights = () => {
  return (
    <section id="work">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-3">
          Work
        </motion.p>
        <motion.h2 variants={fadeUp} className="section-title">
          Work Highlights
        </motion.h2>
        <motion.p variants={fadeUp} className="section-subtitle">
          Real-world execution and problem-solving on demanding sites.
        </motion.p>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-12"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {projects.map((project, idx) => (
            <ProjectCard key={idx} project={project} />
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default WorkHighlights;
