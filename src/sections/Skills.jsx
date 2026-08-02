import { motion } from 'framer-motion';
import { fadeUp, stagger, viewportOnce } from '../utils/motion';
import { skillCategories } from '../data/skills';

const THEME_CLASSES = {
  accent: {
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent-strong',
    chipHover: 'hover:border-accent/40 hover:text-accent-strong hover:bg-accent/5',
  },
  emerald: {
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    chipHover: 'hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50',
  },
  violet: {
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    chipHover: 'hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50',
  },
  amber: {
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    chipHover: 'hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50',
  },
};

const CategoryRow = ({ category }) => {
  const theme = THEME_CLASSES[category.theme] ?? THEME_CLASSES.accent;
  const Icon = category.icon;

  return (
    <motion.div
      variants={fadeUp}
      className="grid lg:grid-cols-[280px_1fr] gap-5 lg:gap-10 py-8 first:pt-0 last:pb-0"
    >
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl ${theme.iconBg} ${theme.iconColor} flex items-center justify-center shrink-0`}>
          <Icon size={20} aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-base font-bold text-primary mb-1.5 leading-snug">{category.title}</h3>
          <p className="text-sm text-slate-500 leading-[1.65] font-light">{category.description}</p>
        </div>
      </div>

      <ul className="flex flex-wrap content-start gap-2.5 lg:pt-0.5">
        {category.skills.map((skill) => (
          <li
            key={skill}
            className={`px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 font-medium cursor-default transition-colors duration-200 ${theme.chipHover}`}
          >
            {skill}
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

const Skills = () => {
  return (
    <section id="skills" className="border-y border-slate-100/60" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #ffffff 40%, #f0f9ff 100%)' }}>
      <motion.div
        variants={stagger()}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
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
          variants={stagger()}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {skillCategories.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Skills;
