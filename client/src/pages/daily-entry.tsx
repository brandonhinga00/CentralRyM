import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Plus, Search, QrCode, ShoppingCart, User, DollarSign, Receipt, Calculator, TrendingDown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertSaleSchema, insertSaleItemSchema, insertExpenseSchema, type Product, type Customer, type Sale, type Expense } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

// Form schemas
const quickSaleSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  productName: z.string().min(1, "Nombre del producto es requerido"),
  quantity: z.string().min(1, "La cantidad es requerida").refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "La cantidad debe ser mayor a cero"),
  unitPrice: z.string().min(1, "El precio es requerido"),
  paymentMethod: z.enum(["efectivo", "transferencia", "fiado"], { required_error: "Selecciona un método de pago" }),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
}).refine((data) => {
  if (data.paymentMethod === "fiado" && !data.customerId) {
    return false;
  }
  return true;
}, {
  message: "Para ventas fiado debes seleccionar un cliente",
  path: ["customerId"],
});

const expenseSchema = z.object({
  description: z.string().min(1, "La descripción es requerida"),
  amount: z.string().min(1, "El monto es requerido").refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "El monto debe ser mayor a cero"),
  category: z.string().min(1, "La categoría es requerida"),
  paymentMethod: z.enum(["efectivo", "transferencia"], { required_error: "Selecciona un método de pago" }),
  notes: z.string().optional(),
});

type QuickSaleData = z.infer<typeof quickSaleSchema>;
type ExpenseData = z.infer<typeof expenseSchema>;

