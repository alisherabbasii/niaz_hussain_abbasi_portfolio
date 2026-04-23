import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, Video } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } }
};

const Card = ({ icon, title, description, color, accentBg }) => (
  <div className={`card overflow-hidden relative group border-t-4 ${color}`}>
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-current opacity-5 to-transparent rounded-bl-full"></div>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${accentBg}`}>
      {icon}
    </div>
    <h3 className="text-lg font-bold mb-2">{title}</h3>
    <p className="text-slate-500 leading-relaxed text-sm font-light">{description}</p>
  </div>
);

const Personal = () => {
  return (
    <section id="personal" className="bg-secondary/50 border-y border-slate-100">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.h2 variants={fadeUp} className="section-title">Beyond Engineering</motion.h2>
        <motion.p variants={fadeUp} className="section-subtitle">
          Passions that define the person behind the profession.
        </motion.p>

        <motion.div
          className="grid md:grid-cols-3 gap-8 mt-12"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.div variants={fadeUp}>
            <Card
              icon={<BookOpen size={22} className="text-rose-500" />}
              title="Poet"
              description="Expressing resilience, culture, and observed human emotions through the art of poetry. Finding strict structure in creative rhythm."
              color="border-rose-500"
              accentBg="bg-rose-50"
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <Card
              icon={<Users size={22} className="text-indigo-500" />}
              title="Social Worker"
              description="Actively volunteering and contributing to community development programs. Believing that strong structures start with strong people."
              color="border-indigo-500"
              accentBg="bg-indigo-50"
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <Card
              icon={<Video size={22} className="text-amber-500" />}
              title="YouTuber"
              description="Sharing experiences, engineering tips, and cultural commentary to educate and entertain a growing online audience."
              color="border-amber-500"
              accentBg="bg-amber-50"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Personal;
