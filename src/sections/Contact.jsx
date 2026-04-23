import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

const Contact = () => {
  return (
    <section id="contact">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 md:p-16 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-100/60 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2"></div>

        <div className="grid lg:grid-cols-2 gap-16 relative z-10">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-5xl font-extrabold text-primary mb-4 tracking-tight leading-tight"
            >
              Let's build something.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-base text-slate-500 mb-10 font-light leading-relaxed">
              Whether it's a rocky terrain that needs taming or an infrastructure layout requiring
              absolute precision, I'm ready to help.
            </motion.p>

            <motion.div variants={stagger} className="space-y-5">
              {[
                { icon: Mail, label: "Email", value: "niazabbasi82@gmail.com", href: "mailto:niazabbasi82@gmail.com" },
                { icon: Phone, label: "Phone", value: "+90096650621844", href: "tel:+90096650621844" },
                { icon: MapPin, label: "Location", value: "Pakistan", href: null }
              ].map(({ icon: Icon, label, value, href }) => (
                <motion.div key={label} variants={fadeUp} className="flex items-center gap-4 text-slate-700">
                  <div className="w-11 h-11 rounded-xl bg-accent/8 flex items-center justify-center text-accent border border-accent/10 shrink-0">
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
                    {href ? (
                      <a href={href} className="text-base font-bold hover:text-accent transition-colors">
                        {value}
                      </a>
                    ) : (
                      <p className="text-base font-bold">{value}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="bg-secondary/60 rounded-2xl p-8 border border-slate-100"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, margin: "-60px" }}
          >
            <form className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent bg-white transition-all shadow-sm text-sm"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent bg-white transition-all shadow-sm text-sm"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent bg-white transition-all shadow-sm resize-none text-sm"
                  placeholder="Tell me about your project..."
                />
              </div>
              <button type="button" className="w-full btn-primary justify-center mt-2 group">
                Send Message
                <Send size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
