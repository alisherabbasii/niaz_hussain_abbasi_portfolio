import { Link } from 'react-router-dom';
import { Container, PageSection } from '../components/ui';
import { useDocumentTitle } from '../utils/useDocumentTitle';

const LAST_UPDATED = 'August 2, 2026';

const PrivacyPolicy = () => {
  useDocumentTitle('Privacy Policy');

  return (
    <PageSection>
      <Container className="max-w-3xl">
        <p className="eyebrow mb-4">Legal</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-3 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500 font-medium mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-10 text-slate-600 font-light leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">Overview</h2>
            <p>
              This site (niazabbasi.com) is a personal portfolio for Niaz Hussain Abbasi. It
              doesn't run a backend server or database — it's a static site, and this policy
              explains the little data that does pass through it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-3">Information the contact form collects</h2>
            <p>
              The contact form asks for your name, email address, and message. Submitting it
              opens a pre-filled WhatsApp conversation, addressed to me, containing your name
              and message — nothing is transmitted to or stored on a server. If you'd like a
              reply by email instead, include your email address in the message itself.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-3">Cookies &amp; analytics</h2>
            <p>
              This site does not use cookies, analytics, or tracking scripts of its own. Page
              typefaces are loaded from Google Fonts, which means your browser makes a direct
              request to Google's servers to fetch them, subject to{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-strong font-medium hover:underline"
              >
                Google's privacy policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-3">Third-party links</h2>
            <p>
              Links to external services such as YouTube, WhatsApp, email, and phone are handled
              entirely by those services once you leave this site. Their own privacy policies
              apply to any information you share there.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-3">Data retention</h2>
            <p>
              Because form submissions go straight to WhatsApp rather than to a server this site
              controls, no submission history is retained here. Any record of the conversation
              lives in WhatsApp, under WhatsApp's own retention and privacy terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-3">Your choices</h2>
            <p>
              You're never required to use the contact form — reaching out by email or phone
              directly works just as well, and is listed on the{' '}
              <Link to="/#contact" className="text-accent-strong font-medium hover:underline">
                Contact
              </Link>{' '}
              section of the homepage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-3">Changes to this policy</h2>
            <p>
              If how this site handles data changes — for example, when the planned blog adds
              comments or newsletter sign-up — this page will be updated and the date above will
              change accordingly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary mb-3">Contact</h2>
            <p>
              Questions about this policy can be sent to{' '}
              <a
                href="mailto:niazabbasi82@gmail.com"
                className="text-accent-strong font-medium hover:underline"
              >
                niazabbasi82@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </Container>
    </PageSection>
  );
};

export default PrivacyPolicy;
