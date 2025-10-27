import { useObservations } from '../hooks/useObservations';
import { ObservationListItem } from './ObservationListItem';
import { mapObservationToListItem } from './types';
import type { ObservationListFilters } from './types';
import { Loader2, AlertCircle } from 'lucide-react';

interface ObservationListProps {
  filters: ObservationListFilters;
  selectedObservationId: string | null;
  onSelect: (id: string | null) => void;
  onPageChange: (page: number) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
}

export function ObservationList({
  filters,
  selectedObservationId,
  onSelect,
  onPageChange,
  onEdit,
  onDelete,
}: ObservationListProps) {
  const { data, isLoading, isError, error } = useObservations(filters);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-600">Ładowanie obserwacji...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
          <p className="mt-2 text-sm font-medium text-gray-900">Błąd ładowania danych</p>
          <p className="mt-1 text-sm text-gray-600">{error instanceof Error ? error.message : 'Nieznany błąd'}</p>
        </div>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">Brak obserwacji</p>
          <p className="mt-1 text-sm text-gray-600">
            {filters.q
              ? 'Nie znaleziono obserwacji spełniających kryteria wyszukiwania'
              : 'Dodaj swoją pierwszą obserwację'}
          </p>
        </div>
      </div>
    );
  }

  const { items, meta } = data;
  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="flex h-full flex-col">
      {/* Results count */}
      <div className="border-b border-gray-200 px-4 py-2 text-sm text-gray-600">
        Znaleziono: <span className="font-medium text-gray-900">{meta.total}</span> obserwacji
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {items.map((observation) => {
            const vm = mapObservationToListItem(observation);
            return (
              <ObservationListItem
                key={vm.id}
                item={vm}
                selected={vm.id === selectedObservationId}
                onClick={() => onSelect(vm.id)}
                onEdit={onEdit ? () => onEdit(vm.id) : undefined}
                onDelete={onDelete ? () => onDelete(vm.id, vm.name) : undefined}
              />
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Strona {meta.page} z {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(meta.page - 1)}
                disabled={meta.page === 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Poprzednia strona"
              >
                Poprzednia
              </button>
              <button
                onClick={() => onPageChange(meta.page + 1)}
                disabled={meta.page === totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Następna strona"
              >
                Następna
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
