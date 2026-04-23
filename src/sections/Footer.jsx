import React from 'react';
import { Play, Share2, Link } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-100 py-14 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <a href="#" className="text-xl font-heading font-black text-primary tracking-tight block mb-1.5">
            Niaz<span className="text-accent">Hussain.</span>
          </a>
          <p className="text-slate-400 text-sm font-medium">Building with precision and purpose.</p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="#"
            className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all duration-200"
            aria-label="YouTube"
          >
            <Play size={16} />
          </a>
          <a
            href="#"
            className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-500 hover:border-sky-100 transition-all duration-200"
            aria-label="Twitter"
          >
            <Share2 size={16} />
          </a>
          <a
            href="#"
            className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all duration-200"
            aria-label="LinkedIn"
          >
            <Link size={16} />
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-slate-100 text-center text-xs text-slate-400 font-medium tracking-wide">
        © {new Date().getFullYear()} Niaz Hussain Abbasi. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
