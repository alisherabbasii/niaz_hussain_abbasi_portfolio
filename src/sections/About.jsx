import React from 'react';
import { Target, Compass, HardHat } from 'lucide-react';

const About = () => {
  return (
    <section id="about" className="relative">
      <div className="absolute inset-0 bg-white/50 -skew-y-2 z-0 transform origin-top-left border-y border-slate-100"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto">
        <h2 className="section-title">The Story Behind the Hard Hat</h2>
        <p className="section-subtitle">
          A dedicated professional with extensive experience in civil engineering and construction, 
          specifically in challenging terrains.
        </p>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-lg text-slate-600 leading-relaxed font-light">
            <p>
              I began my journey in engineering not just to build structures, but to overcome the most demanding environments nature has to offer. My expertise lies in navigating rocky terrains, managing intense blasting operations, and ensuring structural integrity where others see impossible hurdles.
            </p>
            <p className="border-l-4 border-accent pl-6 italic font-medium text-slate-700">
              "My philosophy revolves around precision, safety, and community impact. Every site is an opportunity to uplift the environment and the people around it."
            </p>
            <p>
              Beyond the blueprints, I am driven by a profound commitment to my community. Whether through my social work, my poetry, or my digital voice, I strive to empower and inspire.
            </p>
          </div>
          
          <div className="grid gap-6">
            <div className="card flex items-start gap-4 hover:-translate-y-1">
              <div className="p-3 bg-accent/10 text-accent rounded-xl">
                <Target size={24} />
              </div>
              <div>
                <h3 className="text-xl mb-1">Precision</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Exact calculation and careful site management, minimizing risks in volatile environments.</p>
              </div>
            </div>
            
            <div className="card flex items-start gap-4 hover:-translate-y-1">
              <div className="p-3 bg-accent/10 text-accent rounded-xl">
                <HardHat size={24} />
              </div>
              <div>
                <h3 className="text-xl mb-1">Safety First</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Rigorous adherence to compliance and safety during extreme operations like mountain blasting.</p>
              </div>
            </div>

            <div className="card flex items-start gap-4 hover:-translate-y-1">
              <div className="p-3 bg-accent/10 text-accent rounded-xl">
                <Compass size={24} />
              </div>
              <div>
                <h3 className="text-xl mb-1">Leadership</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Guiding teams with empathy and authority to deliver projects on time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
