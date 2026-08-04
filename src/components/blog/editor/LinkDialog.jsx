import { useId, useState } from 'react';
import { Modal, Button, Input } from '../../ui';
import { normalizeLinkUrl } from '../../../features/blog/editorContent';

/**
 * Insert/edit-link dialog for the TipTap toolbar's Link button. Snapshots
 * the editor's current selection/link state the moment `open` flips true
 * (mirroring the slug-change pattern in BlogPost.jsx: state is adjusted
 * directly during render, guarded by a "did we already sync this open
 * cycle" flag, rather than in a useEffect) since the dialog is only ever
 * open for a single, short-lived edit.
 */
export default function LinkDialog({ editor, open, onClose }) {
  const urlFieldId = useId();
  const textFieldId = useId();

  const [syncedOpen, setSyncedOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [hasSelection, setHasSelection] = useState(false);
  const [isEditingExistingLink, setIsEditingExistingLink] = useState(false);
  const [urlError, setUrlError] = useState('');

  if (editor && open && !syncedOpen) {
    const { from, to, empty } = editor.state.selection;
    setSyncedOpen(true);
    setHasSelection(!empty);
    setIsEditingExistingLink(editor.isActive('link'));
    setLinkText(empty ? '' : editor.state.doc.textBetween(from, to, ' '));
    setUrl(editor.getAttributes('link').href ?? '');
    setUrlError('');
  } else if (!open && syncedOpen) {
    setSyncedOpen(false);
  }

  if (!editor) return null;

  const needsTextInput = !hasSelection && !isEditingExistingLink;

  const handleSubmit = (e) => {
    e.preventDefault();
    const normalized = normalizeLinkUrl(url);
    if (!normalized) {
      setUrlError('Enter a valid http, https, mailto, or tel link.');
      return;
    }

    const chain = editor.chain().focus();
    if (needsTextInput) {
      const text = linkText.trim() || normalized;
      chain
        .insertContent({
          type: 'text',
          text,
          marks: [{ type: 'link', attrs: { href: normalized } }],
        })
        .run();
    } else {
      // extendMarkRange is a no-op when the selection isn't already inside a
      // link, so this also covers "linkify the current text selection".
      chain.extendMarkRange('link').setLink({ href: normalized }).run();
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Insert link" className="max-w-md">
      <h2 className="text-lg font-bold text-primary mb-4 pr-6">
        {isEditingExistingLink ? 'Edit link' : 'Insert link'}
      </h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {needsTextInput && (
          <Input
            id={textFieldId}
            label="Link text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            placeholder="Text to display"
            autoFocus
          />
        )}
        <div>
          <Input
            id={urlFieldId}
            label="URL"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (urlError) setUrlError('');
            }}
            error={urlError}
            placeholder="https://example.com, name@example.com, or a phone number"
            autoFocus={!needsTextInput}
          />
          {!urlError && <p className="field-hint">Accepted: http, https, mailto, tel.</p>}
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm">
            {isEditingExistingLink ? 'Update link' : 'Insert link'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
