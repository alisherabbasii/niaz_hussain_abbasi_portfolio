import { useEffect, useId, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, FolderPlus, Save } from 'lucide-react';
import { Container, Button, Input, Textarea } from '../../../components/ui';
import { listCategories, createCategory, updateCategory } from '../../../api/categoryService';
import { isHttpError } from '../../../api/httpError';
import { useDocumentTitle } from '../../../utils/useDocumentTitle';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Mirrors `backend/helpers/Blog.php::blog_slugify` closely enough for a live preview — the backend remains the source of truth. */
function slugify(text) {
  const ascii = text.normalize('NFKD').replace(/[̀-ͯ]/g, '');
  return ascii
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Well-known validation-message prefixes from `backend/api/categories/*.php`
 * mapped back onto the form field they describe, same pattern as
 * `posts/PostForm.jsx`'s `mapErrorToField`.
 */
function mapErrorToField(message) {
  const rules = [
    [/^name/i, 'name'],
    [/^Category ".*" already exists/i, 'name'],
    [/^slug/i, 'slug'],
    [/^Category slug/i, 'slug'],
  ];
  const match = rules.find(([pattern]) => pattern.test(message));
  return match?.[1] ?? null;
}

/** Shared create/edit form for `/admin/categories/new` and `/admin/categories/:id/edit`. */
export default function CategoryForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  useDocumentTitle(isEdit ? 'Admin — Edit Category' : 'Admin — New Category');

  const navigate = useNavigate();

  const nameId = useId();
  const slugId = useId();
  const descriptionId = useId();

  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');

  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;

    // No GET-by-id endpoint for a single category — the list is small, so
    // find it in the full listing instead.
    listCategories()
      .then((categories) => {
        if (cancelled) return;
        const category = (categories ?? []).find((c) => c.id === Number(id));
        if (!category) {
          setNotFound(true);
          return;
        }
        setName(category.name);
        setSlug(category.slug);
        setSlugTouched(true);
        setDescription(category.description ?? '');
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load this category. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleSlugChange = (e) => {
    setSlugTouched(true);
    setSlug(e.target.value);
  };

  const validate = () => {
    const errors = {};
    if (!name.trim() || name.trim().length > 100) {
      errors.name = 'Name is required and must be at most 100 characters.';
    }
    if (isEdit && (!slug.trim() || slug.length > 120 || !SLUG_PATTERN.test(slug))) {
      errors.slug = 'Slug must be lowercase alphanumeric segments separated by hyphens.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setFormError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateCategory(Number(id), {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
        });
      } else {
        await createCategory({
          name: name.trim(),
          description: description.trim() || undefined,
        });
      }
      navigate('/admin/categories', { replace: true });
    } catch (err) {
      if (isHttpError(err)) {
        const field = mapErrorToField(err.message);
        if (field) {
          setFieldErrors({ [field]: err.message });
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (notFound) {
    return (
      <div className="py-8 md:py-10">
        <Container className="max-w-lg">
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
            <p className="text-slate-500 mb-6">This category no longer exists.</p>
            <Button to="/admin/categories" variant="outline" icon={ArrowLeft} iconPosition="leading">
              Back to categories
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-10">
      <Container className="max-w-2xl">
        <div className="mb-8">
          <Button
            to="/admin/categories"
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            iconPosition="leading"
            className="!px-3 !py-2 mb-4"
          >
            Back to categories
          </Button>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-2">
            {isEdit ? 'Edit category' : 'Create category'}
          </h1>
          <p className="text-slate-500 font-light">
            {isEdit ? 'Update this category and save your changes.' : 'Add a new blog category.'}
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-slate-500">
            Loading…
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 flex items-center gap-3 text-sm font-semibold text-rose-700">
            <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />
            {loadError}
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8 space-y-5">
            <Input
              id={nameId}
              label="Category Name"
              value={name}
              onChange={handleNameChange}
              error={fieldErrors.name}
              disabled={submitting}
              required
            />

            {isEdit && (
              <div>
                <Input
                  id={slugId}
                  label="Slug"
                  value={slug}
                  onChange={handleSlugChange}
                  error={fieldErrors.slug}
                  disabled={submitting}
                  required
                />
                {!fieldErrors.slug && (
                  <p className="field-hint">
                    {slugTouched ? 'Manually edited — no longer follows the name.' : 'Auto-generated from the name.'}
                  </p>
                )}
              </div>
            )}
            {!isEdit && slug && (
              <p className="field-hint !mt-0">
                Slug: <span className="font-mono">/{slug}</span> (auto-generated from the name)
              </p>
            )}

            <Textarea
              id={descriptionId}
              label="Description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              hint="Optional."
            />

            {formError && (
              <p className="flex items-start gap-2 text-sm font-semibold text-rose-600 bg-danger/5 border border-danger/20 rounded-xl px-4 py-3" role="alert">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => navigate('/admin/categories')}
              >
                Cancel
              </Button>
              <Button type="submit" icon={isEdit ? Save : FolderPlus} iconPosition="leading" disabled={submitting}>
                {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create category'}
              </Button>
            </div>
          </form>
        )}
      </Container>
    </div>
  );
}
