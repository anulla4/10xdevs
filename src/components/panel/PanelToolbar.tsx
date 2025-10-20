import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, Plus } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";
import type { ObservationListFilters } from "./types";

type PanelToolbarProps = {
  value: ObservationListFilters;
  onChange: (filters: ObservationListFilters) => void;
  onAddObservation?: () => void;
};

const SORT_OPTIONS = [
  { value: "observation_date", label: "Data obserwacji" },
  { value: "name", label: "Nazwa" },
  { value: "created_at", label: "Data utworzenia" },
] as const;

const ORDER_OPTIONS = [
  { value: "asc", label: "Rosnąco" },
  { value: "desc", label: "Malejąco" },
] as const;

export function PanelToolbar({ value, onChange, onAddObservation }: PanelToolbarProps) {
  const [searchInput, setSearchInput] = useState(value.q || "");
  const debouncedSearch = useDebounce(searchInput, 300);

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== value.q) {
      onChange({
        ...value,
        q: debouncedSearch || undefined,
        page: 1, // Reset to first page on search
      });
    }
  }, [debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.slice(0, 200); // Max 200 characters
    setSearchInput(newValue);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value as ObservationListFilters["sort"];
    onChange({
      ...value,
      sort: newSort,
      page: 1,
    });
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOrder = e.target.value as ObservationListFilters["order"];
    onChange({
      ...value,
      order: newOrder,
      page: 1,
    });
  };

  const handleFavoriteToggle = () => {
    onChange({
      ...value,
      favorite: value.favorite === true ? undefined : true,
      page: 1,
    });
  };

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Szukaj obserwacji..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Szukaj obserwacji"
            maxLength={200}
          />
        </div>

        {/* Sort select */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-400" aria-hidden="true" />
          <select
            value={value.sort}
            onChange={handleSortChange}
            className="rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M10.293%203.293L6%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_0.75rem_center] bg-no-repeat"
            aria-label="Sortuj według"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Order select */}
        <select
          value={value.order}
          onChange={handleOrderChange}
          className="rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M10.293%203.293L6%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_0.75rem_center] bg-no-repeat"
          aria-label="Kolejność sortowania"
        >
          {ORDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Favorite toggle */}
        <button
          onClick={handleFavoriteToggle}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            value.favorite
              ? 'border-yellow-500 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
          aria-pressed={value.favorite === true}
          aria-label="Pokaż tylko ulubione"
        >
          ⭐ Ulubione
        </button>

        {/* Add observation button */}
        {onAddObservation && (
          <button
            onClick={onAddObservation}
            className="ml-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
            aria-label="Dodaj obserwację"
          >
            <Plus className="h-4 w-4" />
            Dodaj obserwację
          </button>
        )}
      </div>
    </div>
  );
}
