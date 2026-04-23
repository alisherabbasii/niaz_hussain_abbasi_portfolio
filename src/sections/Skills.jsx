import React from 'react';
import { motion } from 'framer-motion';
import {
  Layers, PenTool, Navigation, FileText, AlignCenter,
  FolderOpen, BarChart2, Database, Users, ShieldCheck,
  Mountain, Zap, Wind, Droplets, Hammer,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } }
};

const chipAnim = {
  hidden: { opacity: 0, scale: 0.85, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } }
};

const chipStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } }
};

const categories = [
  {
    title: 'Engineering Tools',
    subtitle: 'Software & field instruments for precise civil work.',
    CategoryIcon: PenTool,
    headerGradient: 'from-accent/10 via-sky-50 to-transparent',
    iconBg: 'bg-accent',
    chipHover: 'hover:bg-accent/10 hover:text-accent hover:border-accent/30',
    chipIconColor: 'text-accent',
    skills: [
      { name: 'Civil 3D',               Icon: Layers       },
      { name: 'AutoCAD',                Icon: PenTool      },
      { name: 'GPS Surveying',           Icon: Navigation   },
      { name: 'Construction Drawings',   Icon: FileText     },
      { name: 'Site Leveling',           Icon: AlignCenter  },
    ],
  },
  {
    title: 'Project Management',
    subtitle: 'Systems for coordinating teams and records.',
    CategoryIcon: ShieldCheck,
    headerGradient: 'from-emerald-50 via-teal-50/40 to-transparent',
    iconBg: 'bg-emerald-500',
    chipHover: 'hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200',
    chipIconColor: 'text-emerald-500',
    skills: [
      { name: 'Document Control',   Icon: FolderOpen  },
      { name: 'MS Excel',           Icon: BarChart2   },
      { name: 'Oracle',             Icon: Database    },
      { name: 'Team Supervision',   Icon: Users       },
      { name: 'Safety Compliance',  Icon: ShieldCheck },
    ],
  },
  {
    title: 'Specialized Sites',
    subtitle: 'Expertise in extreme terrain & high-risk operations.',
    CategoryIcon: Mountain,
    headerGradient: 'from-amber-50 via-orange-50/40 to-transparent',
    iconBg: 'bg-amber-400',
    chipHover: 'hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200',
    chipIconColor: 'text-amber-500',
    skills: [
      { name: 'Rocky Terrains',      Icon: Mountain  },
      { name: 'Mountain Blasting',   Icon: Zap       },
      { name: 'High-Altitude Sites', Icon: Wind      },
      { name: 'Erosion Control',     Icon: Droplets  },
      { name: 'Trenching',           Icon: Hammer    },
    ],
  },
];

const SkillChip = ({ name, Icon, chipHover, chipIconColor }) => (
  <motion.div
    variants={chipAnim}
    whileHover={{ y: -3, scale: 1.03 }}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium cursor-default transition-colors duration-200 ${chipHover}`}
    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)' }}
  >
    <Icon size={15} className={`shrink-0 transition-colors duration-200 ${chipIconColor}`} />
    <span className="leading-none">{name}</span>
  </motion.div>
);

const CategoryCard = ({ cat }) => {
  const { CategoryIcon } = cat;
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border border-slate-100/80 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)', boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)' }}
      whileHover={{ boxShadow: '0 12px 32px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)' }}
    >
      {/* Card header */}
      <div className={`bg-gradient-to-br ${cat.headerGradient} px-6 pt-7 pb-6`}>
        <div className={`w-12 h-12 ${cat.iconBg} rounded-2xl flex items-center justify-center mb-4`} style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.2), 0 1px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.25)' }}>
          <CategoryIcon size={22} className="text-white" />
        </div>
        <h3 className="text-base font-bold text-primary mb-1">{cat.title}</h3>
        <p className="text-xs text-slate-500 font-light leading-relaxed">{cat.subtitle}</p>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100 mx-6" />

      {/* Skill chips */}
      <motion.div
        className="grid grid-cols-2 gap-2.5 p-6 flex-1"
        variants={chipStagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
      >
        {cat.skills.map((skill) => (
          <SkillChip
            key={skill.name}
            name={skill.name}
            Icon={skill.Icon}
            chipHover={cat.chipHover}
            chipIconColor={cat.chipIconColor}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

const Skills = () => {
  return (
    <section id="skills" className="border-y border-slate-100/60" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #ffffff 40%, #f0f9ff 100%)' }}>
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-3">
          Skills
        </motion.p>
        <motion.h2 variants={fadeUp} className="section-title">
          Core Competencies
        </motion.h2>
        <motion.p variants={fadeUp} className="section-subtitle">
          Hard technical skills balanced with effective project management.
        </motion.p>

        <motion.div
          className="grid md:grid-cols-3 gap-6 mt-12"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {categories.map((cat, idx) => (
            <CategoryCard key={idx} cat={cat} index={idx} />
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Skills;
