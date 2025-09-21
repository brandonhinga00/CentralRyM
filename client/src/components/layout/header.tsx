import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title = "Panel Principal", subtitle }: HeaderProps) {
  const currentDate = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <header className="bg-card border-b border-border p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground capitalize">
            {subtitle || currentDate}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Estado de la API */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm font-medium">API Activa</span>
          </div>
        </div>
      </div>
    </header>
  );
}
