import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Wrench, ArrowLeft } from 'lucide-react';
import { Container, Button, Badge } from '../../../components/ui';
import { getPostById } from '../../../api/blogService';
import { useDocumentTitle } from '../../../utils/useDocumentTitle';

/**
 * Stand-in for `/admin/blogs/new` and `/admin/blogs/:id/edit` — the rich
 * content editor itself isn't built yet. This only surfaces which post (if
 * any) was targeted, so Create/Edit aren't dead links, without offering any
 * form or save action.
 */
export default function PostEditorPlaceholder() {
  useDocumentTitle('Admin — Editor');
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    getPostById(Number(id))
      .then((data) => {
        if (!cancelled) setPost(data);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load that post.");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="py-8 md:py-10">
      <Container className="max-w-2xl">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 md:p-10 text-center">
          <div className="mx-auto mb-6 w-14 h-14 rounded-2xl bg-accent/10 text-accent-strong flex items-center justify-center">
            <Wrench size={24} aria-hidden="true" />
          </div>

          <p className="eyebrow mb-3">{id ? 'Edit post' : 'Create post'}</p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary mb-4 tracking-tight">
            The content editor isn&rsquo;t built yet
          </h1>

          {id && (
            <p className="text-sm text-slate-500 mb-2">
              {post ? (
                <>
                  Targeting <span className="font-bold text-primary">{post.title}</span>
                </>
              ) : error ? (
                error
              ) : (
                'Loading post…'
              )}
            </p>
          )}

          <p className="text-slate-500 font-light leading-relaxed mb-8 max-w-md mx-auto">
            Post management (search, filters, preview, duplicate, delete) is live. Writing and
            editing content will ship in a follow-up pass.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Button to="/admin/blogs" variant="outline" icon={ArrowLeft} iconPosition="leading">
              Back to blogs
            </Button>
            <Badge variant="warning" size="sm">Coming soon</Badge>
          </div>
        </div>
      </Container>
    </div>
  );
}
