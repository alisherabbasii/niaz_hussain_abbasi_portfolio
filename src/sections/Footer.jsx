import { Play, Share2, Link as LinkIcon } from 'lucide-react';
import { SocialLink } from '../components/ui';

const socialLinks = [
  {
    href: 'https://www.youtube.com/@NiazHussainAbbasi',
    label: 'YouTube',
    icon: Play,
    hoverClassName: 'hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100',
  },
  {
    href: '#',
    label: 'Twitter',
    icon: Share2,
    hoverClassName: 'hover:bg-sky-50 hover:text-sky-500 hover:border-sky-100',
  },
  {
    href: '#',
    label: 'LinkedIn',
    icon: LinkIcon,
    hoverClassName: 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100',
  },
];

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-100 py-14 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <a href="#home" className="text-xl font-heading font-black text-primary tracking-tight block mb-1.5">
            Niaz<span className="text-accent-strong">Hussain.</span>
          </a>
          <p className="text-slate-500 text-sm font-medium">Building with precision and purpose.</p>
        </div>

        <div className="flex items-center gap-3">
          {socialLinks.map((social) => (
            <SocialLink key={social.label} {...social} />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-slate-100 text-center text-xs text-slate-500 font-medium tracking-wide">
        © {new Date().getFullYear()} Niaz Hussain Abbasi. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
