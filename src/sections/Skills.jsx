import { motion } from 'framer-motion';
import { Ruler, HardHat, ClipboardList, Mountain } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};

const categories = [
  {
    title: 'Civil Engineering & Survey',
    description: 'Civil 3D and AutoCAD drawing work, GPS-based survey, and precise site leveling.',
    Icon: Ruler,
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent-strong',
    chipHover: 'hover:border-accent/40 hover:text-accent-strong hover:bg-accent/5',
    skills: ['Civil 3D', 'AutoCAD', 'GPS Surveying', 'Construction Drawings', 'Site Leveling'],
  },
  {
    title: 'Construction Supervision',
    description: 'On-site oversight of civil works and controlled blasting operations, with a zero-incident safety record.',
    Icon: HardHat,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    chipHover: 'hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50',
    skills: ['Team Supervision', 'Safety Compliance', 'Controlled Blasting'],
  },
  {
    title: 'Documentation & Coordination',
    description: 'Maintaining accurate project records and team coordination through Oracle and Excel-based systems.',
    Icon: ClipboardList,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    chipHover: 'hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50',
    skills: ['Document Control', 'Oracle', 'MS Excel'],
  },
  {
    title: 'Specialized Terrain',
    description: 'Extreme-terrain experience across rocky, high-altitude, and erosion-prone sites.',
    Icon: Mountain,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    chipHover: 'hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50',
    skills: ['Rocky Terrains', 'High-Altitude Sites', 'Erosion Control', 'Trenching'],
  },
];

const CategoryRow = ({ cat }) => {
  const { Icon } = cat;
  return (
    <motion.div
      variants={fadeUp}
      className="grid lg:grid-cols-[280px_1fr] gap-5 lg:gap-10 py-8 first:pt-0 last:pb-0"
    >
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl ${cat.iconBg} ${cat.iconColor} flex items-center justify-center shrink-0`}>
          <Icon size={20} aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-base font-bold text-primary mb-1.5 leading-snug">{cat.title}</h3>
          <p className="text-sm text-slate-500 leading-[1.65] font-light">{cat.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap content-start gap-2.5 lg:pt-0.5">
        {cat.skills.map((skill) => (
          <span
            key={skill}
            className={`px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 font-medium cursor-default transition-colors duration-200 ${cat.chipHover}`}
          >
            {skill}
          </span>
        ))}
      </div>
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
        <motion.p variants={fadeUp} className="eyebrow mb-3">
          Expertise
        </motion.p>
        <motion.h2 variants={fadeUp} className="section-title">
          Core Expertise
        </motion.h2>
        <motion.p variants={fadeUp} className="section-subtitle">
          Technical, supervisory, and documentation skills built across infrastructure,
          highway, and commercial projects in demanding terrain.
        </motion.p>

        <motion.div
          className="mt-12 divide-y divide-slate-100 border-y border-slate-100"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {categories.map((cat) => (
            <CategoryRow key={cat.title} cat={cat} />
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Skills;
