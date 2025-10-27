import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { useCreateObservation, useUpdateObservation } from '../hooks/useObservations';
import type { ObservationVM } from './types';
import type { ObservationCreateCommand, ObservationUpdateCommand } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface ObservationFormModalProps {
  mode: 'create' | 'edit';
  initial?: ObservationVM;
  prefillLocation?: { lat: number; lng: number };
  onSuccess: () => void;
  onClose: () => void;
  onError?: (message: string) => void;
}

interface FormData {
  name: string;
  description: string;
  category_id: string;
  observation_date: string;
  location_lat: string;
  location_lng: string;
  location_source: string;
  location_accuracy: string;
  is_favorite: boolean;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

export function ObservationFormModal({
  mode,
  initial,
  prefillLocation,
  onSuccess,
  onClose,
  onError,
}: ObservationFormModalProps) {
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const createMutation = useCreateObservation();
  const updateMutation = useUpdateObservation();

  const [formData, setFormData] = useState<FormData>(() => {
    if (mode === 'edit' && initial) {
      return {
        name: initial.name,
        description: initial.description || '',
        category_id: initial.category_id,
        observation_date: initial.observation_date.slice(0, 16), // Format for datetime-local
        location_lat: String(initial.location.lat),
        location_lng: String(initial.location.lng),
        location_source: initial.location_source || 'manual',
        location_accuracy: initial.location_accuracy ? String(initial.location_accuracy) : '',
        is_favorite: initial.is_favorite,
      };
    }

    return {
      name: '',
      description: '',
      category_id: '',
      observation_date: new Date().toISOString().slice(0, 16),
      location_lat: prefillLocation ? String(prefillLocation.lat) : '',
      location_lng: prefillLocation ? String(prefillLocation.lng) : '',
      location_source: 'manual',
      location_accuracy: '',
      is_favorite: false,
    };
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nazwa jest wymagana';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Nazwa nie może być dłuższa niż 100 znaków';
    }

    if (formData.description.length > 500) {
      newErrors.description = 'Opis nie może być dłuższy niż 500 znaków';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Kategoria jest wymagana';
    }

    const lat = parseFloat(formData.location_lat);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.location_lat = 'Szerokość geograficzna musi być w zakresie -90 do 90';
    }

    const lng = parseFloat(formData.location_lng);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      newErrors.location_lng = 'Długość geograficzna musi być w zakresie -180 do 180';
    }

    if (formData.location_accuracy) {
      const accuracy = parseFloat(formData.location_accuracy);
      if (isNaN(accuracy) || accuracy < 0 || accuracy > 999.99) {
        newErrors.location_accuracy = 'Dokładność musi być w zakresie 0 do 999.99';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const command: ObservationCreateCommand = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      category_id: formData.category_id,
      observation_date: new Date(formData.observation_date).toISOString(),
      location: {
        lat: parseFloat(formData.location_lat),
        lng: parseFloat(formData.location_lng),
      },
      location_source: formData.location_source || null,
      location_accuracy: formData.location_accuracy ? parseFloat(formData.location_accuracy) : null,
      is_favorite: formData.is_favorite,
    };

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(command);
      } else if (initial) {
        const updateCommand: ObservationUpdateCommand = command;
        await updateMutation.mutateAsync({ id: initial.id, data: updateCommand });
      }
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udało się zapisać obserwacji';
      if (onError) {
        onError(message);
      }
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose} data-test-id="observation-form-dialog">
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-test-id="observation-form-content">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Dodaj obserwację' : 'Edytuj obserwację'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" data-test-id="observation-form">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nazwa <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={100}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
              data-test-id="field-name"
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Opis</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={500}
              rows={3}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'description-error' : undefined}
              data-test-id="field-description"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{errors.description && <span className="text-destructive">{errors.description}</span>}</span>
              <span>{formData.description.length}/500</span>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category_id">
              Kategoria <span className="text-destructive">*</span>
            </Label>
            <select
              id="category_id"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="h-10 w-full rounded-md border border-input bg-white pl-3 pr-10 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M10.293%203.293L6%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_0.75rem_center] bg-no-repeat"
              disabled={categoriesLoading}
              aria-invalid={!!errors.category_id}
              data-test-id="field-category"
            >
              <option value="">{categoriesLoading ? 'Ładowanie...' : 'Wybierz kategorię'}</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name.toLowerCase()}
                </option>
              ))}
            </select>
            {categoriesError && (
              <p className="text-sm text-destructive">
                Błąd ładowania kategorii: {categoriesError instanceof Error ? categoriesError.message : 'Nieznany błąd'}
              </p>
            )}
            {errors.category_id && (
              <p id="category-error" className="text-sm text-destructive">
                {errors.category_id}
              </p>
            )}
          </div>

          {/* Observation Date */}
          <div className="space-y-2">
            <Label htmlFor="observation_date">
              Data obserwacji <span className="text-destructive">*</span>
            </Label>
            <Input
              type="datetime-local"
              id="observation_date"
              value={formData.observation_date}
              onChange={(e) => setFormData({ ...formData, observation_date: e.target.value })}
              data-test-id="field-observation-date"
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location_lat">
                Szerokość <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                id="location_lat"
                value={formData.location_lat}
                onChange={(e) => setFormData({ ...formData, location_lat: e.target.value })}
                step="0.000001"
                aria-invalid={!!errors.location_lat}
                data-test-id="field-location-lat"
              />
              {errors.location_lat && <p className="text-sm text-destructive">{errors.location_lat}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_lng">
                Długość <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                id="location_lng"
                value={formData.location_lng}
                onChange={(e) => setFormData({ ...formData, location_lng: e.target.value })}
                step="0.000001"
                aria-invalid={!!errors.location_lng}
                data-test-id="field-location-lng"
              />
              {errors.location_lng && <p className="text-sm text-destructive">{errors.location_lng}</p>}
            </div>
          </div>

          {/* Location Source */}
          <div className="space-y-2">
            <Label htmlFor="location_source">Źródło lokalizacji</Label>
            <select
              id="location_source"
              value={formData.location_source}
              onChange={(e) => setFormData({ ...formData, location_source: e.target.value })}
              className="h-10 w-full rounded-md border border-input bg-white pl-3 pr-10 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M10.293%203.293L6%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_0.75rem_center] bg-no-repeat"
              data-test-id="field-location-source"
            >
              <option value="manual">ręczne</option>
              <option value="gps">gps</option>
            </select>
          </div>

          {/* Favorite */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_favorite"
              checked={formData.is_favorite}
              onCheckedChange={(checked) => setFormData({ ...formData, is_favorite: checked as boolean })}
              data-test-id="field-is-favorite"
            />
            <Label htmlFor="is_favorite" className="cursor-pointer">
              Dodaj do ulubionych
            </Label>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            data-test-id="btn-cancel-observation"
          >
            Anuluj
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting} data-test-id="btn-save-observation">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Dodaj' : 'Zapisz'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
