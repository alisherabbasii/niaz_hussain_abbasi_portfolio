import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Experience', href: '#experience' },
    { name: 'Skills', href: '#skills' },
    { name: 'Work', href: '#work' },
    { name: 'Personal', href: '#personal' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/85 backdrop-blur-md shadow-sm border-b border-slate-100/80 py-3' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 flex items-center justify-between">
        <a href="#" className="text-xl font-heading font-black text-primary tracking-tight">
          Niaz<span className="text-accent">Hussain.</span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <ul className="flex items-center gap-7">
            {navLinks.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  className="text-sm font-medium text-slate-500 hover:text-primary transition-colors"
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
          <a href="#contact" className="btn-primary py-2.5 px-5">
            Let's Talk
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-primary p-2 rounded-lg hover:bg-slate-100 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-xl"
          >
            <ul className="py-3 px-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="flex items-center justify-between py-3 px-4 rounded-xl text-slate-700 font-medium hover:bg-slate-50 hover:text-accent transition-all text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                    <ChevronRight size={15} className="text-slate-400" />
                  </a>
                </li>
              ))}
              <li className="pt-2 pb-2">
                <a
                  href="#contact"
                  className="btn-primary w-full justify-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Let's Talk
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
