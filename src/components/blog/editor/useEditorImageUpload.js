import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadEditorImage } from '../../../api/uploadService';
import { isHttpError } from '../../../api/httpError';

/** Mirrors the allow-list in `backend/helpers/Upload.php::upload_allowed_types` — frontend check is for usability only, the backend remains authoritative. */
export const EDITOR_IMAGE_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const EDITOR_IMAGE_ALLOWED_LABEL = 'JPG, PNG, WEBP, or GIF';
/** Mirrors `upload_max_bytes()`'s default (8 MiB) — the real cap is server-side and may be overridden there via UPLOAD_MAX_BYTES. */
export const EDITOR_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

function validateFile(file) {
  if (!EDITOR_IMAGE_ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Unsupported image type. Allowed formats: ${EDITOR_IMAGE_ALLOWED_LABEL}.`;
  }
  if (file.size > EDITOR_IMAGE_MAX_BYTES) {
    return `File exceeds the maximum allowed size of ${EDITOR_IMAGE_MAX_BYTES / (1024 * 1024)} MB.`;
  }
  return null;
}

/**
 * Uploads a file for the TipTap editor's image node via `uploadEditorImage`
 * and only inserts an image node once the upload has actually succeeded —
 * nothing is written into the document while a file is in flight or after a
 * failure, so a rejected/failed upload can never leave behind a broken
 * image node or a local blob-URL src. `editor` may still be null on the
 * first render (see TiptapEditor's `useEditor` call); a ref keeps
 * `insertImageFile`'s identity stable across that transition.
 */
export function useEditorImageUpload(editor) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const editorRef = useRef(editor);
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const clearError = useCallback(() => setError(''), []);

  /**
   * @param {File} file
   * @param {number} [insertPos] Document position to insert at — defaults to
   *   the current selection (toolbar/paste use). Drag-and-drop passes the
   *   drop coordinates' resolved position explicitly.
   */
  const insertImageFile = useCallback(async (file, insertPos) => {
    setError('');
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    try {
      const result = await uploadEditorImage(file);
      const currentEditor = editorRef.current;
      if (!currentEditor || currentEditor.isDestroyed) return;

      const pos = typeof insertPos === 'number' ? insertPos : currentEditor.state.selection.from;
      currentEditor.chain().focus().insertContentAt(pos, { type: 'image', attrs: { src: result.url, alt: '' } }).run();
    } catch (err) {
      setError(isHttpError(err) ? err.message : 'Could not upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploading, error, insertImageFile, clearError };
}
