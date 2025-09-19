import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Search, QrCode } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function DailyEntry() {
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
              <h2 className="text-2xl font-bold text-foreground">Carga Diaria</h2>
              <p className="text-muted-foreground capitalize">{formattedDate}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                  data-testid="input-date"
                />
              </div>
              <Button className="flex items-center space-x-2" data-testid="button-bulk-entry">
                <Plus className="h-4 w-4" />
                <span>Carga Masiva</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Formulario de Carga Rápida */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Nueva Venta</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product">Producto</Label>
                    <div className="relative">
                      <Input 
                        id="product"
                        placeholder="Buscar producto..." 
                        className="pr-10"
                        data-testid="input-product"
                      />
                      <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input 
                      id="quantity"
                      type="number" 
                      placeholder="1" 
                      min="1"
                      data-testid="input-quantity"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment-method">Método de Pago</Label>
                    <Select>
                      <SelectTrigger data-testid="select-payment-method">
                        <SelectValue placeholder="Seleccionar método" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="fiado">Fiado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="customer">Cliente (si es fiado)</Label>
                    <div className="relative">
                      <Input 
                        id="customer"
                        placeholder="Nombre del cliente..." 
                        className="pr-10"
                        data-testid="input-customer"
                      />
                      <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    type="submit" 
                    className="flex-1 flex items-center justify-center space-x-2"
                    data-testid="button-register-sale"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Registrar Venta</span>
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="px-6 flex items-center space-x-2"
                    data-testid="button-scan-barcode"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>Escanear</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Lista de Ventas del Día */}
          <Card>
            <CardHeader>
              <CardTitle>Ventas del Día Seleccionado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay ventas registradas para esta fecha.</p>
                  <p className="text-sm">Utiliza el formulario superior para agregar ventas.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
