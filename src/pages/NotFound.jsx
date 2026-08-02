import { Compass, ArrowRight } from 'lucide-react';
import { Container, PageSection, Button } from '../components/ui';
import { useDocumentTitle } from '../utils/useDocumentTitle';

const NotFound = () => {
  useDocumentTitle('Page not found');

  return (
    <PageSection center>
      <Container className="max-w-xl">
        <div className="mx-auto mb-7 w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent-strong">
          <Compass size={28} aria-hidden="true" />
        </div>

        <p className="eyebrow mb-4">404</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-4 tracking-tight">
          This page took a wrong turn.
        </h1>
        <p className="text-base text-slate-500 font-light leading-relaxed mb-10">
          The page you're looking for doesn't exist or may have moved. Let's get you back on
          track.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button to="/" icon={ArrowRight}>
            Back to homepage
          </Button>
          <Button to="/#contact" variant="outline">
            Contact me
          </Button>
        </div>
      </Container>
    </PageSection>
  );
};

export default NotFound;