export default function DailyEntry() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => {
    // Check localStorage first for persisted date
    const storedDate = localStorage.getItem('selectedDate');
    return storedDate || format(new Date(), 'yyyy-MM-dd');
  });

  // Update localStorage whenever selectedDate changes
  useEffect(() => {
    localStorage.setItem('selectedDate', selectedDate);
  }, [selectedDate]);
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerField, setShowCustomerField] = useState(false);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("sales");

  // Form setup
  const form = useForm<QuickSaleData>({
    resolver: zodResolver(quickSaleSchema),
    mode: "onChange",
    defaultValues: {
      productId: "",
      productName: "",
      quantity: "1",
      unitPrice: "",
      paymentMethod: "efectivo",
      customerId: "",
      customerName: "",
    },
  });

  // Ensure form resets with correct defaults
  useEffect(() => {
    form.reset({
      productId: "",
      productName: "",
      quantity: "1",
      unitPrice: "",
      paymentMethod: "efectivo",
      customerId: "",
      customerName: "",
    });
  }, [form]);

  const expenseForm = useForm<ExpenseData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      paymentMethod: "efectivo",
      notes: "",
    },
  });

  // API queries
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
    enabled: !!productSearch && productSearch.length >= 2,
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['/api/customers'],
    enabled: !!customerSearch && customerSearch.length >= 2,
  });

  const { data: dailySales = [], isLoading: salesLoading, refetch: refetchSales } = useQuery({
    queryKey: ['/api/sales', selectedDate],
    queryFn: () => apiRequest("GET", `/api/sales?startDate=${selectedDate}&endDate=${selectedDate}`),
  });

  const { data: dailyExpenses = [], isLoading: expensesLoading, refetch: refetchExpenses } = useQuery({
    queryKey: ['/api/expenses', selectedDate],
    queryFn: () => apiRequest("GET", `/api/expenses?startDate=${selectedDate}&endDate=${selectedDate}`),
  });

  // Filter products based on search
  const filteredProducts = (products as Product[]).filter((product: Product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 10);

  // Filter customers based on search
  const filteredCustomers = (customers as Customer[]).filter((customer: Customer) =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase())
  ).slice(0, 10);

  // Mutations
  const createSaleMutation = useMutation({
    mutationFn: async (data: { sale: any; items: any[] }) => {
      return await apiRequest("POST", "/api/sales", data);
    },
    onSuccess: () => {
      toast({
        title: "Venta registrada",
        description: "La venta se registró exitosamente.",
      });
      form.reset();
      setProductSearch("");
      setCustomerSearch("");
      setShowCustomerField(false);
      refetchSales();
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/quick-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al registrar venta",
        description: error.message || "No se pudo registrar la venta",
        variant: "destructive",
      });
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (expenseData: ExpenseData) => {
      const data = {
        ...expenseData,
        expenseDate: selectedDate,
      };
      return await apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      toast({
        title: "Gasto registrado",
        description: "El gasto se registró exitosamente.",
      });
      expenseForm.reset();
      setIsExpenseDialogOpen(false);
      refetchExpenses();
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/quick-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al registrar gasto",
        description: error.message || "No se pudo registrar el gasto",
        variant: "destructive",
      });
    },
  });

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

  // Handle payment method change
  const paymentMethod = form.watch("paymentMethod");
  useEffect(() => {
    setShowCustomerField(paymentMethod === "fiado");
    if (paymentMethod !== "fiado") {
      form.setValue("customerId", "");
      form.setValue("customerName", "");
      setCustomerSearch("");
    }
  }, [paymentMethod, form]);

  // Form submission
  const onSubmit = async (data: QuickSaleData) => {
    try {
      const quantity = parseFloat(data.quantity);
      const unitPrice = parseFloat(data.unitPrice);
      const totalPrice = quantity * unitPrice;

      const saleData = {
        saleDate: selectedDate,
        customerId: data.paymentMethod === "fiado" ? data.customerId : undefined,
        paymentMethod: data.paymentMethod,
        totalAmount: totalPrice.toString(),
        isPaid: data.paymentMethod !== "fiado",
        entryMethod: "manual",
      };

      const itemData = {
        productId: data.productId,
        quantity: quantity.toString(),
        unitPrice: data.unitPrice,
        totalPrice: totalPrice.toString(),
      };

      await createSaleMutation.mutateAsync({
        sale: saleData,
        items: [itemData],
      });
    } catch (error) {
      console.error('Error submitting sale:', error);
    }
  };

  const onExpenseSubmit = async (data: ExpenseData) => {
    try {
      await createExpenseMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error submitting expense:', error);
    }
  };

  // Helper functions
  const selectProduct = (product: Product) => {
    form.setValue("productId", product.id);
    form.setValue("productName", product.name);
    form.setValue("unitPrice", product.salePrice || "");
    setProductSearch(product.name);
    setShowProductSuggestions(false);
  };

  const selectCustomer = (customer: Customer) => {
    form.setValue("customerId", customer.id);
    form.setValue("customerName", customer.name);
    setCustomerSearch(customer.name);
    setShowCustomerSuggestions(false);
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

  const formattedDate = format(new Date(selectedDate), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  
  // Daily calculations
  const totalSales = Array.isArray(dailySales) ? dailySales.reduce((sum: number, sale: any) => sum + parseFloat(sale.totalAmount || 0), 0) : 0;
  const totalExpenses = Array.isArray(dailyExpenses) ? dailyExpenses.reduce((sum: number, expense: any) => sum + parseFloat(expense.amount || 0), 0) : 0;
  
  // Sales by payment method
  const salesByMethod = Array.isArray(dailySales) ? dailySales.reduce((acc: any, sale: any) => {
    const method = sale.paymentMethod || 'efectivo';
    acc[method] = (acc[method] || 0) + parseFloat(sale.totalAmount || 0);
    return acc;
  }, {}) : {};
  
  // Expenses by payment method
  const expensesByMethod = Array.isArray(dailyExpenses) ? dailyExpenses.reduce((acc: any, expense: any) => {
    const method = expense.paymentMethod || 'efectivo';
    acc[method] = (acc[method] || 0) + parseFloat(expense.amount || 0);
    return acc;
  }, {}) : {};
  
  // Net totals by payment method
  const netCash = (salesByMethod.efectivo || 0) - (expensesByMethod.efectivo || 0);
  const netTransfer = (salesByMethod.transferencia || 0) - (expensesByMethod.transferencia || 0);
  const netFiado = salesByMethod.fiado || 0;
  const netTotal = totalSales - totalExpenses;

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
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total del día</p>
                <p className="text-xl font-bold text-green-600">${totalSales.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Daily Reconciliation Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Resumen Diario</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400">Ventas Totales</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">${totalSales.toFixed(2)}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 dark:text-red-400">Gastos Totales</p>
                      <p className="text-2xl font-bold text-red-700 dark:text-red-300">${totalExpenses.toFixed(2)}</p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Efectivo Neto</p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">${netCash.toFixed(2)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className={`${netTotal >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'} p-4 rounded-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${netTotal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>Resultado Neto</p>
                      <p className={`text-2xl font-bold ${netTotal >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>${netTotal.toFixed(2)}</p>
                    </div>
                    <Calculator className={`h-8 w-8 ${netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for different sections */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="sales" className="flex items-center space-x-2">
                <ShoppingCart className="h-4 w-4" />
                <span>Ventas</span>
              </TabsTrigger>
              <TabsTrigger value="expenses" className="flex items-center space-x-2">
                <Receipt className="h-4 w-4" />
                <span>Gastos</span>
              </TabsTrigger>
              <TabsTrigger value="reconciliation" className="flex items-center space-x-2">
                <Calculator className="h-4 w-4" />
                <span>Conciliación</span>
              </TabsTrigger>
            </TabsList>

            {/* Sales Tab */}
            <TabsContent value="sales" className="space-y-6">
              {/* Formulario de Nueva Venta */}
              <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Nueva Venta</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Product Search */}
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="productName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Producto</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field}
                                  placeholder="Buscar producto..."
                                  className="pr-10"
                                  data-testid="input-product"
                                  value={productSearch}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setProductSearch(value);
                                    setShowProductSuggestions(value.length >= 2);
                                    if (!value) {
                                      form.setValue("productId", "");
                                      form.setValue("unitPrice", "");
                                      setShowProductSuggestions(false);
                                    }
                                  }}
                                />
                                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Product suggestions */}
                      {showProductSuggestions && filteredProducts.length > 0 && (
                        <div className="border rounded-md bg-background shadow-lg absolute z-10 w-full max-w-sm">
                          {filteredProducts.map((product: Product) => (
                            <div
                              key={product.id}
                              className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                              onClick={() => selectProduct(product)}
                              data-testid={`product-option-${product.id}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{product.name}</span>
                                <span className="text-green-600">${product.salePrice}</span>
                              </div>
                              {product.currentStock !== undefined && (
                                <p className="text-sm text-muted-foreground">Stock: {product.currentStock}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Quantity Input */}
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number" 
                              placeholder="1" 
                              min="1"
                              step="0.1"
                              data-testid="input-quantity"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Payment Method */}
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Método de Pago</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-payment-method">
                                <SelectValue placeholder="Seleccionar método" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="efectivo">💵 Efectivo</SelectItem>
                              <SelectItem value="transferencia">💳 Transferencia</SelectItem>
                              <SelectItem value="fiado">📋 Fiado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Customer Search (only for fiado) */}
                    {showCustomerField && (
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="customerName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cliente <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    {...field}
                                    placeholder="Nombre del cliente..."
                                    className="pr-10"
                                    data-testid="input-customer"
                                    value={customerSearch}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setCustomerSearch(value);
                                      setShowCustomerSuggestions(value.length >= 2);
                                      if (!value) {
                                        form.setValue("customerId", "");
                                        setShowCustomerSuggestions(false);
                                      }
                                    }}
                                  />
                                  <User className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* Customer suggestions */}
                        {showCustomerSuggestions && filteredCustomers.length > 0 && (
                          <div className="border rounded-md bg-background shadow-lg absolute z-10 w-full max-w-sm">
                            {filteredCustomers.map((customer: Customer) => (
                              <div
                                key={customer.id}
                                className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                onClick={() => selectCustomer(customer)}
                                data-testid={`customer-option-${customer.id}`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{customer.name}</span>
                                  {customer.currentDebt && parseFloat(customer.currentDebt) > 0 && (
                                    <span className="text-orange-600 text-sm">Debe: ${customer.currentDebt}</span>
                                  )}
                                </div>
                                {customer.phone && (
                                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Price Display */}
                  {(() => {
                    const unitPrice = form.watch("unitPrice");
                    const quantity = form.watch("quantity");
                    return unitPrice && quantity && (
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Precio unitario:</span>
                          <span className="font-medium">${parseFloat(unitPrice || "0").toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Cantidad:</span>
                          <span className="font-medium">{parseFloat(quantity || "0").toFixed(1)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-green-600">
                            ${(parseFloat(unitPrice || "0") * parseFloat(quantity || "0")).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                  
                  <div className="flex space-x-3">
                    <Button 
                      type="submit" 
                      className="flex-1 flex items-center justify-center space-x-2"
                      data-testid="button-register-sale"
                      disabled={createSaleMutation.isPending || !form.formState.isValid}
                    >
                      {createSaleMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ShoppingCart className="h-4 w-4" />
                      )}
                      <span>{createSaleMutation.isPending ? "Registrando..." : "Registrar Venta"}</span>
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
              </Form>
            </CardContent>
          </Card>

              {/* Lista de Ventas del Día */}
              <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Ventas del Día Seleccionado</span>
                {Array.isArray(dailySales) && dailySales.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {dailySales.length} venta{dailySales.length !== 1 ? 's' : ''}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2 text-muted-foreground">Cargando ventas...</span>
                </div>
              ) : Array.isArray(dailySales) && dailySales.length > 0 ? (
                <div className="space-y-3">
                  {dailySales.map((sale: any) => (
                    <div key={sale.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-medium">${sale.totalAmount}</span>
                            <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                              {sale.paymentMethod === 'efectivo' ? '💵 Efectivo' :
                               sale.paymentMethod === 'transferencia' ? '💳 Transferencia' :
                               '📋 Fiado'}
                            </span>
                          </div>
                          {sale.customer && (
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>Cliente: {sale.customer.name}</span>
                            </div>
                          )}
                          {sale.notes && (
                            <p className="text-sm text-muted-foreground">{sale.notes}</p>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{format(new Date(sale.createdAt), 'HH:mm', { locale: es })}</p>
                          <p className={`px-2 py-1 rounded-full text-xs ${
                            sale.isPaid 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {sale.isPaid ? 'Pagado' : 'Pendiente'}
                          </p>
                        </div>
                      </div>
                      {sale.items && sale.items.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="space-y-1">
                            {sale.items.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">
                                  {item.product?.name || 'Producto'} x {parseFloat(item.quantity).toFixed(1)}
                                </span>
                                <span>${item.totalPrice}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay ventas registradas para esta fecha.</p>
                  <p className="text-sm">Utiliza el formulario superior para agregar ventas.</p>
                </div>
              )}
              </CardContent>
              </Card>
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses" className="space-y-6">
              {/* Expense Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Receipt className="h-5 w-5" />
                      <span>Registrar Gasto</span>
                    </div>
                    <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center space-x-2" data-testid="button-add-expense">
                          <Plus className="h-4 w-4" />
                          <span>Agregar Gasto</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Registrar Nuevo Gasto</DialogTitle>
                          <DialogDescription>
                            Registra un gasto para la fecha seleccionada
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...expenseForm}>
                          <form onSubmit={expenseForm.handleSubmit(onExpenseSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={expenseForm.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Descripción del gasto" data-testid="input-expense-description" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={expenseForm.control}
                                name="amount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Monto</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="number" placeholder="0.00" min="0" step="0.01" data-testid="input-expense-amount" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={expenseForm.control}
                                name="category"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Categoría</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-expense-category">
                                          <SelectValue placeholder="Seleccionar categoría" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="proveedores">📦 Proveedores</SelectItem>
                                        <SelectItem value="servicios">⚡ Servicios</SelectItem>
                                        <SelectItem value="sueldos">👥 Sueldos</SelectItem>
                                        <SelectItem value="transporte">🚛 Transporte</SelectItem>
                                        <SelectItem value="marketing">📢 Marketing</SelectItem>
                                        <SelectItem value="mantenimiento">🔧 Mantenimiento</SelectItem>
                                        <SelectItem value="otros">📝 Otros</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={expenseForm.control}
                                name="paymentMethod"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Método de Pago</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-expense-payment">
                                          <SelectValue placeholder="Método de pago" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="efectivo">💵 Efectivo</SelectItem>
                                        <SelectItem value="transferencia">💳 Transferencia</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={expenseForm.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notas (Opcional)</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} placeholder="Notas adicionales..." data-testid="textarea-expense-notes" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex justify-end space-x-3">
                              <Button type="button" variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button type="submit" disabled={createExpenseMutation.isPending} data-testid="button-submit-expense">
                                {createExpenseMutation.isPending ? (
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                ) : (
                                  <Receipt className="h-4 w-4 mr-2" />
                                )}
                                {createExpenseMutation.isPending ? "Registrando..." : "Registrar Gasto"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {expensesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="ml-2 text-muted-foreground">Cargando gastos...</span>
                    </div>
                  ) : Array.isArray(dailyExpenses) && dailyExpenses.length > 0 ? (
                    <div className="space-y-3">
                      {dailyExpenses.map((expense: any) => (
                        <div key={expense.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Receipt className="h-4 w-4 text-red-600" />
                                <span className="font-medium">{expense.description}</span>
                                <span className="text-sm px-2 py-1 bg-red-100 text-red-800 rounded-full">
                                  ${expense.amount}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                  {expense.category}
                                </span>
                                <span>
                                  {expense.paymentMethod === 'efectivo' ? '💵 Efectivo' : '💳 Transferencia'}
                                </span>
                              </div>
                              {expense.notes && (
                                <p className="text-sm text-muted-foreground">{expense.notes}</p>
                              )}
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <p>{format(new Date(expense.createdAt), 'HH:mm', { locale: es })}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No hay gastos registrados para esta fecha.</p>
                      <p className="text-sm">Utiliza el botón "Agregar Gasto" para registrar gastos.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reconciliation Tab */}
            <TabsContent value="reconciliation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5" />
                    <span>Conciliación Diaria Detallada</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Ingresos por método */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 flex items-center">
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Ingresos por Método
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <span>💵 Efectivo</span>
                          <span className="font-semibold">${(salesByMethod.efectivo || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <span>💳 Transferencias</span>
                          <span className="font-semibold">${(salesByMethod.transferencia || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <span>📝 Fiado</span>
                          <span className="font-semibold">${(salesByMethod.fiado || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-100 dark:bg-green-800/30 rounded-lg font-bold">
                          <span>Total Ventas</span>
                          <span>${totalSales.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Gastos por método */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 flex items-center">
                        <TrendingDown className="h-5 w-5 mr-2" />
                        Gastos por Método
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <span>💵 Efectivo</span>
                          <span className="font-semibold">${(expensesByMethod.efectivo || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <span>💳 Transferencias</span>
                          <span className="font-semibold">${(expensesByMethod.transferencia || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-100 dark:bg-red-800/30 rounded-lg font-bold">
                          <span>Total Gastos</span>
                          <span>${totalExpenses.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Net Balance */}
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Calculator className="h-5 w-5 mr-2" />
                      Balance Neto por Método
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`p-4 rounded-lg ${netCash >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                        <div className="text-center">
                          <p className="text-sm opacity-75">Efectivo Neto</p>
                          <p className={`text-xl font-bold ${netCash >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                            ${netCash.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className={`p-4 rounded-lg ${netTransfer >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                        <div className="text-center">
                          <p className="text-sm opacity-75">Transferencias Netas</p>
                          <p className={`text-xl font-bold ${netTransfer >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                            ${netTransfer.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className={`p-4 rounded-lg ${netTotal >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                        <div className="text-center">
                          <p className="text-sm opacity-75">Resultado Final</p>
                          <p className={`text-2xl font-bold ${netTotal >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                            ${netTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
