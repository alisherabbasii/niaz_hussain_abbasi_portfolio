import { useParams } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';
import { Container, PageSection, Button, Badge } from '../../components/ui';
import { useDocumentTitle } from '../../utils/useDocumentTitle';

const BlogPost = () => {
  const { slug } = useParams();
  useDocumentTitle('Post not found');

  return (
    <PageSection center>
      <Container className="max-w-xl">
        <div className="mx-auto mb-7 w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent-strong">
          <FileText size={28} aria-hidden="true" />
        </div>

        <p className="eyebrow mb-4">Blog</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-4 tracking-tight">
          This story isn't live yet.
        </h1>
        <p className="text-base text-slate-500 font-light leading-relaxed mb-4">
          There's no published post at this address yet. The blog is still being written — come
          back once it's live.
        </p>
        <Badge variant="outline" size="sm" className="mb-10 font-mono normal-case tracking-normal">
          /blog/{slug}
        </Badge>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button to="/blog" icon={ArrowRight}>
            Back to blog
          </Button>
          <Button to="/" variant="outline">
            Homepage
          </Button>
        </div>
      </Container>
    </PageSection>
  );
};

export default BlogPost;
