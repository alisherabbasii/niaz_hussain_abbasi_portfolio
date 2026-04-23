import React from 'react';

const Values = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-primary text-white">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-full bg-accent/20 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-heading font-black mb-8 text-white">
          "True engineered strength isn't just in concrete, it's in the character of the community."
        </h2>
        <p className="text-lg text-slate-300 md:px-20 font-light">
          Dedicated to pushing boundaries in construction while lifting up the people around me, leaving both structural and social legacies.
        </p>
      </div>
    </section>
  );
};

export default Values;
