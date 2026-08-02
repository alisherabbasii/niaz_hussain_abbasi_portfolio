import { motion } from 'framer-motion';
import { Award, ExternalLink } from 'lucide-react';
import { Section, Card } from '../components/ui';
import { fadeUp, stagger, viewportOnce } from '../utils/motion';
import { certifications } from '../data/certifications';

/**
 * Self-hides while `certifications` is empty (see src/data/certifications.js)
 * — no placeholder credentials are rendered. Add a verified entry to the
 * data file and this section appears automatically, no component change
 * required.
 */
const Certifications = () => {
  if (!certifications.length) return null;

  return (
    <Section
      id="certifications"
      eyebrow="Credentials"
      title="Certifications"
      subtitle="Professional credentials and issuing bodies."
    >
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12"
        variants={stagger()}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        {certifications.map((cert) => {
          const dateRange = cert.expiryDate ? `${cert.issueDate} – ${cert.expiryDate}` : cert.issueDate;
          return (
            <motion.div key={cert.id} variants={fadeUp}>
              <Card className="h-full">
                <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent-strong flex items-center justify-center mb-4">
                  <Award size={20} aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-primary leading-snug mb-1">{cert.name}</h3>
                <p className="text-sm text-slate-500 font-medium mb-3">{cert.issuer}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                  {dateRange && <span>{dateRange}</span>}
                  {cert.credentialId && <span>ID: {cert.credentialId}</span>}
                </div>
                {cert.credentialUrl && (
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link inline-flex items-center gap-1.5 text-sm mt-4"
                  >
                    Verify credential
                    <ExternalLink size={13} aria-hidden="true" />
                  </a>
                )}
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </Section>
  );
};

export default Certifications;
