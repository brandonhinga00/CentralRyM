import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import SalesSummary from "@/components/dashboard/sales-summary";
import StockAlerts from "@/components/dashboard/stock-alerts";
import DailySales from "@/components/dashboard/daily-sales";
import TopDebtors from "@/components/dashboard/top-debtors";
import AiSummary from "@/components/dashboard/ai-summary";
import ApiStatus from "@/components/dashboard/api-status";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => {
    // Always start with today's date
    return format(new Date(), 'yyyy-MM-dd');
  });


  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "No autorizado",
        description: "Debes iniciar sesión para acceder al sistema.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header />
        
        <div className="p-6 space-y-6">
          {/* Date Selector */}
          <div className="flex items-center justify-between bg-card rounded-lg p-4 border">
            <div>
              <h2 className="text-lg font-semibold">Panel Principal</h2>
              <p className="text-muted-foreground">Gestiona tu negocio desde aquí</p>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="date-selector" className="flex items-center space-x-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                <span>Fecha:</span>
              </Label>
              <Input
                id="date-selector"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
                data-testid="input-dashboard-date"
              />
            </div>
          </div>
          
          {/* Resumen del Día */}
          <SalesSummary date={selectedDate} />
          
          {/* Alertas de Stock */}
          <StockAlerts />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ventas del Día */}
            <DailySales date={selectedDate} />
            
            {/* Deudores Principales */}
            <TopDebtors />
          </div>
          
          {/* Resumen Inteligente con IA */}
          <AiSummary date={selectedDate} />
          
          {/* Estado de la API y Conexión Móvil */}
          <ApiStatus date={selectedDate} />
        </div>
      </main>
    </div>
  );
}
