import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, Plus, Search, Phone, Mail, MapPin } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Suppliers() {
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
              <h2 className="text-2xl font-bold text-foreground">Gestión de Proveedores</h2>
              <p className="text-muted-foreground">Administra contactos y pedidos</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="flex items-center space-x-2" data-testid="button-generate-orders">
                <Truck className="h-4 w-4" />
                <span>Generar Lista de Compras</span>
              </Button>
              <Button className="flex items-center space-x-2" data-testid="button-new-supplier">
                <Plus className="h-4 w-4" />
                <span>Nuevo Proveedor</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Búsqueda */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar proveedores por nombre o contacto..." 
                  className="pl-10"
                  data-testid="input-search-suppliers"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista Sugerida de Compras */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-600">
                <Truck className="h-5 w-5" />
                <span>Lista Sugerida de Compras</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay productos que necesiten reposición.</p>
                  <p className="text-sm">Las sugerencias aparecerán basadas en el stock bajo.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Directorio de Proveedores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Directorio de Proveedores</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay proveedores registrados aún.</p>
                  <p className="text-sm">Comienza agregando tu primer proveedor.</p>
                  <Button className="mt-4" data-testid="button-add-first-supplier">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Proveedor
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
