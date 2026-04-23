import React from 'react';
import { BookOpen, Users, Video } from 'lucide-react';

const Card = ({ icon, title, description, color }) => (
  <div className={`card overflow-hidden relative group border-t-4 ${color}`}>
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-current opacity-10 to-transparent rounded-bl-full`}></div>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
      {icon}
    </div>
    <h3 className="text-2xl mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed font-light">{description}</p>
  </div>
);

const Personal = () => {
  return (
    <section id="personal" className="bg-secondary/50 border-y border-slate-100">
      <h2 className="section-title">Beyond Engineering</h2>
      <p className="section-subtitle">Passions that define the person behind the profession.</p>

      <div className="grid md:grid-cols-3 gap-8 mt-12">
        <Card 
          icon={<BookOpen size={28} className="text-rose-500" />}
          title="Poet"
          description="Expressing resilience, culture, and observed human emotions through the art of poetry. Finding strict structure in creative rhythm."
          color="border-rose-500"
        />
        <Card 
          icon={<Users size={28} className="text-indigo-500" />}
          title="Social Worker"
          description="Actively volunteering and contributing to community development programs. Believing that strong structures start with strong people."
          color="border-indigo-500"
        />
        <Card 
          icon={<Video size={28} className="text-amber-500" />}
          title="YouTuber"
          description="Sharing experiences, engineering tips, and cultural commentary to educate and entertain a growing online audience."
          color="border-amber-500"
        />
      </div>
    </section>
  );
};

export default Personal;
