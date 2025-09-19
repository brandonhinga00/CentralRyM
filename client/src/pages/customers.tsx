import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, CreditCard, DollarSign, Phone } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Customers() {
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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="border-b bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Gestión de Clientes</h2>
              <p className="text-muted-foreground">Administra cuentas corrientes y fiados</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="flex items-center space-x-2" data-testid="button-export-accounts">
                <CreditCard className="h-4 w-4" />
                <span>Exportar Cuentas</span>
              </Button>
              <Button className="flex items-center space-x-2" data-testid="button-new-customer">
                <Plus className="h-4 w-4" />
                <span>Nuevo Cliente</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Resumen de Deudas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Deudas</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-debt">$0</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Clientes con Deuda</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-debtors-count">0</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Clientes</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-customers">0</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Búsqueda */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar clientes por nombre, teléfono o documento..." 
                    className="pl-10"
                    data-testid="input-search-customers"
                  />
                </div>
                <Button variant="outline" data-testid="button-filter-debtors">
                  Solo Deudores
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Deudores Principales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <CreditCard className="h-5 w-5" />
                <span>Principales Deudores</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay deudores registrados.</p>
                  <p className="text-sm">Los clientes con fiados aparecerán aquí.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Todos los Clientes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Todos los Clientes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay clientes registrados aún.</p>
                  <p className="text-sm">Comienza agregando tu primer cliente.</p>
                  <Button className="mt-4" data-testid="button-add-first-customer">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Cliente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
