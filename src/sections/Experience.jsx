import React from 'react';
import { Briefcase, MapPin, Calendar } from 'lucide-react';

const experiences = [
  {
    role: "Senior Survey Engineer",
    company: "Karachi Civil Division",
    location: "Karachi, PK",
    date: "2020 - Present",
    description: "Leading land survey operations for large-scale infrastructure projects. Specializing in topographic analysis and managing teams across difficult rocky sites.",
  },
  {
    role: "Blasting Supervisor",
    company: "Mountain Core Builders",
    location: "Northern Mountains",
    date: "2016 - 2020",
    description: "Supervised controlled detonations on steep mountainous terrain to pave paths for major highway expansions. Ensured zero safety incidents over 4 years.",
  },
  {
    role: "Civil Supervisor",
    company: "Urban Edge Construction",
    location: "Hyderabad, PK",
    date: "2012 - 2016",
    description: "Managed day-to-day site operations, interpreting construction drawings strictly, and organizing material logistics for commercial high-rises.",
  }
];

const Experience = () => {
  return (
    <section id="experience">
      <h2 className="section-title">Professional Journey</h2>
      <p className="section-subtitle">A track record of execution in harsh environments.</p>
      
      <div className="max-w-3xl mx-auto mt-12">
        <div className="relative border-l-2 border-slate-200 pl-8 ml-4 md:ml-0 md:pl-0 md:border-none space-y-12">
          
          {/* Vertical line for desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2"></div>
          
          {experiences.map((exp, index) => (
            <div key={index} className="relative flex flex-col md:flex-row justify-between items-center w-full group">
              
              {/* Timeline dot */}
              <div className="absolute -left-[41px] md:left-1/2 w-5 h-5 rounded-full bg-white border-4 border-accent md:-translate-x-1/2 z-10 group-hover:scale-125 transition-transform duration-300 shadow-sm"></div>

              {/* Left Content (or right for odd/even on desktop) */}
              <div className={`w-full md:w-[45%] ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:order-2 text-left'}`}>
                <div className="card border-none bg-white/60 hover:bg-white relative">
                  <h3 className="text-xl font-bold text-primary mb-1">{exp.role}</h3>
                  <div className={`flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500 mb-4 ${index % 2 === 0 ? 'md:justify-end' : 'justify-start'}`}>
                    <span className="flex items-center gap-1.5"><Briefcase size={14}/> {exp.company}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={14}/> {exp.location}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed font-light text-sm">{exp.description}</p>
                </div>
              </div>

              {/* Center date for desktop */}
              <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center w-32 py-1 bg-white border border-slate-200 rounded-full shadow-sm z-10">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Calendar size={12}/> {exp.date}
                </span>
              </div>
              
              {/* Responsive date for mobile */}
              <div className="md:hidden mt-4 w-full flex items-center text-xs font-bold text-slate-400 gap-1.5">
                 <Calendar size={14}/> {exp.date}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;
