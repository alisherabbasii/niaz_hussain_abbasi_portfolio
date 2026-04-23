import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, Video } from 'lucide-react';

const cards = [
  {
    Icon: BookOpen,
    title: 'Mountain Poet',
    description:
      'Channeling the raw beauty of mountain landscapes and the depth of human experience into verse — poetry that speaks of culture, resilience, and community.',
    tag: 'Creative Expression',
    gradient: 'from-rose-500 to-pink-600',
    cardBg: 'from-rose-50/80 to-pink-50/80',
    iconBg: 'from-rose-400 to-pink-500',
    glow: '0 20px 60px rgba(244,63,94,0.25)',
    blob: 'bg-rose-300',
  },
  {
    Icon: Users,
    title: 'Social Activist',
    description:
      'Actively contributing to community awareness and development through social media and on-the-ground volunteerism — driven by the belief that strong communities are built one person at a time.',
    tag: 'Community Impact',
    gradient: 'from-violet-500 to-indigo-600',
    cardBg: 'from-violet-50/80 to-indigo-50/80',
    iconBg: 'from-violet-400 to-indigo-500',
    glow: '0 20px 60px rgba(139,92,246,0.25)',
    blob: 'bg-violet-300',
  },
  {
    Icon: Video,
    title: 'YouTuber',
    description:
      'Creating content that shares positive messages, engineering insights, and cultural perspectives — reaching and inspiring a growing audience online.',
    tag: 'Digital Creator',
    gradient: 'from-amber-400 to-orange-500',
    cardBg: 'from-amber-50/80 to-orange-50/80',
    iconBg: 'from-amber-400 to-orange-500',
    glow: '0 20px 60px rgba(245,158,11,0.25)',
    blob: 'bg-amber-300',
  },
];

const Card = ({ Icon, title, description, tag, gradient, cardBg, iconBg, glow, blob, index }) => (
  <motion.div
    className={`relative rounded-3xl p-7 bg-gradient-to-br ${cardBg} backdrop-blur-sm border border-white/80 overflow-hidden group cursor-default`}
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.55, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -8, scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 22 } }}
    style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)' }}
  >
    {/* Hover glow overlay */}
    <motion.div
      className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      style={{ boxShadow: glow }}
    />

    {/* Decorative background blob */}
    <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full ${blob} opacity-[0.12] blur-3xl pointer-events-none`} />

    {/* Tag pill */}
    <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-widest mb-5 px-3 py-1 rounded-full bg-gradient-to-r ${gradient} text-white shadow-sm`}>
      {tag}
    </span>

    {/* Icon */}
    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${iconBg} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
      <Icon size={24} className="text-white" />
    </div>

    <h3 className="text-xl font-bold mb-3 text-slate-800">{title}</h3>
    <p className="text-slate-500 leading-[1.7] text-[0.9375rem] font-light">{description}</p>

    {/* Bottom gradient bar */}
    <div className={`absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r ${gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />
  </motion.div>
);

const Personal = () => (
  <section
    id="personal"
    className="relative overflow-hidden"
    style={{ background: 'linear-gradient(135deg, #fdf4ff 0%, #f0f9ff 45%, #fefce8 100%)' }}
  >
    {/* Ambient orbs */}
    <div className="absolute -top-16 -right-16 w-96 h-96 bg-violet-200/50 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-rose-200/50 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-200/30 rounded-full blur-2xl pointer-events-none" />

    <div className="relative z-10">
      <motion.p
        className="text-xs font-bold uppercase tracking-[0.2em] text-violet-500 text-center mb-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        The Human Side
      </motion.p>

      <motion.h2
        className="section-title"
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #d97706 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        Beyond Engineering
      </motion.h2>

      <motion.p
        className="section-subtitle"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Passions that define the person behind the profession.
      </motion.p>

      <div className="grid md:grid-cols-3 gap-8 mt-4">
        {cards.map((card, i) => (
          <Card key={card.title} {...card} index={i} />
        ))}
      </div>
    </div>
  </section>
);

export default Personal;
