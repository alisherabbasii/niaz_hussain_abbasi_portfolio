import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FilePlus2,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { Container, Button, Input, Textarea } from '../../../components/ui';
import { TiptapEditor } from '../../../components/blog/editor';
import { getPostById, createPost, updatePost } from '../../../api/blogService';
import { listCategories } from '../../../api/categoryService';
import { listUsers } from '../../../api/userService';
import { uploadCoverImage, deleteUpload, resolveUploadUrl } from '../../../api/uploadService';
import { isHttpError } from '../../../api/httpError';
import { useAuth } from '../../../features/admin/useAuth';
import { isSuperAdmin, ROLE_LABELS } from '../../../features/admin/permissions';
import { useDocumentTitle } from '../../../utils/useDocumentTitle';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UNSAVED_CHANGES_MESSAGE = 'You have unsaved changes. Leave without saving?';

/** Mirrors the allow-list in `backend/helpers/Upload.php::upload_allowed_types` — frontend check is for usability only, the backend remains authoritative. */
const COVER_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const COVER_ALLOWED_LABEL = 'JPG, PNG, WEBP, or GIF';
/** Mirrors `upload_max_bytes()`'s default (8 MiB) — the real cap is server-side and may be overridden there via UPLOAD_MAX_BYTES. */
const COVER_MAX_BYTES = 8 * 1024 * 1024;

