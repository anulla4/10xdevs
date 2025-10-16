import { Star, MapPin, Calendar, Edit2, Trash2 } from "lucide-react";
import type { ObservationListItemVM } from "./types";

type ObservationListItemProps = {
  item: ObservationListItemVM;
  selected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function ObservationListItem({ item, selected, onClick, onEdit, onDelete }: ObservationListItemProps) {
  return (
    <div
      onClick={onClick}
      className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 cursor-pointer ${selected ? "bg-blue-50 hover:bg-blue-100" : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Name and favorite */}
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-medium text-gray-900">{item.name}</h3>
            {item.isFavorite && (
              <Star className="h-4 w-4 flex-shrink-0 fill-yellow-400 text-yellow-400" aria-label="Ulubione" />
            )}
          </div>

          {/* Category badge */}
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium lowercase"
              style={{
                backgroundColor: `${item.categoryBadge.color}20`,
                color: item.categoryBadge.color,
              }}
            >
              <span>{item.categoryBadge.name}</span>
            </span>
          </div>

          {/* Date and location */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{item.dateLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="truncate">{item.locationLabel}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="flex flex-shrink-0 items-center gap-1">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                aria-label="Edytuj obserwację"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                aria-label="Usuń obserwację"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            {selected && <div className="ml-2 h-2 w-2 rounded-full bg-blue-600" aria-hidden="true" />}
          </div>
        )}

        {/* Selected indicator (when no actions) */}
        {!onEdit && !onDelete && selected && (
          <div className="flex-shrink-0">
            <div className="h-2 w-2 rounded-full bg-blue-600" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}
