import { motion } from 'framer-motion';
import { Section } from '../components/ui';
import { fadeUp, stagger, viewportOnce } from '../utils/motion';
import { projects } from '../data/projects';

const THEME_CLASSES = {
  sky: {
    gradient: 'from-sky-500 via-blue-600 to-indigo-700',
    tag: 'bg-sky-50 text-sky-700',
  },
  emerald: {
    gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    tag: 'bg-emerald-50 text-emerald-700',
  },
  amber: {
    gradient: 'from-amber-500 via-orange-500 to-rose-600',
    tag: 'bg-amber-50 text-amber-700',
  },
};

/**
 * Case-study preview card. Content is always visible — no hover-only reveal —
 * so the full context/responsibility/tools/result set is reachable without a
 * mouse and without any expand/collapse machinery the short copy doesn't need.
 */
const ProjectCard = ({ project }) => {
  const theme = THEME_CLASSES[project.theme] ?? THEME_CLASSES.sky;
  const Icon = project.icon;

  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="card flex flex-col overflow-hidden"
    >
      {/* Header band — context + decorative icon */}
      <div className={`relative -m-6 mb-5 px-6 py-7 bg-gradient-to-br ${theme.gradient} overflow-hidden`}>
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
          aria-hidden="true"
        />
        <Icon size={110} strokeWidth={0.6} className="absolute -bottom-5 -right-5 text-white/15 pointer-events-none" aria-hidden="true" />
        <span className="relative inline-flex items-center text-[10px] font-bold uppercase tracking-[0.15em] text-white/90 bg-white/15 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20">
          {project.context}
        </span>
        <h3 className="relative text-xl font-bold text-white mt-4 leading-tight">{project.title}</h3>
      </div>

      <p className="text-sm text-slate-500 leading-[1.7] font-light mb-5">{project.responsibility}</p>

      <ul className="flex flex-wrap gap-2 mb-5">
        {project.tools.map((tool) => (
          <li key={tool} className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${theme.tag}`}>
            {tool}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-4 border-t border-slate-100 flex items-baseline gap-2">
        <span className="text-2xl font-black text-primary leading-none">{project.result.value}</span>
        <span className="text-xs text-slate-500 uppercase tracking-wide">{project.result.label}</span>
      </div>
    </motion.article>
  );
};

const WorkHighlights = () => {
  return (
    <Section
      id="work"
      eyebrow="Work"
      title="Work Highlights"
      subtitle="Real-world execution and problem-solving on demanding sites."
    >
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-12"
        variants={stagger()}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </motion.div>
    </Section>
  );
};

export default WorkHighlights;
