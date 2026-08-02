import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, ArrowUpRight } from 'lucide-react';
import { Input, Textarea } from '../components/ui';
import { fadeUp, stagger, viewportOnce } from '../utils/motion';

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
    value: '+966 50 621 8449',
    href: 'tel:+966506218449',
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

const ContactCard = ({ Icon, label, value, href, iconColor, iconBg, valueHover, hoverBorder, hoverShadow, arrowColor }) => {
  const inner = (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4 }}
      className={`flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg ${hoverShadow} ${hoverBorder} transition-all duration-300 group`}
    >
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} shrink-0 group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-0.5">{label}</p>
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

const WHATSAPP_NUMBER = '966506218449';

/**
 * Own component so keystroke-driven state updates only re-render the form
 * itself, not the sibling contact-card column and its motion wrappers.
 */
const ContactForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = `Hello, I am contacting you from your website. Name: ${name}, Message: ${message}`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="rounded-2xl p-8 border border-slate-100/80" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%)', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
      <h3 className="text-lg font-bold text-primary mb-1">Send a Message</h3>
      <p className="text-sm text-slate-500 font-light mb-7">I typically respond within 24 hours.</p>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          id="contact-name"
          label="Name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
        />
        <Input
          id="contact-email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@example.com"
        />
        <Textarea
          id="contact-message"
          label="Message"
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell me about your project..."
        />
        <button type="submit" className="w-full btn-primary justify-center mt-1 group">
          Send Message
          <Send size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
        </button>
      </form>
    </div>
  );
};

const Contact = () => (
  <section id="contact">
    <div className="rounded-[2.5rem] border border-slate-100/80 p-8 md:p-16 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)', boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 2px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,1)' }}>
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-100 rounded-full blur-3xl pointer-events-none -translate-x-1/3 translate-y-1/3" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 relative z-10 items-start">

        {/* Left — CTA + contact cards */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <p className="eyebrow mb-5">Get In Touch</p>

          <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-4 tracking-tight leading-[1.1]">
            Got a project
            <br />
            in mind?{' '}
            <span className="text-accent-strong">Let's talk.</span>
          </h2>

          <p className="text-base text-slate-500 mb-10 font-light leading-relaxed max-w-sm">
            Whether it's a rocky terrain that needs taming or infrastructure requiring absolute
            precision — I'm ready to bring your vision to life.
          </p>

          <motion.div className="space-y-3" variants={stagger(0.1)} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            {contactItems.map((item) => (
              <ContactCard key={item.label} {...item} />
            ))}
          </motion.div>
        </motion.div>

        {/* Right — form */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <ContactForm />
        </motion.div>
      </div>
    </div>
  </section>
);

export default Contact;
