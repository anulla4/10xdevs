import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useDeleteObservation } from '../hooks/useObservations';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface ConfirmDeleteModalProps {
  observationId: string;
  observationName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({ observationId, observationName, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  const deleteMutation = useDeleteObservation();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    onCancel();
  };

  const handleConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(observationId);
      setOpen(false);
      onConfirm();
    } catch (error) {
      console.error('Failed to delete observation:', error);
    }
  };

  const isDeleting = deleteMutation.isPending;

  return (
    <AlertDialog open={open} onOpenChange={handleClose} data-test-id="delete-dialog">
      <AlertDialogContent data-test-id="delete-dialog-content">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle>Usuń obserwację</AlertDialogTitle>
              <AlertDialogDescription className="mt-2">
                {/* prettier-ignore */}
                Czy na pewno chcesz usunąć obserwację{' '}
                <span className="font-medium text-foreground">&ldquo;{observationName}&rdquo;</span>? Tej operacji nie można cofnąć.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {deleteMutation.isError && (
          <div className="rounded-md bg-destructive/10 p-3">
            <p className="text-sm text-destructive">
              {deleteMutation.error instanceof Error ? deleteMutation.error.message : 'Nie udało się usunąć obserwacji'}
            </p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isDeleting} data-test-id="btn-cancel-delete">
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-test-id="btn-confirm-delete"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Usuń
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
