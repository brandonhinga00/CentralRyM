import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import SalesSummary from "@/components/dashboard/sales-summary";
import QuickSaleForm from "@/components/dashboard/quick-sale-form";
import StockAlerts from "@/components/dashboard/stock-alerts";
import DailySales from "@/components/dashboard/daily-sales";
import TopDebtors from "@/components/dashboard/top-debtors";
import AiSummary from "@/components/dashboard/ai-summary";
import ApiStatus from "@/components/dashboard/api-status";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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
          {/* Resumen del Día */}
          <SalesSummary />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Carga Rápida */}
            <div className="lg:col-span-2">
              <QuickSaleForm />
            </div>
            
            {/* Alertas de Stock */}
            <StockAlerts />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ventas del Día */}
            <DailySales />
            
            {/* Deudores Principales */}
            <TopDebtors />
          </div>
          
          {/* Resumen Inteligente con IA */}
          <AiSummary />
          
          {/* Estado de la API y Conexión Móvil */}
          <ApiStatus />
        </div>
      </main>
    </div>
  );
}
