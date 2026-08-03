import { ShieldAlert } from 'lucide-react';
import { Container, Button } from '../../components/ui';
import { useDocumentTitle } from '../../utils/useDocumentTitle';

/** Shown when an authenticated admin hits a route their role can't access (e.g. an editor visiting /admin/users). */
export default function Forbidden() {
  useDocumentTitle('Admin — Forbidden');

  return (
    <div className="py-8 md:py-10">
      <Container className="max-w-lg">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 md:p-10 text-center">
          <div className="mx-auto mb-6 w-14 h-14 rounded-2xl bg-danger/10 text-rose-600 flex items-center justify-center">
            <ShieldAlert size={24} aria-hidden="true" />
          </div>

          <p className="eyebrow mb-3">403</p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary mb-4 tracking-tight">
            You don&rsquo;t have access to this page
          </h1>
          <p className="text-slate-500 font-light leading-relaxed mb-8 max-w-sm mx-auto">
            Your account role doesn&rsquo;t include permission for this section. Contact a super
            admin if you believe this is a mistake.
          </p>

          <Button to="/admin" variant="outline">
            Back to dashboard
          </Button>
        </div>
      </Container>
    </div>
  );
}
