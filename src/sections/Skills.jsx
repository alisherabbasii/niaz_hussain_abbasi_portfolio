import React from 'react';
import { PenTool, Box, Mountain, Users, Calculator, ClipboardCheck } from 'lucide-react';

const skillCategories = [
  {
    title: "Engineering Tools",
    icon: <PenTool size={20} />,
    skills: ["AutoCAD", "Total Station", "GPS Surveying", "Construction Drawings", "Site Leveling"]
  },
  {
    title: "Project Management",
    icon: <ClipboardCheck size={20} />,
    skills: ["Logistics Strategy", "Team Supervision", "Safety Compliance", "Budget Estimation", "Material QC"]
  },
  {
    title: "Specialized Sites",
    icon: <Mountain size={20} />,
    skills: ["Rocky Terrains", "Mountain Blasting", "High-Altitude Sites", "Erosion Control", "Trenching"]
  }
];

const Skills = () => {
  return (
    <section id="skills" className="bg-white border-y border-slate-100">
      <h2 className="section-title">Core Competencies</h2>
      <p className="section-subtitle">Hard skills balanced with effective project management.</p>
      
      <div className="grid md:grid-cols-3 gap-8 mt-12">
        {skillCategories.map((category, idx) => (
          <div key={idx} className="card bg-secondary/30">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
              <div className="p-2.5 bg-white text-accent rounded-lg shadow-sm border border-slate-100">
                {category.icon}
              </div>
              <h3 className="text-xl">{category.title}</h3>
            </div>
            <ul className="space-y-3">
              {category.skills.map((skill, sIdx) => (
                <li key={sIdx} className="flex items-center gap-3 text-slate-600 font-medium group">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full group-hover:bg-accent group-hover:scale-150 transition-all duration-300"></div>
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Skills;
