import React from 'react';
import { ArrowRight, Download, MapPin } from 'lucide-react';

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center pt-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl -z-10 mix-blend-multiply"></div>
      <div className="absolute bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-slate-200/50 rounded-full blur-3xl -z-10 mix-blend-multiply"></div>

      <div className="w-full grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        <div className="flex flex-col items-start text-left order-2 lg:order-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-sm font-medium text-slate-600 mb-6 w-fit">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Available for new projects
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1] text-primary">
            Civil Engineer <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-dark">
              Site Specialist
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-xl font-light">
            Building structures with engineering precision, and empowering communities with human purpose.
          </p>
          
          <div className="flex flex-wrap gap-4 w-full sm:w-auto">
            <a href="#contact" className="btn-primary w-full sm:w-auto">
              Start a Project
              <ArrowRight size={18} />
            </a>
            <a href="#experience" className="btn-outline w-full sm:w-auto">
              View Experience
            </a>
          </div>

          <div className="mt-12 flex items-center gap-6 text-sm text-slate-500 font-medium w-fit">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-accent" />
              Pakistan
            </div>
            <div className="h-4 w-px bg-slate-300"></div>
            <div>
              <span className="text-primary font-bold">10+</span> Years Experience
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2 flex justify-center lg:justify-end relative">
          <div className="relative w-72 h-72 md:w-96 md:h-96">
            {/* Minimalist image placeholder */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-100 rounded-[2rem] rotate-3 scale-105 transition-transform duration-500 hover:rotate-6"></div>
            <div className="absolute inset-0 bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden flex items-center justify-center">
               <div className="text-center p-6">
                 <div className="w-24 h-24 bg-slate-100 mx-auto rounded-full mb-4 flex items-center justify-center">
                    <span className="text-4xl">👷‍♂️</span>
                 </div>
                 <p className="font-heading font-bold text-slate-400">Niaz Hussain</p>
                 <p className="text-sm text-slate-500">Image Placeholder</p>
               </div>
            </div>
            
            {/* Floating badge */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 animate-bounce" style={{animationDuration: '3s'}}>
              <div className="flex gap-2 items-center">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                  🚧
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Expertise in</p>
                  <p className="text-sm font-bold text-primary">Rocky Terrains</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
