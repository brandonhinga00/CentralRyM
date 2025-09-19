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
import { Users, Plus, Search, CreditCard, DollarSign, Phone, Edit, Trash2, MessageCircle, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { isUnauthorizedError } from "@/lib/authUtils";

const customerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  idDocument: z.string().optional(),
  creditLimit: z.string().optional(),
});

const paymentSchema = z.object({
  amount: z.string().min(1, "El monto es requerido").refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "El monto debe ser un número válido mayor a cero"),
  paymentMethod: z.string().min(1, "El método de pago es requerido"),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;
type PaymentFormData = z.infer<typeof paymentSchema>;

// Account Transaction History Component
function AccountTransactionHistory({ sales, payments }: { sales: any[], payments: any[] }) {
  // Combine and sort transactions by date
  const transactions = [
    ...sales.map((sale: any) => ({
      id: sale.id,
      type: 'sale' as const,
      date: sale.saleDate,
      description: `Venta ${sale.paymentMethod}`,
      amount: Number(sale.totalAmount),
      balance: 0, // Will be calculated below
    })),
    ...payments.map((payment: any) => ({
      id: payment.id,
      type: 'payment' as const,
      date: payment.paymentDate,
      description: `Pago ${payment.paymentMethod}`,
      amount: -Number(payment.amount), // Negative because it reduces debt
      balance: 0, // Will be calculated below
    }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate running balance
  let runningBalance = 0;
  transactions.forEach(transaction => {
    runningBalance += transaction.amount;
    transaction.balance = runningBalance;
  });

  if (transactions.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No hay movimientos registrados</p>
        <p className="text-sm">Las transacciones aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {transactions.map((transaction, index) => (
        <div 
          key={transaction.id} 
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
          data-testid={`transaction-${transaction.id}`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              transaction.type === 'sale' 
                ? 'bg-orange-100 text-orange-600' 
                : 'bg-green-100 text-green-600'
            }`}>
              {transaction.type === 'sale' ? 
                <ShoppingCart className="h-4 w-4" /> : 
                <DollarSign className="h-4 w-4" />
              }
            </div>
            <div>
              <p className="font-medium text-sm">{transaction.description}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(transaction.date), "d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-medium ${
              transaction.type === 'sale' ? 'text-orange-600' : 'text-green-600'
            }`}>
              {transaction.type === 'sale' ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              Saldo: ${transaction.balance.toFixed(2)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

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
    queryKey: ['/api/customers/with-debt'],
    enabled: isAuthenticated,
    retry: false,
  });
  
  // Load top debtors for display
  const { data: topDebtors } = useQuery({
    queryKey: ['/api/dashboard/top-debtors'],
    enabled: isAuthenticated,
    retry: false,
  });

  // Load customer transaction history for account statement
  const { data: customerSales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['/api/sales', 'customer', accountCustomer?.id],
    queryFn: async () => {
      if (!accountCustomer) return [];
      const response = await apiRequest("GET", `/api/sales?customerId=${accountCustomer.id}&paymentMethod=fiado`);
      return response.json();
    },
    enabled: !!accountCustomer?.id && isAccountDialogOpen,
    retry: false,
  });

  const { data: customerPayments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/payments', accountCustomer?.id],
    queryFn: async () => {
      if (!accountCustomer) return [];
      const response = await apiRequest("GET", `/api/payments?customerId=${accountCustomer.id}`);
      return response.json();
    },
    enabled: !!accountCustomer?.id && isAccountDialogOpen,
    retry: false,
  });

  const filteredCustomers = Array.isArray(customers) ? customers.filter((customer: any) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchTerm)) ||
    (customer.idDocument && customer.idDocument.includes(searchTerm))
  ) : [];

  const totalCustomers = Array.isArray(customers) ? customers.length : 0;
  const customersWithDebtCount = Array.isArray(customersWithDebt) ? customersWithDebt.length : 0;
  const totalDebt = Array.isArray(customersWithDebt) ? customersWithDebt.reduce((sum: number, customer: any) => sum + Number(customer.currentDebt || 0), 0) : 0;

  // Form handling
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      idDocument: "",
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
        idDocument: editingCustomer.idDocument || "",
        creditLimit: editingCustomer.creditLimit || "",
      });
    } else {
      form.reset({
        name: "",
        email: "",
        phone: "",
        address: "",
        idDocument: "",
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
      queryClient.invalidateQueries({ queryKey: ['/api/customers/with-debt'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/customers/with-debt'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/customers/with-debt'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/customers/with-debt'] });
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
    // Validate payment amount doesn't exceed current debt
    const currentDebt = Number(paymentCustomer?.currentDebt || 0);
    const paymentAmount = parseFloat(data.amount);
    
    if (isNaN(paymentAmount)) {
      toast({
        title: "Error de validación",
        description: "El monto debe ser un número válido",
        variant: "destructive",
      });
      return;
    }
    
    if (paymentAmount > currentDebt) {
      toast({
        title: "Error de validación",
        description: `El pago no puede exceder la deuda actual de $${currentDebt.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }
    
    if (paymentAmount <= 0) {
      toast({
        title: "Error de validación",
        description: "El monto del pago debe ser mayor a cero",
        variant: "destructive",
      });
      return;
    }
    
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
                        name="idDocument"
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
          {Array.isArray(topDebtors) && topDebtors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <CreditCard className="h-5 w-5" />
                  <span>Principales Deudores</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topDebtors.slice(0, 5).map((customer: any) => (
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
                          <span className="text-sm">{customer.idDocument || '-'}</span>
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

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Cliente: {paymentCustomer?.name} - Deuda: ${Number(paymentCustomer?.currentDebt || 0).toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-4">
              <FormField
                control={paymentForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-payment-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pago</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full p-2 border rounded-md" data-testid="select-payment-method">
                        <option value="">Seleccionar método</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="tarjeta">Tarjeta</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Input placeholder="Notas adicionales (opcional)" {...field} data-testid="input-payment-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsPaymentDialogOpen(false)}
                  data-testid="button-cancel-payment"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPaymentMutation.isPending}
                  data-testid="button-save-payment"
                >
                  {createPaymentMutation.isPending ? "Registrando..." : "Registrar Pago"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Account Statement Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Estado de Cuenta</DialogTitle>
            <DialogDescription>
              Cliente: {accountCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Deuda Actual</p>
                <p className="text-2xl font-bold text-red-600">${Number(accountCustomer?.currentDebt || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="font-medium">Límite de Crédito</p>
                <p className="text-lg">${Number(accountCustomer?.creditLimit || 0).toFixed(2)}</p>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Historial de Movimientos</h4>
              {salesLoading || paymentsLoading ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Cargando historial...</p>
                </div>
              ) : (
                <AccountTransactionHistory 
                  sales={customerSales} 
                  payments={customerPayments} 
                />
              )}
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={() => setIsAccountDialogOpen(false)}
                data-testid="button-close-account"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
