import { Notebook, ArrowRight } from 'lucide-react';
import { Container, PageSection, Button } from '../../components/ui';
import { useDocumentTitle } from '../../utils/useDocumentTitle';

const BlogIndex = () => {
  useDocumentTitle('Blog');

  return (
    <PageSection center>
      <Container className="max-w-xl">
        <div className="mx-auto mb-7 w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent-strong">
          <Notebook size={28} aria-hidden="true" />
        </div>

        <p className="eyebrow mb-4">Blog</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-4 tracking-tight">
          Field notes, coming soon.
        </h1>
        <p className="text-base text-slate-500 font-light leading-relaxed mb-10">
          I'm putting together write-ups on survey engineering, document control, and lessons
          from the field. Nothing published yet — check back soon, or get in touch directly in
          the meantime.
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

export default BlogIndex;
