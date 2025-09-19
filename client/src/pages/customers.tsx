import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Search, CreditCard, DollarSign, Phone, Edit, Trash2, MessageCircle } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

const customerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  documentNumber: z.string().optional(),
  creditLimit: z.string().optional(),
});

const paymentSchema = z.object({
  amount: z.string().min(1, "El monto es requerido"),
  paymentMethod: z.string().min(1, "El método de pago es requerido"),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;
type PaymentFormData = z.infer<typeof paymentSchema>;

export default function Customers() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<any>(null);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [accountCustomer, setAccountCustomer] = useState<any>(null);

  // Load customers
  const { data: customers, isLoading: customersLoading, error: customersError } = useQuery({
    queryKey: ['/api/customers'],
    enabled: isAuthenticated,
  });

  // Load customers with debt for summary
  const { data: customersWithDebt } = useQuery({
    queryKey: ['/api/dashboard/top-debtors'],
    enabled: isAuthenticated,
    retry: false,
  });

  const filteredCustomers = customers ? (customers as any[]).filter((customer: any) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchTerm)) ||
    (customer.documentNumber && customer.documentNumber.includes(searchTerm))
  ) : [];

  const totalCustomers = customers ? (customers as any[]).length : 0;
  const customersWithDebtCount = customersWithDebt ? (customersWithDebt as any[]).length : 0;
  const totalDebt = customersWithDebt ? (customersWithDebt as any[]).reduce((sum: number, customer: any) => sum + Number(customer.currentDebt || 0), 0) : 0;

  // Form handling
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      documentNumber: "",
      creditLimit: "",
    },
  });

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "",
      notes: "",
    },
  });

  // Reset form when editing customer changes
  useEffect(() => {
    if (editingCustomer) {
      form.reset({
        name: editingCustomer.name || "",
        email: editingCustomer.email || "",
        phone: editingCustomer.phone || "",
        address: editingCustomer.address || "",
        documentNumber: editingCustomer.documentNumber || "",
        creditLimit: editingCustomer.creditLimit || "",
      });
    } else {
      form.reset({
        name: "",
        email: "",
        phone: "",
        address: "",
        documentNumber: "",
        creditLimit: "",
      });
    }
  }, [editingCustomer, form]);

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: CustomerFormData) => {
      return await apiRequest("POST", "/api/customers", customerData);
    },
    onSuccess: () => {
      toast({
        title: "Cliente creado",
        description: "El cliente se creó exitosamente.",
      });
      setIsDialogOpen(false);
      setEditingCustomer(null);
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/top-debtors'] });
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
        description: "No se pudo crear el cliente.",
        variant: "destructive",
      });
    },
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CustomerFormData }) => {
      return await apiRequest("PUT", `/api/customers/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Cliente actualizado",
        description: "El cliente se actualizó exitosamente.",
      });
      setIsDialogOpen(false);
      setEditingCustomer(null);
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/top-debtors'] });
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
        description: "No se pudo actualizar el cliente.",
        variant: "destructive",
      });
    },
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Cliente eliminado",
        description: "El cliente se eliminó exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/top-debtors'] });
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
        description: "No se pudo eliminar el cliente.",
        variant: "destructive",
      });
    },
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: PaymentFormData) => {
      const data = {
        ...paymentData,
        customerId: paymentCustomer.id,
        paymentDate: new Date().toISOString().split('T')[0],
      };
      return await apiRequest("POST", "/api/payments", data);
    },
    onSuccess: () => {
      toast({
        title: "Pago registrado",
        description: "El pago se registró exitosamente.",
      });
      setIsPaymentDialogOpen(false);
      setPaymentCustomer(null);
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/top-debtors'] });
      paymentForm.reset();
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
        description: "No se pudo registrar el pago.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CustomerFormData) => {
    if (editingCustomer) {
      updateCustomerMutation.mutate({ id: editingCustomer.id, data });
    } else {
      createCustomerMutation.mutate(data);
    }
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleDelete = (customerId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      deleteCustomerMutation.mutate(customerId);
    }
  };

  const handlePayment = (customer: any) => {
    setPaymentCustomer(customer);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = (data: PaymentFormData) => {
    createPaymentMutation.mutate(data);
  };

  const handleViewAccount = (customer: any) => {
    setAccountCustomer(customer);
    setIsAccountDialogOpen(true);
  };

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
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2" data-testid="button-new-customer" onClick={() => { setEditingCustomer(null); setIsDialogOpen(true); }}>
                    <Plus className="h-4 w-4" />
                    <span>Nuevo Cliente</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
                    <DialogDescription>
                      {editingCustomer ? 'Modifica los datos del cliente.' : 'Completa la información del nuevo cliente.'}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre del cliente" {...field} data-testid="input-customer-name" />
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
                              <Input type="email" placeholder="email@ejemplo.com" {...field} data-testid="input-customer-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <Input placeholder="Número de teléfono" {...field} data-testid="input-customer-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dirección</FormLabel>
                            <FormControl>
                              <Input placeholder="Dirección del cliente" {...field} data-testid="input-customer-address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="documentNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>DNI/CUIT</FormLabel>
                            <FormControl>
                              <Input placeholder="Número de documento" {...field} data-testid="input-customer-document" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="creditLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Límite de Crédito</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-customer-credit-limit" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                          data-testid="button-cancel-customer"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}
                          data-testid="button-save-customer"
                        >
                          {(createCustomerMutation.isPending || updateCustomerMutation.isPending) ? "Guardando..." : (editingCustomer ? "Actualizar" : "Crear Cliente")}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
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
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-debt">${totalDebt.toFixed(2)}</p>
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
                    <p className="text-2xl font-bold text-foreground" data-testid="text-debtors-count">{customersWithDebtCount}</p>
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
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-customers">{totalCustomers}</p>
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
          {customersWithDebt && (customersWithDebt as any[]).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <CreditCard className="h-5 w-5" />
                  <span>Principales Deudores</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(customersWithDebt as any[]).slice(0, 5).map((customer: any) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50" data-testid={`debtor-card-${customer.id}`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.phone || 'Sin teléfono'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">${Number(customer.currentDebt || 0).toFixed(2)}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-1"
                          data-testid={`button-contact-${customer.id}`}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Contactar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Todos los Clientes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Todos los Clientes ({totalCustomers})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customersLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Cargando clientes...</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{searchTerm ? 'No se encontraron clientes.' : 'No hay clientes registrados aún.'}</p>
                  <p className="text-sm">{searchTerm ? 'Intenta con otro término de búsqueda.' : 'Comienza agregando tu primer cliente.'}</p>
                  {!searchTerm && (
                    <Button className="mt-4" onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-customer">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Primer Cliente
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Deuda</TableHead>
                      <TableHead>Límite</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer: any) => (
                      <TableRow key={customer.id} data-testid={`customer-row-${customer.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">{customer.address || 'Sin dirección'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{customer.phone || 'Sin teléfono'}</p>
                            <p className="text-sm text-muted-foreground">{customer.email || 'Sin email'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{customer.documentNumber || '-'}</span>
                        </TableCell>
                        <TableCell>
                          {Number(customer.currentDebt || 0) > 0 ? (
                            <Badge variant="destructive">${Number(customer.currentDebt).toFixed(2)}</Badge>
                          ) : (
                            <Badge variant="secondary">$0.00</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">${Number(customer.creditLimit || 0).toFixed(2)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(customer)}
                              data-testid={`button-edit-${customer.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(customer.id)}
                              data-testid={`button-delete-${customer.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            {Number(customer.currentDebt || 0) > 0 && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePayment(customer)}
                                  data-testid={`button-payment-${customer.id}`}
                                  title="Registrar Pago"
                                >
                                  <DollarSign className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewAccount(customer)}
                                  data-testid={`button-account-${customer.id}`}
                                  title="Ver Cuenta"
                                >
                                  <CreditCard className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  data-testid={`button-whatsapp-${customer.id}`}
                                  title="Contactar por WhatsApp"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
