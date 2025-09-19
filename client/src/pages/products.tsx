import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Plus, Search, Edit, Trash2, AlertTriangle } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Products() {
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
              <h2 className="text-2xl font-bold text-foreground">Gestión de Productos</h2>
              <p className="text-muted-foreground">Administra tu inventario y control de stock</p>
            </div>
            <Button className="flex items-center space-x-2" data-testid="button-new-product">
              <Plus className="h-4 w-4" />
              <span>Nuevo Producto</span>
            </Button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Búsqueda y Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar productos por nombre o código..." 
                    className="pl-10"
                    data-testid="input-search-products"
                  />
                </div>
                <Button variant="outline" data-testid="button-filter">
                  Filtros
                </Button>
                <Button variant="outline" data-testid="button-import">
                  Importar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Alertas de Stock */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                <span>Productos con Stock Bajo</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center py-4 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Cargando alertas de stock...</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Productos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Todos los Productos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay productos registrados aún.</p>
                  <p className="text-sm">Comienza agregando tu primer producto.</p>
                  <Button className="mt-4" data-testid="button-add-first-product">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Producto
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
