import React from 'react';
// import {  Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <a href="#" className="text-2xl font-heading font-black text-primary tracking-tight block mb-2">
            Niaz<span className="text-accent">Hussain.</span>
          </a>
          <p className="text-slate-500 text-sm font-medium">Building with precision and purpose.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
            {/* <Youtube size={20} /> */}
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-colors">
            {/* <Twitter size={20} /> */}
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-700 transition-colors">
            {/* <Linkedin size={20} /> */}
          </a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-slate-100 text-center text-sm text-slate-400 font-medium">
        © {new Date().getFullYear()} Niaz Hussain Abbasi. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
