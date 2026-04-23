import React from 'react';
import { motion } from 'framer-motion';
import { Target, HardHat, Compass } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } }
};

const highlights = [
  {
    icon: Target,
    title: 'Precision',
    description: 'Exact site calculation and meticulous management to minimise risk in demanding, volatile environments.',
    iconColor: 'text-accent',
    iconBg: 'bg-accent/10',
    border: 'border-l-accent',
  },
  {
    icon: HardHat,
    title: 'Safety First',
    description: 'Strict compliance with safety standards during extreme operations, including high-altitude mountain blasting.',
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50',
    border: 'border-l-amber-400',
  },
  {
    icon: Compass,
    title: 'Leadership',
    description: 'Guiding cross-functional teams with clarity and empathy to deliver complex projects on schedule.',
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-50',
    border: 'border-l-emerald-400',
  },
];

const About = () => {
  return (
    <section id="about" className="relative">
      <div className="absolute inset-0 bg-white/50 -skew-y-2 z-0 transform origin-top-left border-y border-slate-100"></div>

      <motion.div
        className="relative z-10"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        {/* Section header */}
        <div className="max-w-2xl mb-14">
          <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-3">
            About
          </motion.p>
          <motion.h2 variants={fadeUp} className="section-title !mb-4">
            The Story Behind the Hard Hat
          </motion.h2>
          <motion.p variants={fadeUp} className="section-subtitle !mb-0">
            A multi-skilled professional in civil engineering, construction supervision, and technical documentation.
          </motion.p>
        </div>

        {/* 2-column body */}
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-start">

          {/* Left — short story */}
          <motion.div variants={fadeUp} className="space-y-6">
            <p className="text-[1.0625rem] text-slate-600 leading-[1.8] font-light">
              With hands-on experience as a Survey Engineer, Civil Supervisor, Blasting Supervisor,
              and Document Controller, I have built a versatile career tackling complex construction
              challenges — particularly in mountainous and rocky environments where precision is non-negotiable.
            </p>

            <blockquote className="relative border-l-4 border-accent pl-5 py-1">
              <span className="absolute -top-3 -left-1 text-5xl text-accent/20 font-serif leading-none select-none">"</span>
              <p className="italic font-medium text-slate-700 text-base leading-relaxed">
                Every site is an opportunity to uplift both the environment and the people around it.
              </p>
            </blockquote>

            <p className="text-[1.0625rem] text-slate-600 leading-[1.8] font-light">
              Beyond the blueprints, I give back through social work, mountain poetry, and digital content
              — committed to inspiring and educating my community.
            </p>

            <div className="pt-2 flex items-center gap-8 text-sm font-medium text-slate-500">
              <div>
                <span className="block text-2xl font-extrabold text-primary">10+</span>
                Years on site
              </div>
              <div className="h-10 w-px bg-slate-200"></div>
              <div>
                <span className="block text-2xl font-extrabold text-primary">4</span>
                Core roles
              </div>
              <div className="h-10 w-px bg-slate-200"></div>
              <div>
                <span className="block text-2xl font-extrabold text-primary">3</span>
                Software tools
              </div>
            </div>
          </motion.div>

          {/* Right — highlight cards */}
          <motion.div className="grid gap-5" variants={stagger}>
            {highlights.map(({ icon: Icon, title, description, iconColor, iconBg, border }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                className={`card border-l-4 ${border} flex items-start gap-5 hover:shadow-md transition-shadow duration-300`}
              >
                <div className={`p-3 ${iconBg} ${iconColor} rounded-xl shrink-0 mt-0.5`}>
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary mb-1.5">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-light">{description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
};

export default About;