/** Mirrors `backend/helpers/Blog.php::blog_slugify` closely enough for a live preview — the backend remains the source of truth. */
function slugify(text) {
  const ascii = text.normalize('NFKD').replace(/[̀-ͯ]/g, '');
  return ascii
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "2026-08-10 14:30:00" (MySQL DATETIME) -> "2026-08-10T14:30" (<input type="datetime-local">). */
function toDatetimeLocalValue(value) {
  if (!value) return '';
  return value.replace(' ', 'T').slice(0, 16);
}

/**
 * The backend returns a single `{ error: string }` message rather than
 * per-field errors, so this maps well-known validation-message prefixes back
 * onto the form field they describe. Falls back to a form-level banner when
 * a message doesn't match any known field.
 */
function mapErrorToField(message) {
  const rules = [
    [/^title/i, 'title'],
    [/^slug/i, 'slug'],
    [/^content/i, 'content'],
    [/^excerpt/i, 'excerpt'],
    [/^cover_image_alt/i, 'coverImageAlt'],
    [/^cover_image/i, 'coverImage'],
    [/^seo_title/i, 'seoTitle'],
    [/^seo_description/i, 'seoDescription'],
    [/^status/i, 'draft'],
    [/publish_at/i, 'publishAt'],
    [/author/i, 'author'],
    [/category/i, 'category'],
  ];
  const match = rules.find(([pattern]) => pattern.test(message));
  return match?.[1] ?? null;
}

function defaultSnapshot() {
  return {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    coverImageAlt: '',
    categoryId: '',
    draft: true,
    featured: false,
    seoTitle: '',
    seoDescription: '',
    publishAt: '',
    authorId: '',
  };
}

/** Shared create/edit form for `/admin/blogs/new` and `/admin/blogs/:id/edit`. */
export default function PostForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  useDocumentTitle(isEdit ? 'Admin — Edit Post' : 'Admin — New Post');

  const navigate = useNavigate();
  const location = useLocation();
  const { admin } = useAuth();
  const authorsSelectable = isSuperAdmin(admin);

  // PostList links here with `?returnTo=<its own query string>` so leaving
  // the form (Back, Cancel, or a successful save) lands back on the exact
  // same filtered/sorted/paginated list view instead of always resetting to
  // the unfiltered default.
  const returnTo = useMemo(() => {
    const raw = new URLSearchParams(location.search).get('returnTo');
    return raw ? `/admin/blogs?${raw}` : '/admin/blogs';
  }, [location.search]);

  const titleId = useId();
  const slugId = useId();
  const excerptId = useId();
  const contentId = useId();
  const coverImageId = useId();
  const coverImageAltId = useId();
  const categorySelectId = useId();
  const draftId = useId();
  const seoTitleId = useId();
  const seoDescriptionId = useId();
  const publishAtId = useId();
  const authorSelectId = useId();

  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [existingAuthorName, setExistingAuthorName] = useState('');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverImageAlt, setCoverImageAlt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [draft, setDraft] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [publishAt, setPublishAt] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [authorTouched, setAuthorTouched] = useState(false);

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [authorOptions, setAuthorOptions] = useState([]);

  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const [coverUploadError, setCoverUploadError] = useState('');
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  // The `uploads.id` of a cover image uploaded during this form session that
  // hasn't been attached to a successfully saved post yet. Only files we
  // know this id for are safe to delete outright (see handleRemoveCover):
  // they were never referenced by any saved post, so nothing else could be
  // pointing at them. A pre-existing cover loaded from the post being edited
  // never gets an id here, and is deliberately never auto-deleted — the
  // `uploads` table isn't foreign-keyed to blog_posts (see
  // backend/api/upload/delete.php's comment), so there's no reliable way to
  // confirm it isn't still referenced elsewhere.
  const [pendingUploadId, setPendingUploadId] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const [initialSnapshot, setInitialSnapshot] = useState(() => (isEdit ? null : JSON.stringify(defaultSnapshot())));

  useEffect(() => {
    let cancelled = false;
    listCategories()
      .then((data) => {
        if (!cancelled) setCategoryOptions(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setFormError('Could not load categories. Please refresh and try again.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Choosing an arbitrary author requires listing every admin, which
  // `GET /api/users/index.php` only allows for a super_admin (see
  // `backend/helpers/Permissions.php::permission_require_manage_users`) — for
  // anyone else the field stays a read-only display of the current/default author.
  useEffect(() => {
    if (!authorsSelectable) return undefined;
    let cancelled = false;
    listUsers({ per_page: 50, status: 'active' })
      .then((result) => {
        if (!cancelled) setAuthorOptions(Array.isArray(result?.data) ? result.data : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [authorsSelectable]);

  useEffect(() => {
    if (!isEdit) return undefined;

    let cancelled = false;
    Promise.resolve()
      .then(() => {
        setLoading(true);
        return getPostById(Number(id));
      })
      .then((post) => {
        if (cancelled) return;
        setTitle(post.title);
        setSlug(post.slug);
        setSlugTouched(true); // editing an existing, already-published slug shouldn't silently rewrite on title edits
        setExcerpt(post.excerpt ?? '');
        setContent(post.content ?? '');
        setCoverImage(post.cover_image ?? '');
        setCoverImageAlt(post.cover_image_alt ?? '');
        setCategoryId(post.category_id != null ? String(post.category_id) : '');
        setDraft(post.draft);
        setFeatured(post.featured);
        setSeoTitle(post.seo_title ?? '');
        setSeoDescription(post.seo_description ?? '');
        setPublishAt(toDatetimeLocalValue(post.publish_at));
        setExistingAuthorName(post.author ?? '');

        setInitialSnapshot(JSON.stringify({
          ...defaultSnapshot(),
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? '',
          content: post.content ?? '',
          coverImage: post.cover_image ?? '',
          coverImageAlt: post.cover_image_alt ?? '',
          categoryId: post.category_id != null ? String(post.category_id) : '',
          draft: post.draft,
          featured: post.featured,
          seoTitle: post.seo_title ?? '',
          seoDescription: post.seo_description ?? '',
          publishAt: toDatetimeLocalValue(post.publish_at),
        }));
      })
      .catch((err) => {
        if (cancelled) return;
        if (isHttpError(err) && err.status === 404) {
          setNotFound(true);
        } else {
          setLoadError("Couldn't load this post. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const currentSnapshot = JSON.stringify({
    title,
    slug,
    excerpt,
    content,
    coverImage,
    coverImageAlt,
    categoryId,
    draft,
    featured,
    seoTitle,
    seoDescription,
    publishAt,
    authorId,
  });
  const dirty = initialSnapshot !== null && initialSnapshot !== currentSnapshot;

  useEffect(() => {
    if (!dirty || submitting) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, submitting]);

  useEffect(() => {
    if (!success) return undefined;
    const timeout = setTimeout(() => {
      navigate(returnTo, { replace: true });
    }, 700);
    return () => clearTimeout(timeout);
  }, [success, navigate, returnTo]);

  // Mirrored into refs so the unmount-only cleanup effect below always reads
  // the latest value without re-running (and re-registering its cleanup) on
  // every change.
  const pendingUploadIdRef = useRef(null);
  useEffect(() => {
    pendingUploadIdRef.current = pendingUploadId;
  }, [pendingUploadId]);
  const coverPreviewUrlRef = useRef('');
  useEffect(() => {
    coverPreviewUrlRef.current = coverPreviewUrl;
  }, [coverPreviewUrl]);
  const successRef = useRef(false);
  useEffect(() => {
    successRef.current = Boolean(success);
  }, [success]);

  // Best-effort cleanup if the form is abandoned (Cancel, back button, nav
  // away) without ever saving: an in-session upload that never made it onto
  // a saved post is a guaranteed orphan, safe to delete. If the save
  // succeeded, pendingUploadId was already cleared, so this is a no-op.
  useEffect(() => {
    return () => {
      if (coverPreviewUrlRef.current) {
        URL.revokeObjectURL(coverPreviewUrlRef.current);
      }
      if (!successRef.current && pendingUploadIdRef.current !== null) {
        deleteUpload(pendingUploadIdRef.current).catch(() => {});
      }
    };
  }, []);

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleSlugChange = (e) => {
    setSlugTouched(true);
    setSlug(e.target.value);
  };

  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setCoverUploadError('');

    // Frontend validation is for usability (fail fast, no round trip) — the
    // backend re-validates real content (MIME sniffing, dimensions, etc.)
    // and is the authoritative check either way.
    if (!COVER_ALLOWED_MIME_TYPES.includes(file.type)) {
      setCoverUploadError(`Unsupported image type. Allowed formats: ${COVER_ALLOWED_LABEL}.`);
      return;
    }
    if (file.size > COVER_MAX_BYTES) {
      setCoverUploadError(`File exceeds the maximum allowed size of ${COVER_MAX_BYTES / (1024 * 1024)} MB.`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCoverPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return objectUrl;
    });
    setCoverUploading(true);
    setCoverUploadProgress(0);

    const previousPendingId = pendingUploadId;
    try {
      const result = await uploadCoverImage(file, setCoverUploadProgress);
      setCoverImage(result.url);
      setPendingUploadId(result.id);
      setFieldErrors((prev) => ({ ...prev, coverImage: undefined, coverImageAlt: undefined }));
      if (previousPendingId !== null) {
        // Safe to delete outright: it was uploaded earlier in this same
        // session and never made it into a saved post, so nothing else can
        // reference it.
        deleteUpload(previousPendingId).catch(() => {});
      }
    } catch (err) {
      setCoverUploadError(isHttpError(err) ? err.message : 'Could not upload image. Please try again.');
    } finally {
      setCoverPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return '';
      });
      setCoverUploading(false);
    }
  };

  const handleRemoveCover = () => {
    setCoverPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    setCoverImage('');
    setCoverImageAlt('');
    setCoverUploadError('');
    setFieldErrors((prev) => ({ ...prev, coverImage: undefined, coverImageAlt: undefined }));
    if (pendingUploadId !== null) {
      // Same reasoning as the replace path above: only ever delete a file we
      // know was never attached to a saved post.
      deleteUpload(pendingUploadId).catch(() => {});
      setPendingUploadId(null);
    }
  };

  const confirmDiscardIfDirty = (e) => {
    if (dirty && !window.confirm(UNSAVED_CHANGES_MESSAGE)) {
      e.preventDefault();
    }
  };

  const validate = () => {
    const errors = {};
    if (!title.trim() || title.trim().length > 200) {
      errors.title = 'Title is required and must be at most 200 characters.';
    }
    if (!slug.trim() || slug.length > 220 || !SLUG_PATTERN.test(slug)) {
      errors.slug = 'Slug must be lowercase alphanumeric segments separated by hyphens.';
    }
    if (!content.trim()) {
      errors.content = 'Content is required.';
    }
    if (!categoryId) {
      errors.category = 'Please select a category.';
    }
    if (excerpt.length > 400) {
      errors.excerpt = 'Short description must be at most 400 characters.';
    }
    if (coverImage.trim() && (!coverImage.trim().startsWith('/') || coverImage.trim().length > 500)) {
      errors.coverImage = 'Cover image must be an uploaded file path (starting with "/"), at most 500 characters.';
    }
    if (coverImageAlt.length > 300) {
      errors.coverImageAlt = 'Alt text must be at most 300 characters.';
    }
    if (coverImage.trim() && !coverImageAlt.trim()) {
      errors.coverImageAlt = 'Alt text is required when a cover image is set.';
    }
    if (seoTitle.length > 200) {
      errors.seoTitle = 'SEO title must be at most 200 characters.';
    }
    if (seoDescription.length > 400) {
      errors.seoDescription = 'SEO description must be at most 400 characters.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setFormError('');
    if (!validate()) return;

    const payload = {
      title: title.trim(),
      content,
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      cover_image: coverImage.trim() || null,
      cover_image_alt: coverImageAlt.trim() || null,
      category_id: Number(categoryId),
      featured,
      draft,
      seo_title: seoTitle.trim(),
      seo_description: seoDescription.trim(),
      publish_date: publishAt ? publishAt : null,
    };
    if (authorsSelectable && authorTouched && authorId) {
      payload.author = Number(authorId);
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await updatePost(Number(id), payload);
      } else {
        await createPost(payload);
      }
      setInitialSnapshot(currentSnapshot);
      setFieldErrors({});
      // The uploaded file (if any) is now attached to a saved post — no
      // longer an orphan the unmount/replace cleanup should touch.
      setPendingUploadId(null);
      setSuccess(isEdit ? 'Post updated.' : 'Post created.');
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

  const authorCurrentLabel = useMemo(() => {
    if (isEdit) return existingAuthorName || '—';
    return admin?.name ? `You — ${admin.name}` : 'You';
  }, [isEdit, existingAuthorName, admin]);

  // The local blob preview (shown instantly on file select, during upload)
  // takes priority over the saved/uploaded path so a replace shows the new
  // image right away instead of the one it's superseding.
  const hasCoverImage = Boolean(coverPreviewUrl || coverImage);
  const coverPreviewSrc = coverPreviewUrl || resolveUploadUrl(coverImage);

  if (notFound) {
    return (
      <div className="py-8 md:py-10">
        <Container className="max-w-lg">
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
            <p className="text-slate-500 mb-6">This post no longer exists.</p>
            <Button to={returnTo} variant="outline" icon={ArrowLeft} iconPosition="leading">
              Back to blogs
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-10">
      <Container className="max-w-3xl">
        <div className="mb-8">
          <Button
            to={returnTo}
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            iconPosition="leading"
            className="!px-3 !py-2 mb-4"
            onClick={confirmDiscardIfDirty}
          >
            Back to blogs
          </Button>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-2">
            {isEdit ? 'Edit post' : 'Create post'}
          </h1>
          <p className="text-slate-500 font-light">
            {isEdit ? 'Update this post and save your changes.' : 'Draft a new blog post.'}
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
              id={titleId}
              label="Title"
              value={title}
              onChange={handleTitleChange}
              error={fieldErrors.title}
              disabled={submitting}
              required
            />

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
                  {slugTouched ? 'Manually edited — no longer follows the title.' : 'Auto-generated from the title.'}
                </p>
              )}
            </div>

            <Textarea
              id={excerptId}
              label="Short description"
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              error={fieldErrors.excerpt}
              disabled={submitting}
              hint={!fieldErrors.excerpt ? `${excerpt.length}/400` : undefined}
            />

            <TiptapEditor
              id={contentId}
              label="Content"
              value={content}
              onChange={setContent}
              error={fieldErrors.content}
              disabled={submitting}
              required
            />

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor={coverImageId} className="field-label">Cover image</label>
                <div className="relative w-full aspect-video rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                  {coverPreviewSrc ? (
                    <img src={coverPreviewSrc} alt={coverImageAlt} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400">No cover image</span>
                  )}
                  {coverUploading && (
                    <div className="absolute inset-0 bg-slate-900/55 flex flex-col items-center justify-center gap-2 px-6 text-white">
                      <span className="text-xs font-semibold">Uploading… {coverUploadProgress}%</span>
                      <div className="w-full max-w-[10rem] h-1.5 rounded-full bg-white/30 overflow-hidden">
                        <div
                          className="h-full bg-white transition-all duration-150"
                          style={{ width: `${coverUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  id={coverImageId}
                  type="file"
                  accept={COVER_ALLOWED_MIME_TYPES.join(',')}
                  className="hidden"
                  onChange={handleCoverFileChange}
                />
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Upload}
                    iconPosition="leading"
                    disabled={submitting || coverUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {coverUploading ? 'Uploading…' : hasCoverImage ? 'Replace image' : 'Upload image'}
                  </Button>
                  {hasCoverImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      iconPosition="leading"
                      disabled={submitting || coverUploading}
                      onClick={handleRemoveCover}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="field-hint">{COVER_ALLOWED_LABEL}, up to {COVER_MAX_BYTES / (1024 * 1024)} MB.</p>
                {coverUploadError && <p className="field-error" role="alert">{coverUploadError}</p>}
                {fieldErrors.coverImage && <p className="field-error" role="alert">{fieldErrors.coverImage}</p>}
              </div>

              <Input
                id={coverImageAltId}
                label={hasCoverImage ? 'Cover image alt text (required)' : 'Cover image alt text'}
                value={coverImageAlt}
                onChange={(e) => setCoverImageAlt(e.target.value)}
                error={fieldErrors.coverImageAlt}
                disabled={submitting || !hasCoverImage}
                required={hasCoverImage}
                hint={!fieldErrors.coverImageAlt && !hasCoverImage ? 'Upload a cover image to set alt text.' : undefined}
              />
            </div>

            <div>
              <span className="field-label">Author</span>
              {authorsSelectable ? (
                <select
                  id={authorSelectId}
                  className="field-input"
                  value={authorId}
                  disabled={submitting}
                  onChange={(e) => {
                    setAuthorId(e.target.value);
                    setAuthorTouched(true);
                  }}
                >
                  <option value="">{isEdit ? `Current: ${authorCurrentLabel}` : authorCurrentLabel}</option>
                  {(authorOptions ?? []).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.full_name} — {ROLE_LABELS[a.role]}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
                  {authorCurrentLabel}
                </div>
              )}
              {fieldErrors.author && <p className="field-error" role="alert">{fieldErrors.author}</p>}
            </div>

            <div>
              <label htmlFor={categorySelectId} className="field-label">
                Category
              </label>
              <select
                id={categorySelectId}
                className="field-input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={submitting}
                required
              >
                <option value="" disabled>
                  Select Category
                </option>
                {(categoryOptions ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.category && <p className="field-error" role="alert">{fieldErrors.category}</p>}
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor={draftId} className="field-label">
                  Status
                </label>
                <select
                  id={draftId}
                  className="field-input"
                  value={draft ? 'draft' : 'published'}
                  onChange={(e) => setDraft(e.target.value === 'draft')}
                  disabled={submitting}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div>
                <span className="field-label">Featured</span>
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    disabled={submitting}
                    className="w-4 h-4 rounded accent-accent-strong"
                  />
                  <span className="text-sm font-semibold text-primary">
                    {featured ? 'Featured' : 'Not featured'}
                  </span>
                </label>
              </div>
            </div>

            <Input
              id={publishAtId}
              type="datetime-local"
              label="Publish date & time"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
              error={fieldErrors.publishAt}
              disabled={submitting}
              hint={!fieldErrors.publishAt ? 'Leave blank to publish immediately (or keep as a draft).' : undefined}
            />

            <div className="pt-2 border-t border-slate-100 space-y-5">
              <p className="field-label !mb-0">SEO</p>
              <Input
                id={seoTitleId}
                label="SEO title"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                error={fieldErrors.seoTitle}
                disabled={submitting}
                hint={!fieldErrors.seoTitle ? `${seoTitle.length}/200` : undefined}
              />
              <Textarea
                id={seoDescriptionId}
                label="SEO description"
                rows={3}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                error={fieldErrors.seoDescription}
                disabled={submitting}
                hint={!fieldErrors.seoDescription ? `${seoDescription.length}/400` : undefined}
              />
            </div>

            {formError && (
              <p className="flex items-start gap-2 text-sm font-semibold text-rose-600 bg-danger/5 border border-danger/20 rounded-xl px-4 py-3" role="alert">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
                {formError}
              </p>
            )}

            {success && (
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-success/10 border border-success/20 rounded-xl px-4 py-3" role="status">
                <CheckCircle2 size={15} className="shrink-0" aria-hidden="true" />
                {success}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => {
                  if (dirty && !window.confirm(UNSAVED_CHANGES_MESSAGE)) return;
                  navigate(returnTo);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" icon={isEdit ? Save : FilePlus2} iconPosition="leading" disabled={submitting}>
                {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create post'}
              </Button>
            </div>
          </form>
        )}
      </Container>
    </div>
  );
}
