import { useState, useEffect } from 'react';
import { QueryProvider } from '../providers/QueryProvider';
import { PanelContent } from './PanelContent';
import { PanelToolbar } from './PanelToolbar';
import { ObservationFormModal } from './ObservationFormModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { Toaster } from '../ui/sonner';
import { useObservations } from '../hooks/useObservations';
import { useToast } from '../hooks/useToast';
import { mapObservationToVM } from './types';
import type { ObservationListFilters } from './types';

interface PanelPageProps {
  userId: string;
}

export function PanelPage({ userId }: PanelPageProps) {
  return (
    <QueryProvider>
      <PanelPageContent userId={userId} />
    </QueryProvider>
  );
}

function PanelPageContent({ userId }: PanelPageProps) {
  const toast = useToast();
  const [selectedObservationId, setSelectedObservationId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<
    { type: 'none' } | { type: 'create' } | { type: 'edit'; id: string } | { type: 'delete'; id: string; name: string }
  >({ type: 'none' });

  const [filters, setFilters] = useState<ObservationListFilters>(() => {
    // Read initial filters from URL
    if (typeof window === 'undefined') {
      return getDefaultFilters();
    }

    const params = new URLSearchParams(window.location.search);
    return {
      page: parseInt(params.get('page') || '1', 10),
      limit: parseInt(params.get('limit') || '20', 10),
      q: params.get('q') || undefined,
      sort: (params.get('sort') as any) || 'observation_date',
      order: (params.get('order') as any) || 'desc',
      category_id: params.get('category_id') || undefined,
      favorite: params.get('favorite') === 'true' ? true : undefined,
    };
  });

  // Sync filters to URL
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();
    params.set('page', String(filters.page));
    params.set('limit', String(filters.limit));
    if (filters.q) params.set('q', filters.q);
    params.set('sort', filters.sort);
    params.set('order', filters.order);
    if (filters.category_id) params.set('category_id', filters.category_id);
    if (filters.favorite !== undefined) params.set('favorite', String(filters.favorite));

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [filters]);

  const handleFiltersChange = (newFilters: ObservationListFilters) => {
    setFilters(newFilters);
  };

  const handleEdit = (id: string) => {
    setModalState({ type: 'edit', id });
  };

  const handleDelete = (id: string, name: string) => {
    setModalState({ type: 'delete', id, name });
  };

  const handleCloseModal = () => {
    setModalState({ type: 'none' });
    setPrefillLocation(undefined);
  };

  const handleModalSuccess = () => {
    setModalState({ type: 'none' });
    setPrefillLocation(undefined);
    if (modalState.type === 'create') {
      toast.success('Obserwacja została dodana');
    } else if (modalState.type === 'edit') {
      toast.success('Obserwacja została zaktualizowana');
    } else if (modalState.type === 'delete') {
      toast.success('Obserwacja została usunięta');
    }
  };

  // Get observation data for edit modal
  const { data: observationsData } = useObservations(filters);
  const editObservation =
    modalState.type === 'edit' ? observationsData?.items.find((obs) => obs.id === modalState.id) : undefined;

  const handleAddObservation = () => {
    setModalState({ type: 'create' });
  };

  const handleMapClick = (lat: number, lng: number) => {
    setModalState({ type: 'create' });
    // Store location for prefill - we'll pass it to modal
    setPrefillLocation({ lat, lng });
  };

  const [prefillLocation, setPrefillLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1920px]">
        <PanelToolbar value={filters} onChange={handleFiltersChange} onAddObservation={handleAddObservation} />
        <PanelContent
          filters={filters}
          selectedObservationId={selectedObservationId}
          onSelectObservation={setSelectedObservationId}
          onFiltersChange={handleFiltersChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onMapClick={handleMapClick}
        />
      </div>

      {/* Modals */}
      {modalState.type === 'create' && (
        <ObservationFormModal
          mode="create"
          prefillLocation={prefillLocation}
          onSuccess={handleModalSuccess}
          onClose={handleCloseModal}
          onError={(msg) => toast.error(msg)}
        />
      )}

      {modalState.type === 'edit' && editObservation && (
        <ObservationFormModal
          mode="edit"
          initial={mapObservationToVM(editObservation)}
          onSuccess={handleModalSuccess}
          onClose={handleCloseModal}
          onError={(msg) => toast.error(msg)}
        />
      )}

      {modalState.type === 'delete' && (
        <ConfirmDeleteModal
          observationId={modalState.id}
          observationName={modalState.name}
          onConfirm={handleModalSuccess}
          onCancel={handleCloseModal}
        />
      )}

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

function getDefaultFilters(): ObservationListFilters {
  return {
    page: 1,
    limit: 20,
    sort: 'observation_date',
    order: 'desc',
  };
}
