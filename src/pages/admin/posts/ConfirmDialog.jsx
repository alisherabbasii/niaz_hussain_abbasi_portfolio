import { AlertTriangle } from 'lucide-react';
import { Modal, Button } from '../../../components/ui';

/** Generic confirm/cancel dialog built on Modal — used for destructive row actions (Delete). */
const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  danger = false,
  busy = false,
}) => (
  <Modal open={open} onClose={onClose} title={title} className="max-w-md">
    <div className="flex items-start gap-4">
      {danger && (
        <div className="w-10 h-10 rounded-xl bg-danger/10 text-rose-600 flex items-center justify-center shrink-0">
          <AlertTriangle size={18} aria-hidden="true" />
        </div>
      )}
      <div>
        <h2 className="text-lg font-bold text-primary mb-1.5 pr-6">{title}</h2>
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>

    <div className="mt-7 flex justify-end gap-3">
      <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
        Cancel
      </Button>
      <Button
        size="sm"
        onClick={onConfirm}
        disabled={busy}
        className={danger ? '!bg-danger hover:!bg-rose-600 focus-visible:!ring-danger/30' : undefined}
      >
        {busy ? 'Please wait…' : confirmLabel}
      </Button>
    </div>
  </Modal>
);

export default ConfirmDialog;
