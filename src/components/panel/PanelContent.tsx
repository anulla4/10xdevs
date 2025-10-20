import { useState, useEffect } from "react";
import { ObservationList } from "./ObservationList";
import { ObservationMap } from "./ObservationMap";
import type { ObservationListFilters } from "./types";

type PanelContentProps = {
  filters: ObservationListFilters;
  selectedObservationId: string | null;
  onSelectObservation: (id: string | null) => void;
  onFiltersChange: (filters: ObservationListFilters) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
};

type MobileTab = "list" | "map";

export function PanelContent({
  filters,
  selectedObservationId,
  onSelectObservation,
  onFiltersChange,
  onEdit,
  onDelete,
  onMapClick,
}: PanelContentProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>("list");
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handlePageChange = (page: number) => {
    onFiltersChange({ ...filters, page });
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      {/* Mobile tabs */}
      {isMobile && (
        <div className="border-b border-gray-200 bg-white">
          <div className="flex">
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "list" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
              aria-current={activeTab === "list" ? "page" : undefined}
            >
              Lista
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "map" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
              aria-current={activeTab === "map" ? "page" : undefined}
            >
              Mapa
            </button>
          </div>
        </div>
      )}

      {/* Desktop: two columns, Mobile: single view based on active tab */}
      <div className="h-full lg:grid lg:grid-cols-2 lg:gap-0">
        {/* List column */}
        <div className={`h-full overflow-hidden border-r border-gray-200 bg-white ${isMobile && activeTab !== "list" ? "hidden" : ""}`}>
          <ObservationList
            filters={filters}
            selectedObservationId={selectedObservationId}
            onSelect={onSelectObservation}
            onPageChange={handlePageChange}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>

        {/* Map column */}
        <div className={`h-full overflow-hidden bg-gray-100 ${isMobile && activeTab !== "map" ? "hidden" : ""}`}>
          <ObservationMap
            filters={filters}
            selectedObservationId={selectedObservationId}
            onMarkerSelect={onSelectObservation}
            onMapClick={onMapClick}
          />
        </div>
      </div>
    </div>
  );
}
