import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, ArrowUpRight } from 'lucide-react';

const contactItems = [
  {
    Icon: Mail,
    label: 'Email',
    value: 'niazabbasi82@gmail.com',
    href: 'mailto:niazabbasi82@gmail.com',
    iconColor: 'text-sky-500',
    iconBg: 'bg-sky-50',
    valueHover: 'group-hover:text-sky-500',
    hoverBorder: 'hover:border-sky-200',
    hoverShadow: 'hover:shadow-sky-100',
    arrowColor: 'text-sky-500',
  },
  {
    Icon: Phone,
    label: 'Phone',
    value: '+90096650621844',
    href: 'tel:+90096650621844',
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-50',
    valueHover: 'group-hover:text-emerald-500',
    hoverBorder: 'hover:border-emerald-200',
    hoverShadow: 'hover:shadow-emerald-100',
    arrowColor: 'text-emerald-500',
  },
  {
    Icon: MapPin,
    label: 'Location',
    value: 'Pakistan',
    href: null,
    iconColor: 'text-violet-500',
    iconBg: 'bg-violet-50',
    valueHover: '',
    hoverBorder: 'hover:border-violet-200',
    hoverShadow: 'hover:shadow-violet-100',
    arrowColor: 'text-violet-500',
  },
];

const ContactCard = ({ Icon, label, value, href, iconColor, iconBg, valueHover, hoverBorder, hoverShadow, arrowColor, index }) => {
  const inner = (
    <motion.div
      className={`flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg ${hoverShadow} ${hoverBorder} transition-all duration-300 group`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
    >
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} shrink-0 group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-0.5">{label}</p>
        <p className={`text-sm font-semibold text-slate-800 truncate transition-colors duration-300 ${valueHover}`}>{value}</p>
      </div>
      {href && (
        <ArrowUpRight
          size={15}
          className={`${arrowColor} opacity-0 group-hover:opacity-100 translate-x-1 -translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300 shrink-0`}
        />
      )}
    </motion.div>
  );

  return href ? <a href={href} className="block">{inner}</a> : inner;
};

const Contact = () => (
  <section id="contact">
    <div className="rounded-[2.5rem] border border-slate-100/80 p-8 md:p-16 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)', boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 2px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,1)' }}>
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-100 rounded-full blur-3xl pointer-events-none -translate-x-1/3 translate-y-1/3" />

      <div className="grid lg:grid-cols-2 gap-14 relative z-10 items-start">

        {/* Left — CTA + contact cards */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-5">Get In Touch</p>

          <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-4 tracking-tight leading-[1.1]">
            Got a project
            <br />
            in mind?{' '}
            <span className="text-accent">Let's talk.</span>
          </h2>

          <p className="text-base text-slate-500 mb-10 font-light leading-relaxed max-w-sm">
            Whether it's a rocky terrain that needs taming or infrastructure requiring absolute
            precision — I'm ready to bring your vision to life.
          </p>

          <div className="space-y-3">
            {contactItems.map((item, i) => (
              <ContactCard key={item.label} {...item} index={i} />
            ))}
          </div>
        </motion.div>

        {/* Right — form */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="rounded-2xl p-8 border border-slate-100/80" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%)', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
            <h3 className="text-lg font-bold text-primary mb-1">Send a Message</h3>
            <p className="text-sm text-slate-400 font-light mb-7">I typically respond within 24 hours.</p>

            <form className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent bg-white transition-all text-sm text-slate-800 placeholder:text-slate-300"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), inset 0 2px 4px rgba(0,0,0,0.03)' }}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent bg-white transition-all text-sm text-slate-800 placeholder:text-slate-300"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), inset 0 2px 4px rgba(0,0,0,0.03)' }}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">Message</label>
                <textarea
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent bg-white transition-all resize-none text-sm text-slate-800 placeholder:text-slate-300"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), inset 0 2px 4px rgba(0,0,0,0.03)' }}
                  placeholder="Tell me about your project..."
                />
              </div>
              <button type="button" className="w-full btn-primary justify-center mt-1 group">
                Send Message
                <Send size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default Contact;
