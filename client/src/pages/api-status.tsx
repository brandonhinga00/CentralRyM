import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Waypoints, 
  Plus, 
  Key, 
  Smartphone, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Trash2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function ApiStatus() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);

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

  // Get API keys
  const { data: apiKeys, isLoading: isLoadingKeys } = useQuery({
    queryKey: ['/api/api-keys'],
    enabled: isAuthenticated,
    retry: false,
  });

  // Create API key mutation
  const createKeyMutation = useMutation({
    mutationFn: async (data: { keyName: string; permissions: string[] }) => {
      return await apiRequest("POST", "/api/api-keys", data);
    },
    onSuccess: (data) => {
      toast({
        title: "Clave API creada",
        description: "La clave API se creó exitosamente. Cópiala ahora, no se mostrará nuevamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
      setIsDialogOpen(false);
      setKeyName("");
      setPermissions([]);
      
      // Show the generated key
      if ((data as any).plainKey) {
        navigator.clipboard.writeText((data as any).plainKey);
        toast({
          title: "Clave copiada",
          description: "La clave API se copió al portapapeles.",
        });
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Tu sesión ha expirado. Redirigiendo...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "No se pudo crear la clave API.",
        variant: "destructive",
      });
    },
  });

  // Delete API key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/api-keys/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Clave eliminada",
        description: "La clave API se eliminó exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Tu sesión ha expirado. Redirigiendo...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "No se pudo eliminar la clave API.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la clave es requerido.",
        variant: "destructive",
      });
      return;
    }
    createKeyMutation.mutate({ keyName, permissions });
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setPermissions([...permissions, permission]);
    } else {
      setPermissions(permissions.filter(p => p !== permission));
    }
  };

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
              <h2 className="text-2xl font-bold text-foreground">API y Asistente Móvil</h2>
              <p className="text-muted-foreground">Gestiona las claves de acceso para el asistente móvil</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2" data-testid="button-new-api-key">
                  <Plus className="h-4 w-4" />
                  <span>Nueva Clave API</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Clave API</DialogTitle>
                  <DialogDescription>
                    Crea una nueva clave API para el asistente móvil. Define los permisos específicos que tendrá esta clave.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="key-name">Nombre de la Clave</Label>
                    <Input
                      id="key-name"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      placeholder="Ej: Asistente Móvil Principal"
                      data-testid="input-key-name"
                    />
                  </div>
                  
                  <div>
                    <Label>Permisos</Label>
                    <div className="space-y-2 mt-2">
                      {[
                        { id: 'read_stock', label: 'Consultar Stock' },
                        { id: 'read_customers', label: 'Consultar Clientes y Deudas' },
                        { id: 'create_sale', label: 'Registrar Ventas' },
                        { id: 'create_payment', label: 'Registrar Pagos' },
                        { id: 'update_stock', label: 'Actualizar Stock' },
                        { id: 'read_reports', label: 'Ver Reportes Simples' },
                      ].map((permission) => (
                        <label key={permission.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={permissions.includes(permission.id)}
                            onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">{permission.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={createKeyMutation.isPending}
                      data-testid="button-create-key"
                    >
                      {createKeyMutation.isPending ? "Creando..." : "Crear Clave"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      data-testid="button-cancel"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Estado de la API */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Waypoints className="h-5 w-5 text-primary" />
                <span>Estado de la API</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">API Activa</span>
                  </div>
                  <p className="text-sm text-green-600">Funcionando correctamente</p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Endpoint Base</span>
                  </div>
                  <p className="text-sm text-blue-600 font-mono">/api/mobile/</p>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Key className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-800">Claves Activas</span>
                  </div>
                  <p className="text-lg font-bold text-purple-800">
                    {(apiKeys as any[])?.filter((key: any) => key.isActive).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Claves API */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>Claves API</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingKeys ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="p-4 border border-border rounded-lg animate-pulse">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : apiKeys && (apiKeys as any[]).length > 0 ? (
                <div className="space-y-3">
                  {(apiKeys as any[]).map((key: any) => (
                    <div key={key.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium">{key.keyName}</h4>
                            <Badge variant={key.isActive ? "default" : "secondary"}>
                              {key.isActive ? "Activa" : "Inactiva"}
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">
                              Creada: {new Date(key.createdAt).toLocaleDateString('es-AR')}
                            </p>
                            {key.lastUsed && (
                              <p className="text-sm text-muted-foreground">
                                Último uso: {new Date(key.lastUsed).toLocaleDateString('es-AR')}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {key.permissions?.map((permission: string) => (
                                <Badge key={permission} variant="outline" className="text-xs">
                                  {permission.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteKeyMutation.mutate(key.id)}
                            disabled={deleteKeyMutation.isPending}
                            data-testid={`button-delete-${key.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay claves API configuradas.</p>
                  <p className="text-sm">Crea una clave para comenzar a usar el asistente móvil.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documentación de Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Waypoints className="h-5 w-5" />
                <span>Endpoints Disponibles</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 border border-border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-sm">/api/mobile/products/stock</code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Consultar stock de producto por código de barras o nombre
                  </p>
                </div>

                <div className="p-3 border border-border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-sm">/api/mobile/customers/debt</code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Consultar deuda de un cliente específico
                  </p>
                </div>

                <div className="p-3 border border-border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline">POST</Badge>
                    <code className="text-sm">/api/mobile/sales</code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Registrar una nueva venta (efectivo, transferencia o fiado)
                  </p>
                </div>

                <div className="p-3 border border-border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline">POST</Badge>
                    <code className="text-sm">/api/mobile/payments</code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Registrar un pago de cuenta corriente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
