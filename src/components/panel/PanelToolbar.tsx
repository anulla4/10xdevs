import { useState, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";
import type { ObservationListFilters } from "./types";

type PanelToolbarProps = {
  value: ObservationListFilters;
  onChange: (filters: ObservationListFilters) => void;
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

export function PanelToolbar({ value, onChange }: PanelToolbarProps) {
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
            className="rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          className="rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
      </div>
    </div>
  );
}
