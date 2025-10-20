import { Button } from "@/components/ui/button";
import { Leaf, MapPin, Camera, Heart } from "lucide-react";

export function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <div className="mb-6 flex justify-center">
            <span className="text-8xl">🌿</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Nature Log
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
            Twoje obserwacje przyrody w jednym miejscu
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-12">
            Dokumentuj spotkania z przyrodą, zapisuj lokalizacje i twórz własną kolekcję obserwacji roślin, zwierząt i miejsc.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="/auth/register" className="text-lg px-8">
                Rozpocznij za darmo
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/auth/login" className="text-lg px-8">
                Zaloguj się
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
              <Leaf className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Kataloguj obserwacje
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Zapisuj szczegóły swoich spotkań z przyrodą - rośliny, zwierzęta i miejsca.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Mapa lokalizacji
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Zobacz wszystkie swoje obserwacje na interaktywnej mapie.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <Camera className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Dodawaj opisy
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Zapisuj szczegółowe notatki i opisy swoich odkryć.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-4">
              <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Ulubione
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Oznaczaj najciekawsze obserwacje jako ulubione.
            </p>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 md:p-12 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Gotowy na przygodę?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Dołącz do społeczności miłośników przyrody i zacznij dokumentować swoje odkrycia już dziś.
          </p>
          <Button size="lg" asChild>
            <a href="/auth/register" className="text-lg px-8">
              Utwórz darmowe konto
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
