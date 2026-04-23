import React from 'react';
import Navbar from './components/Navbar';
import Hero from './sections/Hero';
import About from './sections/About';
import Experience from './sections/Experience';
import Skills from './sections/Skills';
import WorkHighlights from './sections/WorkHighlights';
import Personal from './sections/Personal';
import Values from './sections/Values';
import Contact from './sections/Contact';
import Footer from './sections/Footer';

function App() {
  return (
    <div className="min-h-screen bg-secondary selection:bg-accent/20 selection:text-accent-dark">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Experience />
        <Skills />
        <WorkHighlights />
        <Personal />
        <Values />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
