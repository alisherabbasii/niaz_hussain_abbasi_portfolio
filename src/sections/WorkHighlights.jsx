import React from 'react';
import { ExternalLink, Construction } from 'lucide-react';

const projects = [
  {
    title: "Northern Highway Expansion",
    category: "Mountain Terrain",
    description: "Executed controlled blasting and leveling for a 50km highway stretch through rocky mountains.",
    tags: ["Blasting", "Surveying"],
    color: "bg-blue-100/50"
  },
  {
    title: "City Central Mall",
    category: "Commercial Layout",
    description: "Managed complete site layout from initial blueprints to foundations, ensuring millimeter precision.",
    tags: ["AutoCAD", "Supervision"],
    color: "bg-emerald-100/50"
  },
  {
    title: "River Dam Support Base",
    category: "Infrastructure",
    description: "Coordinated logistics and heavy machinery placement on uneven riverside terrain.",
    tags: ["Logistics", "Safety"],
    color: "bg-amber-100/50"
  }
];

const WorkHighlights = () => {
  return (
    <section id="work">
      <h2 className="section-title">Work Highlights</h2>
      <p className="section-subtitle">Real-world execution and problem-solving.</p>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {projects.map((project, idx) => (
          <div key={idx} className={`card ${project.color} group relative overflow-hidden flex flex-col h-full`}>
            {/* Background design */}
            <div className="absolute top-0 right-0 p-8 transform translate-x-1/2 -translate-y-1/2 opacity-5 text-primary group-hover:scale-150 transition-transform duration-500">
               <Construction size={120} />
            </div>

            <div className="mb-auto relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-accent mb-2 block">{project.category}</span>
              <h3 className="text-2xl mb-3 text-primary">{project.title}</h3>
              <p className="text-slate-600 font-light leading-relaxed mb-6">
                {project.description}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-6 relative z-10">
              {project.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-white/60 backdrop-blur text-xs font-medium text-slate-700 rounded-full border border-white">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WorkHighlights;
