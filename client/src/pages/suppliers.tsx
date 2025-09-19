import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Truck, Plus, Search, Phone, Mail, MapPin, Edit2, Trash2, User, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSupplierSchema } from "@shared/schema";
import { z } from "zod";
import type { Supplier, PurchaseSuggestion } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

type SupplierFormData = z.infer<typeof insertSupplierSchema>;

export default function Suppliers() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form setup
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(insertSupplierSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      notes: ""
    }
  });

  // Queries
  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
    enabled: isAuthenticated
  });

  const { data: purchaseSuggestions = [], isLoading: loadingSuggestions } = useQuery<PurchaseSuggestion[]>({
    queryKey: ['/api/purchase-suggestions'],
    enabled: isAuthenticated
  });

  // Mutations
  const createSupplierMutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      return await apiRequest('/api/suppliers', 'POST', data);
    },
    onSuccess: () => {
      toast({ title: "Proveedor creado", description: "El proveedor se creó correctamente" });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      setIsDialogOpen(false);
      form.reset();
      setEditingSupplier(null);
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "No se pudo crear el proveedor", 
        variant: "destructive" 
      });
      console.error('Error creating supplier:', error);
    }
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SupplierFormData> }) => {
      return await apiRequest(`/api/suppliers/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      toast({ title: "Proveedor actualizado", description: "Los cambios se guardaron correctamente" });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      setIsDialogOpen(false);
      form.reset();
      setEditingSupplier(null);
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "No se pudo actualizar el proveedor", 
        variant: "destructive" 
      });
      console.error('Error updating supplier:', error);
    }
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/suppliers/${id}`, 'DELETE');
    },
    onSuccess: () => {
      toast({ title: "Proveedor eliminado", description: "El proveedor se eliminó correctamente" });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "No se pudo eliminar el proveedor", 
        variant: "destructive" 
      });
      console.error('Error deleting supplier:', error);
    }
  });

  // Event handlers
  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      form.reset({
        name: supplier.name,
        contactPerson: supplier.contactPerson ?? "",
        phone: supplier.phone ?? "",
        email: supplier.email ?? "",
        address: supplier.address ?? "",
        notes: supplier.notes ?? ""
      });
    } else {
      setEditingSupplier(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSupplier(null);
    form.reset();
  };

  const onSubmit = (data: SupplierFormData) => {
    if (editingSupplier) {
      updateSupplierMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createSupplierMutation.mutate(data);
    }
  };

  const handleDeleteSupplier = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
      deleteSupplierMutation.mutate(id);
    }
  };

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter((supplier: Supplier) => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Reset form when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      form.reset();
      setEditingSupplier(null);
    }
  }, [isDialogOpen, form]);

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
              <p className="text-muted-foreground">Administra contactos y pedidos ({suppliers.length} proveedores)</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                className="flex items-center space-x-2" 
                data-testid="button-generate-orders"
                disabled={purchaseSuggestions.length === 0}
              >
                <Truck className="h-4 w-4" />
                <span>Lista de Compras ({purchaseSuggestions.length})</span>
              </Button>
              <Button 
                className="flex items-center space-x-2" 
                data-testid="button-new-supplier"
                onClick={() => handleOpenDialog()}
              >
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                {purchaseSuggestions.length > 0 && (
                  <Badge variant="outline" className="ml-2">{purchaseSuggestions.length} productos</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSuggestions ? (
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                </div>
              ) : purchaseSuggestions.length > 0 ? (
                <div className="space-y-3">
                  {purchaseSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{suggestion.name}</span>
                          <Badge variant={suggestion.priority === 'urgent' ? 'destructive' : 'secondary'}>
                            {suggestion.priority === 'urgent' ? 'Urgente' : 'Normal'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Stock actual: {suggestion.currentStock} | Mínimo: {suggestion.minStock} | Sugerir: {suggestion.suggestedQuantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay productos que necesiten reposición.</p>
                  <p className="text-sm">Las sugerencias aparecerán basadas en el stock bajo.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Directorio de Proveedores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Directorio de Proveedores</span>
                {filteredSuppliers.length > 0 && (
                  <Badge variant="outline" className="ml-2">{filteredSuppliers.length} proveedores</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSuppliers ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="h-4 bg-muted rounded animate-pulse mb-2"></div>
                      <div className="h-3 bg-muted rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : filteredSuppliers.length > 0 ? (
                <div className="space-y-4">
                  {filteredSuppliers.map((supplier) => (
                    <div key={supplier.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{supplier.name}</span>
                          </div>
                          {supplier.contactPerson && (
                            <p className="text-sm text-muted-foreground mb-1">Contacto: {supplier.contactPerson}</p>
                          )}
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            {supplier.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>{supplier.phone}</span>
                              </div>
                            )}
                            {supplier.email && (
                              <div className="flex items-center space-x-1">
                                <Mail className="h-3 w-3" />
                                <span>{supplier.email}</span>
                              </div>
                            )}
                            {supplier.address && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{supplier.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenDialog(supplier)}
                            data-testid={`button-edit-supplier-${supplier.id}`}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteSupplier(supplier.id)}
                            data-testid={`button-delete-supplier-${supplier.id}`}
                            disabled={deleteSupplierMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay proveedores registrados aún.</p>
                  <p className="text-sm">Comienza agregando tu primer proveedor.</p>
                  <Button 
                    className="mt-4" 
                    data-testid="button-add-first-supplier"
                    onClick={() => handleOpenDialog()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Proveedor
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Supplier Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier ? "Actualiza la información del proveedor." : "Agrega un nuevo proveedor al sistema."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Proveedor *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Distribuidora XYZ"
                        data-testid="input-supplier-name"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Persona de Contacto</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Juan González"
                        data-testid="input-contact-person"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: +54 351 123-4567"
                          data-testid="input-supplier-phone"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="Ej: contacto@proveedor.com"
                          data-testid="input-supplier-email"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Av. Colón 123, Córdoba"
                        data-testid="input-supplier-address"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Notas adicionales sobre el proveedor..."
                        data-testid="input-supplier-notes"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseDialog}
                  data-testid="button-cancel-supplier"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
                  data-testid="button-save-supplier"
                >
                  {(createSupplierMutation.isPending || updateSupplierMutation.isPending) ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span>Guardando...</span>
                    </div>
                  ) : (
                    editingSupplier ? "Actualizar Proveedor" : "Crear Proveedor"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
