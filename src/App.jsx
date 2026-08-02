import { MotionConfig } from 'framer-motion';
import Navbar from './components/Navbar';
import { SkipToContent } from './components/ui';
import Hero from './sections/Hero';
import About from './sections/About';
import Experience from './sections/Experience';
import Education from './sections/Education';
import Skills from './sections/Skills';
import Certifications from './sections/Certifications';
import WorkHighlights from './sections/WorkHighlights';
import Personal from './sections/Personal';
import Values from './sections/Values';
import Contact from './sections/Contact';
import Footer from './sections/Footer';

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-secondary selection:bg-accent/20 selection:text-accent-dark">
        <SkipToContent />
        <header>
          <Navbar />
        </header>
        <main id="main-content" tabIndex={-1} className="focus:outline-none">
          <Hero />
          <About />
          <Experience />
          <Education />
          <Skills />
          <Certifications />
          <WorkHighlights />
          <Personal />
          <Values />
          <Contact />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}

export default App;
