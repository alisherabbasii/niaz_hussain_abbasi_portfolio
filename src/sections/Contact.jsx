import React from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const Contact = () => {
  return (
    <section id="contact">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 md:p-16 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="grid lg:grid-cols-2 gap-16 relative z-10">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-4">Let's build something.</h2>
            <p className="text-lg text-slate-500 mb-10 font-light">
              Whether it's a rocky terrain that needs taming or an infrastructure layout requiring absolute precision, I'm ready to help.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-slate-700">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-accent">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">Email</p>
                  <a href="mailto:hello@niazhussain.com" className="text-lg font-bold hover:text-accent transition-colors">hello@niazhussain.com</a>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-slate-700">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-accent">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">Phone</p>
                  <a href="tel:+923000000000" className="text-lg font-bold hover:text-accent transition-colors">+92 300 0000000</a>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-slate-700">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-accent">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">Location</p>
                  <p className="text-lg font-bold">Pakistan</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-secondary/50 rounded-2xl p-8 border border-white">
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent bg-white transition-all shadow-sm"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent bg-white transition-all shadow-sm"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent bg-white transition-all shadow-sm resize-none"
                  placeholder="Tell me about your project..."
                />
              </div>
              <button 
                type="button" 
                className="w-full btn-primary justify-center mt-2 group"
              >
                Send Message
                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
