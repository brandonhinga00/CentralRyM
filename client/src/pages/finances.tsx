import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  FileText, 
  Plus,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Finances() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

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

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  const formattedDate = format(new Date(selectedDate), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="border-b bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Finanzas y Reportes</h2>
              <p className="text-muted-foreground">Flujo de caja y análisis financiero</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                  data-testid="input-finance-date"
                />
              </div>
              <Button className="flex items-center space-x-2" data-testid="button-close-cash">
                <Calculator className="h-4 w-4" />
                <span>Cerrar Caja</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Resumen Financiero del Día */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ingresos del Día</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-daily-income">$0</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Gastos del Día</p>
                    <p className="text-2xl font-bold text-red-600" data-testid="text-daily-expenses">$0</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Fiado Otorgado</p>
                    <p className="text-2xl font-bold text-orange-600" data-testid="text-credit-given">$0</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Balance Neto</p>
                    <p className="text-2xl font-bold text-blue-600" data-testid="text-net-balance">$0</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cierre de Caja */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Cierre de Caja - {formattedDate}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-green-600">Ingresos</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ventas en Efectivo:</span>
                      <span className="font-medium" data-testid="text-cash-sales">$0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ventas por Transferencia:</span>
                      <span className="font-medium" data-testid="text-transfer-sales">$0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deudas Cobradas:</span>
                      <span className="font-medium" data-testid="text-collected-debts">$0</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold text-green-600">
                        <span>Total Ingresos:</span>
                        <span data-testid="text-total-income">$0</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-red-600">Egresos</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gastos Generales:</span>
                      <span className="font-medium" data-testid="text-general-expenses">$0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pago a Proveedores:</span>
                      <span className="font-medium" data-testid="text-supplier-payments">$0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Otros Gastos:</span>
                      <span className="font-medium" data-testid="text-other-expenses">$0</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold text-red-600">
                        <span>Total Egresos:</span>
                        <span data-testid="text-total-expenses">$0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Balance Final del Día:</span>
                  <span className="text-2xl font-bold text-blue-600" data-testid="text-final-balance">$0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gastos del Día */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-5 w-5" />
                  <span>Gastos del Día</span>
                </div>
                <Button size="sm" className="flex items-center space-x-2" data-testid="button-new-expense">
                  <Plus className="h-4 w-4" />
                  <span>Nuevo Gasto</span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay gastos registrados para esta fecha.</p>
                <p className="text-sm">Utiliza el botón superior para agregar gastos.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
