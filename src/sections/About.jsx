import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Ruler, HardHat, ClipboardList } from 'lucide-react';
import { Button } from '../components/ui';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } }
};

const approach = [
  {
    icon: Ruler,
    title: 'Precision & Survey',
    description: 'Exact site calculation, GPS surveying, and leveling to minimise risk on demanding, uneven terrain.',
  },
  {
    icon: HardHat,
    title: 'Safety-First Supervision',
    description: 'Strict compliance during high-risk operations, including mountain blasting, with a zero-incident record.',
  },
  {
    icon: ClipboardList,
    title: 'Documentation & Coordination',
    description: 'Accurate document control and team coordination using Oracle and Excel-based systems.',
  },
];

const About = () => {
  return (
    <section id="about" className="relative">
      <div className="absolute inset-0 -skew-y-2 z-0 transform origin-top-left border-y border-slate-100/60" style={{ background: 'linear-gradient(160deg, rgba(248,250,252,0.95) 0%, rgba(255,255,255,0.92) 50%, rgba(240,249,255,0.88) 100%)' }}></div>

      <motion.div
        className="relative z-10"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        {/* Section header */}
        <div className="max-w-2xl mb-14">
          <motion.p variants={fadeUp} className="eyebrow mb-3">
            About
          </motion.p>
          <motion.h2 variants={fadeUp} className="section-title !mb-4 text-left">
            A Decade of Precision, Built On Site
          </motion.h2>
          <motion.p variants={fadeUp} className="section-subtitle !mb-0 text-left mx-0">
            Civil engineering, survey work, and document control — proven through hands-on
            roles across Pakistan&rsquo;s most demanding terrain.
          </motion.p>
        </div>

        {/* Asymmetric body: biography (left) vs. working approach (right) */}
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-14 lg:gap-16 items-start">

          {/* Left — biography, credentials-in-prose, CTA */}
          <motion.div variants={fadeUp} className="space-y-8">
            <div className="space-y-5 max-w-2xl">
              <p className="text-[1.0625rem] text-slate-600 leading-[1.75] font-light">
                My career has moved from reading construction drawings on site to controlling
                the documents an entire project depends on. Since 2012, I&rsquo;ve worked as a
                Civil Supervisor, Blasting Supervisor, and — most recently — Survey Engineer
                and Document Controller, with a consistent focus on mountainous and rocky
                terrain, where a small error in survey work or safety compliance carries real
                consequences.
              </p>
              <p className="text-[1.0625rem] text-slate-600 leading-[1.75] font-light">
                That progression has shaped how I work: precise measurement backed by
                documented decisions, and safety that isn&rsquo;t negotiable — whether
                I&rsquo;m supervising a controlled blast on a mountain pass or keeping survey
                and document records aligned for a team that relies on them.
              </p>
            </div>

            {/* Stat strip */}
            <div className="flex items-center gap-6 text-sm font-medium text-slate-500 rounded-2xl px-6 py-4" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)', boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)', border: '1px solid rgba(226,232,240,0.8)' }}>
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
                <span className="block text-2xl font-extrabold text-primary">4</span>
                Software tools
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button href="#contact" icon={ArrowRight}>
                Get in Touch
              </Button>
              <Button href="#experience" variant="outline" icon={ArrowUpRight}>
                Review My Experience
              </Button>
            </div>
          </motion.div>

          {/* Right — working approach, visually distinct from the biography */}
          <motion.div
            variants={fadeUp}
            className="rounded-3xl border border-slate-100/80 p-7 lg:p-8"
            style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', boxShadow: '0 2px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,1)' }}
          >
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-accent-strong mb-6">
              Working Approach
            </h3>
            <div className="divide-y divide-slate-100">
              {approach.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-4 py-5 first:pt-0 last:pb-0">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent-strong flex items-center justify-center shrink-0">
                    <Icon size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-[0.9375rem] font-bold text-primary mb-1">{title}</h4>
                    <p className="text-sm text-slate-500 leading-[1.65] font-light">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
};

export default About;
