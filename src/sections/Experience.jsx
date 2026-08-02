import { motion } from 'framer-motion';
import { MapPin, Calendar, Building2 } from 'lucide-react';
import { Section } from '../components/ui';
import { fadeUp, stagger, viewportOnce } from '../utils/motion';
import { experience } from '../data/experience';

const THEME_CLASSES = {
  accent: {
    iconBg: 'bg-accent',
    ring: 'ring-accent/20',
    tag: 'bg-accent/10 text-accent-strong',
    border: 'border-accent/40',
  },
  amber: {
    iconBg: 'bg-amber-400',
    ring: 'ring-amber-200',
    tag: 'bg-amber-50 text-amber-600',
    border: 'border-amber-300',
  },
  emerald: {
    iconBg: 'bg-emerald-500',
    ring: 'ring-emerald-200',
    tag: 'bg-emerald-50 text-emerald-600',
    border: 'border-emerald-300',
  },
};

const ExperienceCard = ({ role }) => {
  const theme = THEME_CLASSES[role.theme] ?? THEME_CLASSES.accent;
  const dateRange = `${role.startDate} – ${role.endDate}`;

  return (
    <motion.article
      className="card"
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${theme.border} ${theme.tag}`}>
          <Calendar size={11} aria-hidden="true" />
          <time>{dateRange}</time>
        </span>
        <span className="text-xs text-slate-500 font-semibold">{role.duration}</span>
      </div>

      <h3 className="text-lg font-bold text-primary mb-1 leading-snug">{role.role}</h3>

      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">
        <span className="flex items-center gap-1"><Building2 size={11} aria-hidden="true" /> {role.company}</span>
        <span className="text-slate-200" aria-hidden="true">·</span>
        <span className="flex items-center gap-1"><MapPin size={11} aria-hidden="true" /> {role.location}</span>
      </div>

      <p className="text-sm text-slate-500 leading-[1.7] font-light mb-4">{role.description}</p>

      <ul className="flex flex-wrap gap-2">
        {role.tags.map((tag) => (
          <li key={tag} className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${theme.tag}`}>
            {tag}
          </li>
        ))}
      </ul>
    </motion.article>
  );
};

const Experience = () => {
  return (
    <Section
      id="experience"
      eyebrow="Experience"
      title="Professional Journey"
      subtitle="A track record of execution in demanding environments, in reverse-chronological order."
    >
      {/* Single DOM tree at every breakpoint — a left-aligned rail with icon
          nodes, which scales cleanly instead of maintaining separate mobile
          and desktop layouts (see docs/01-WEBSITE-AUDIT-AND-ROADMAP.md §5.4). */}
      <ol className="relative mt-16 space-y-10 md:space-y-12">
        <div className="absolute left-5 md:left-6 top-2 bottom-2 w-px bg-slate-200" aria-hidden="true" />

        {experience.map((role, index) => {
          const theme = THEME_CLASSES[role.theme] ?? THEME_CLASSES.accent;
          const Icon = role.icon;

          return (
            <motion.li
              key={role.id}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              variants={stagger(0, index * 0.08)}
              className="relative pl-16 md:pl-20"
            >
              <motion.div
                variants={fadeUp}
                whileHover={{ scale: 1.08 }}
                className={`absolute left-0 top-0 w-10 h-10 md:w-12 md:h-12 rounded-xl ${theme.iconBg} flex items-center justify-center ring-4 md:ring-8 ${theme.ring} transition-transform duration-200`}
                style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.1)' }}
              >
                <Icon size={18} className="text-white" aria-hidden="true" />
              </motion.div>

              <motion.div variants={fadeUp}>
                <ExperienceCard role={role} />
              </motion.div>
            </motion.li>
          );
        })}
      </ol>
    </Section>
  );
};

export default Experience;
