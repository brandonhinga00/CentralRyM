import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  FileText, 
  Plus,
  Calendar,
  Receipt,
  CheckCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

// Expense form schema
const expenseSchema = z.object({
  description: z.string().min(1, "La descripción es requerida"),
  amount: z.string().min(1, "El monto es requerido").refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "El monto debe ser mayor a cero"),
  category: z.string().min(1, "La categoría es requerida"),
  paymentMethod: z.enum(["efectivo", "transferencia"], { required_error: "Selecciona un método de pago" }),
  notes: z.string().optional(),
});

type ExpenseData = z.infer<typeof expenseSchema>;
type ExpensePayload = ExpenseData & { expenseDate: string; };

export default function Finances() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isCashClosingOpen, setIsCashClosingOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [cashClosed, setCashClosed] = useState(false);

  // Expense form setup
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

  // API queries for financial data with error handling
  const { data: dailySales = [], isLoading: salesLoading, error: salesError } = useQuery({
    queryKey: ['/api/sales', selectedDate],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/sales?startDate=${selectedDate}&endDate=${selectedDate}`);
      return await response.json();
    },
    enabled: !!selectedDate,
    placeholderData: [],
  });

  const { data: dailyExpenses = [], isLoading: expensesLoading, error: expensesError } = useQuery({
    queryKey: ['/api/expenses', selectedDate],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/expenses?startDate=${selectedDate}&endDate=${selectedDate}`);
      return await response.json();
    },
    enabled: !!selectedDate,
    placeholderData: [],
  });

  const { data: dailyPayments = [], isLoading: paymentsLoading, error: paymentsError } = useQuery({
    queryKey: ['/api/payments', selectedDate],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/payments?startDate=${selectedDate}&endDate=${selectedDate}`);
      return await response.json();
    },
    enabled: !!selectedDate,
    placeholderData: [],
  });

  // Handle API errors
  useEffect(() => {
    if (salesError) {
      toast({
        title: "Error al cargar ventas",
        description: "No se pudieron cargar las ventas del día seleccionado",
        variant: "destructive",
      });
    }
    if (expensesError) {
      toast({
        title: "Error al cargar gastos", 
        description: "No se pudieron cargar los gastos del día seleccionado",
        variant: "destructive",
      });
    }
    if (paymentsError) {
      toast({
        title: "Error al cargar pagos",
        description: "No se pudieron cargar los pagos del día seleccionado",
        variant: "destructive",
      });
    }
  }, [salesError, expensesError, paymentsError, toast]);

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (expensePayload: ExpensePayload) => {
      return await apiRequest("POST", "/api/expenses", expensePayload);
    },
    onSuccess: (data) => {
      console.log('Expense created successfully:', data);
      console.log('Invalidating cache for date:', selectedDate);
      
      toast({
        title: "Gasto registrado",
        description: "El gasto se registró exitosamente.",
      });
      
      expenseForm.reset();
      setIsExpenseDialogOpen(false);
      
      // Invalidate and refetch relevant caches
      queryClient.invalidateQueries({ queryKey: ['/api/expenses', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] }); // Invalidate all expense queries
      
      // Force refetch of the specific expenses query
      queryClient.refetchQueries({ queryKey: ['/api/expenses', selectedDate] });
      
      console.log('Cache invalidation completed');
    },
    onError: (error: any) => {
      toast({
        title: "Error al registrar gasto",
        description: error.message || "No se pudo registrar el gasto",
        variant: "destructive",
      });
    },
  });

  // Handle expense form submission
  const onExpenseSubmit = (data: ExpenseData) => {
    const expensePayload: ExpensePayload = {
      ...data,
      expenseDate: selectedDate,
    };
    createExpenseMutation.mutate(expensePayload);
  };

  // Financial calculations
  const totalSales = Array.isArray(dailySales) ? dailySales.reduce((sum: number, sale: any) => sum + parseFloat(sale.totalAmount || 0), 0) : 0;
  const totalExpenses = Array.isArray(dailyExpenses) ? dailyExpenses.reduce((sum: number, expense: any) => sum + parseFloat(expense.amount || 0), 0) : 0;
  const totalPayments = Array.isArray(dailyPayments) ? dailyPayments.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || 0), 0) : 0;
  
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
  
  // Fiado (credit) sales - tracked separately, NOT counted as income
  const fiadoSales = salesByMethod.fiado || 0;
  
  // CORRECTED Net calculations - Only count cash and transfer sales as actual income
  // Fiado sales are credit given, not actual money received
  const actualSalesIncome = (salesByMethod.efectivo || 0) + (salesByMethod.transferencia || 0);
  const netIncome = actualSalesIncome + totalPayments; // Only actual money received
  const netBalance = netIncome - totalExpenses;
  
  // Payments by method with proper type checking
  const cashPayments = Array.isArray(dailyPayments) ? dailyPayments.filter((p: any) => p.paymentMethod === 'efectivo').reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0) : 0;
  const transferPayments = Array.isArray(dailyPayments) ? dailyPayments.filter((p: any) => p.paymentMethod === 'transferencia').reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0) : 0;
  
  const cashIncome = (salesByMethod.efectivo || 0) + cashPayments;
  const transferIncome = (salesByMethod.transferencia || 0) + transferPayments;
  
  const isDataLoading = salesLoading || expensesLoading || paymentsLoading;

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

  // Helper function to ensure valid date
  const getValidDate = (dateString: string) => {
    if (!dateString || dateString === '') return new Date();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  };
  
  const formattedDate = format(getValidDate(selectedDate), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

  // Enhanced cash closing with reconciliation
  const [actualCash, setActualCash] = useState("");
  const [actualTransfers, setActualTransfers] = useState("");
  const [closingNotes, setClosingNotes] = useState("");

  const handleCloseCash = async () => {
    if (!actualCash || !actualTransfers) {
      toast({
        title: "Datos incompletos",
        description: "Por favor ingrese los montos reales de efectivo y transferencias",
        variant: "destructive",
      });
      return;
    }

    try {
      // Calculate expected amounts from daily data
      const cashSales = Array.isArray(dailySales) ? dailySales.filter(sale => sale.paymentMethod === 'efectivo').reduce((sum, sale) => sum + Number(sale.totalAmount), 0) : 0;
      const transferSales = Array.isArray(dailySales) ? dailySales.filter(sale => sale.paymentMethod === 'transferencia').reduce((sum, sale) => sum + Number(sale.totalAmount), 0) : 0;
      const cashExpenses = Array.isArray(dailyExpenses) ? dailyExpenses.filter(expense => expense.paymentMethod === 'efectivo').reduce((sum, expense) => sum + Number(expense.amount), 0) : 0;
      const transferExpenses = Array.isArray(dailyExpenses) ? dailyExpenses.filter(expense => expense.paymentMethod === 'transferencia').reduce((sum, expense) => sum + Number(expense.amount), 0) : 0;
      
      // Include debt payments (customer payments received) in expected amounts
      const cashDebtPayments = Array.isArray(dailyPayments) ? dailyPayments.filter(payment => payment.paymentMethod === 'efectivo').reduce((sum, payment) => sum + Number(payment.amount), 0) : 0;
      const transferDebtPayments = Array.isArray(dailyPayments) ? dailyPayments.filter(payment => payment.paymentMethod === 'transferencia').reduce((sum, payment) => sum + Number(payment.amount), 0) : 0;
      
      const debtCollectedAmount = Array.isArray(dailyPayments) ? dailyPayments.reduce((sum, payment) => sum + Number(payment.amount), 0) : 0;
      const creditGivenAmount = Array.isArray(dailySales) ? dailySales.filter(sale => sale.paymentMethod === 'fiado').reduce((sum, sale) => sum + Number(sale.totalAmount), 0) : 0;
      
      // Correct expected amounts: sales + debt payments - expenses
      const expectedCash = cashSales + cashDebtPayments - cashExpenses;
      const expectedTransfers = transferSales + transferDebtPayments - transferExpenses;
      const actualCashNum = parseFloat(actualCash);
      const actualTransfersNum = parseFloat(actualTransfers);
      
      // Validate numeric inputs to prevent NaN
      if (isNaN(actualCashNum) || isNaN(actualTransfersNum)) {
        toast({
          title: "Valores inválidos",
          description: "Por favor ingrese números válidos para efectivo y transferencias",
          variant: "destructive",
        });
        return;
      }

      const cashClosingData = {
        closingDate: selectedDate,
        // closedBy is set server-side for security - never trust client
        expectedCash: expectedCash.toString(),
        expectedTransfers: expectedTransfers.toString(),
        actualCash: actualCash,
        actualTransfers: actualTransfers,
        cashVariance: (actualCashNum - expectedCash).toString(),
        transferVariance: (actualTransfersNum - expectedTransfers).toString(),
        totalSales: (cashSales + transferSales).toString(),
        totalExpenses: (cashExpenses + transferExpenses).toString(),
        debtCollected: debtCollectedAmount.toString(),
        creditGiven: creditGivenAmount.toString(),
        notes: closingNotes,
        reconciliationStatus: Math.abs(actualCashNum - expectedCash) > 1 || Math.abs(actualTransfersNum - expectedTransfers) > 1 ? "discrepancy" : "completed"
      };

      const response = await apiRequest("POST", "/api/cash-closings", cashClosingData);
      
      setCashClosed(true);
      setIsCashClosingOpen(false);
      setActualCash("");
      setActualTransfers("");
      setClosingNotes("");
      
      toast({
        title: "Caja cerrada con éxito",
        description: `Reconciliación completa para el ${formattedDate}`,
      });
    } catch (error) {
      toast({
        title: "Error al cerrar caja",
        description: "No se pudo completar el cierre de caja",
        variant: "destructive",
      });
    }
  };

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
              <Dialog open={isCashClosingOpen} onOpenChange={setIsCashClosingOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2" data-testid="button-close-cash" disabled={cashClosed}>
                    <Calculator className="h-4 w-4" />
                    <span>{cashClosed ? 'Caja Cerrada' : 'Cerrar Caja'}</span>
                    {cashClosed && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]" data-testid="dialog-cash-reconciliation">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <Calculator className="h-5 w-5" />
                      <span>Reconciliación y Cierre de Caja</span>
                    </DialogTitle>
                    <DialogDescription>
                      Reconciliación detallada para el {formattedDate}. Ingrese los montos físicos contados.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Expected vs Actual Summary */}
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3">Montos Esperados (Sistema)</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">💵 Efectivo esperado:</span>
                          <p className="font-medium">${(() => {
                            const cashSales = Array.isArray(dailySales) ? dailySales.filter(sale => sale.paymentMethod === 'efectivo').reduce((sum, sale) => sum + Number(sale.totalAmount), 0) : 0;
                            const cashExpenses = Array.isArray(dailyExpenses) ? dailyExpenses.filter(expense => expense.paymentMethod === 'efectivo').reduce((sum, expense) => sum + Number(expense.amount), 0) : 0;
                            const cashDebtPayments = Array.isArray(dailyPayments) ? dailyPayments.filter(payment => payment.paymentMethod === 'efectivo').reduce((sum, payment) => sum + Number(payment.amount), 0) : 0;
                            return (cashSales + cashDebtPayments - cashExpenses).toFixed(2);
                          })()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">💳 Transferencias esperadas:</span>
                          <p className="font-medium">${(() => {
                            const transferSales = Array.isArray(dailySales) ? dailySales.filter(sale => sale.paymentMethod === 'transferencia').reduce((sum, sale) => sum + Number(sale.totalAmount), 0) : 0;
                            const transferExpenses = Array.isArray(dailyExpenses) ? dailyExpenses.filter(expense => expense.paymentMethod === 'transferencia').reduce((sum, expense) => sum + Number(expense.amount), 0) : 0;
                            const transferDebtPayments = Array.isArray(dailyPayments) ? dailyPayments.filter(payment => payment.paymentMethod === 'transferencia').reduce((sum, payment) => sum + Number(payment.amount), 0) : 0;
                            return (transferSales + transferDebtPayments - transferExpenses).toFixed(2);
                          })()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Physical Count Inputs */}
                    <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3">Conteo Físico</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="actual-cash">💵 Efectivo Contado</Label>
                          <Input
                            id="actual-cash"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={actualCash}
                            onChange={(e) => setActualCash(e.target.value)}
                            data-testid="input-actual-cash"
                          />
                        </div>
                        <div>
                          <Label htmlFor="actual-transfers">💳 Transferencias Confirmadas</Label>
                          <Input
                            id="actual-transfers"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={actualTransfers}
                            onChange={(e) => setActualTransfers(e.target.value)}
                            data-testid="input-actual-transfers"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Variance Calculation */}
                    {(actualCash && actualTransfers) && (
                      <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg">
                        <h4 className="font-semibold mb-3">Diferencias</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Diferencia Efectivo:</span>
                            <p className={`font-medium ${(() => {
                              const cashSales = Array.isArray(dailySales) ? dailySales.filter(sale => sale.paymentMethod === 'efectivo').reduce((sum, sale) => sum + Number(sale.totalAmount), 0) : 0;
                              const cashExpenses = Array.isArray(dailyExpenses) ? dailyExpenses.filter(expense => expense.paymentMethod === 'efectivo').reduce((sum, expense) => sum + Number(expense.amount), 0) : 0;
                              const variance = parseFloat(actualCash) - (cashSales - cashExpenses);
                              return variance >= 0 ? 'text-green-600' : 'text-red-600';
                            })()}`}>
                              ${(() => {
                                const cashSales = Array.isArray(dailySales) ? dailySales.filter(sale => sale.paymentMethod === 'efectivo').reduce((sum, sale) => sum + Number(sale.totalAmount), 0) : 0;
                                const cashExpenses = Array.isArray(dailyExpenses) ? dailyExpenses.filter(expense => expense.paymentMethod === 'efectivo').reduce((sum, expense) => sum + Number(expense.amount), 0) : 0;
                                return (parseFloat(actualCash) - (cashSales - cashExpenses)).toFixed(2);
                              })()}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Diferencia Transferencias:</span>
                            <p className={`font-medium ${(() => {
                              const transferSales = Array.isArray(dailySales) ? dailySales.filter(sale => sale.paymentMethod === 'transferencia').reduce((sum, sale) => sum + Number(sale.totalAmount), 0) : 0;
                              const transferExpenses = Array.isArray(dailyExpenses) ? dailyExpenses.filter(expense => expense.paymentMethod === 'transferencia').reduce((sum, expense) => sum + Number(expense.amount), 0) : 0;
                              const variance = parseFloat(actualTransfers) - (transferSales - transferExpenses);
                              return variance >= 0 ? 'text-green-600' : 'text-red-600';
                            })()}`}>
                              ${(() => {
                                const transferSales = Array.isArray(dailySales) ? dailySales.filter(sale => sale.paymentMethod === 'transferencia').reduce((sum, sale) => sum + Number(sale.totalAmount), 0) : 0;
                                const transferExpenses = Array.isArray(dailyExpenses) ? dailyExpenses.filter(expense => expense.paymentMethod === 'transferencia').reduce((sum, expense) => sum + Number(expense.amount), 0) : 0;
                                return (parseFloat(actualTransfers) - (transferSales - transferExpenses)).toFixed(2);
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <Label htmlFor="closing-notes">Notas de Reconciliación (Opcional)</Label>
                      <textarea
                        id="closing-notes"
                        placeholder="Observaciones sobre diferencias o incidencias..."
                        value={closingNotes}
                        onChange={(e) => setClosingNotes(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                        rows={3}
                        data-testid="textarea-closing-notes"
                      />
                    </div>

                    {/* Final Summary */}
                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Resumen Final del Día</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Total Ventas:</span>
                          <span className="font-medium">${netIncome.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Gastos:</span>
                          <span className="font-medium">${totalExpenses.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Crédito Otorgado:</span>
                          <span className="font-medium">${(() => {
                            return (dailySales as any[]).filter(sale => sale.paymentMethod === 'fiado').reduce((sum, sale) => sum + Number(sale.totalAmount), 0).toFixed(2);
                          })()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pagos Recibidos:</span>
                          <span className="font-medium">${(() => {
                            return (dailyPayments as any[]).reduce((sum, payment) => sum + Number(payment.amount), 0).toFixed(2);
                          })()}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Balance Neto:</span>
                          <span className={netBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ${netBalance.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsCashClosingOpen(false);
                        setActualCash("");
                        setActualTransfers("");
                        setClosingNotes("");
                      }}
                      data-testid="button-cancel-reconciliation"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCloseCash}
                      disabled={!actualCash || !actualTransfers}
                      data-testid="button-confirm-reconciliation"
                    >
                      Finalizar Reconciliación
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Resumen Financiero del Día */}
          {isDataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-8 bg-muted rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Ingresos del Día</p>
                      <p className="text-2xl font-bold text-green-600" data-testid="text-daily-income">
                        ${netIncome.toFixed(2)}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Solo efectivo y transferencias
                      </p>
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
                      <p className="text-2xl font-bold text-red-600" data-testid="text-daily-expenses">
                        ${totalExpenses.toFixed(2)}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        {Array.isArray(dailyExpenses) ? dailyExpenses.length : 0} gastos
                      </p>
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
                      <p className="text-2xl font-bold text-orange-600" data-testid="text-credit-given">
                        ${fiadoSales.toFixed(2)}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        Crédito otorgado (no es ingreso)
                      </p>
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
                      <p className={`text-2xl font-bold ${
                        netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`} data-testid="text-net-balance">
                        ${netBalance.toFixed(2)}
                      </p>
                      <p className={`text-xs mt-1 ${
                        netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {netBalance >= 0 ? 'Ganancia' : 'Pérdida'}
                      </p>
                    </div>
                    <div className={`w-12 h-12 ${netBalance >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-lg flex items-center justify-center`}>
                      <DollarSign className={`h-6 w-6 ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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
                  <h4 className="font-semibold text-green-600">Ingresos Detallados</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">💵 Ventas en Efectivo:</span>
                      <span className="font-medium" data-testid="text-cash-sales">${(salesByMethod.efectivo || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">💳 Ventas por Transferencia:</span>
                      <span className="font-medium" data-testid="text-transfer-sales">${(salesByMethod.transferencia || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">💰 Cobros en Efectivo:</span>
                      <span className="font-medium">${cashPayments.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">🏦 Cobros por Transferencia:</span>
                      <span className="font-medium">${transferPayments.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold text-green-600">
                        <span>Total Ingresos:</span>
                        <span data-testid="text-total-income">${netIncome.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="bg-green-50 p-2 rounded text-sm">
                      <div className="flex justify-between">
                        <span>💵 Efectivo Total:</span>
                        <span className="font-medium">${cashIncome.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>💳 Transferencia Total:</span>
                        <span className="font-medium">${transferIncome.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-red-600">Egresos Detallados</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">💵 Gastos en Efectivo:</span>
                      <span className="font-medium" data-testid="text-general-expenses">${(expensesByMethod.efectivo || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">💳 Gastos por Transferencia:</span>
                      <span className="font-medium" data-testid="text-supplier-payments">${(expensesByMethod.transferencia || 0).toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold text-red-600">
                        <span>Total Egresos:</span>
                        <span data-testid="text-total-expenses">${totalExpenses.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="bg-red-50 p-2 rounded text-sm mt-2">
                      <p className="text-red-700 font-medium mb-1">Resumen por Método:</p>
                      <div className="flex justify-between">
                        <span>💵 Efectivo gastado:</span>
                        <span className="font-medium">${(expensesByMethod.efectivo || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>💳 Transferencia gastada:</span>
                        <span className="font-medium">${(expensesByMethod.transferencia || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`mt-6 p-4 rounded-lg ${
                netBalance >= 0 ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Balance Final del Día:</span>
                  <span className={`text-2xl font-bold ${
                    netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} data-testid="text-final-balance">
                    ${netBalance.toFixed(2)}
                  </span>
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
                <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="flex items-center space-x-2" data-testid="button-new-expense">
                      <Plus className="h-4 w-4" />
                      <span>Nuevo Gasto</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Registrar Nuevo Gasto</DialogTitle>
                      <DialogDescription>
                        Registra un gasto para la fecha {format(getValidDate(selectedDate), 'dd/MM/yyyy')}
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
                                  <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-expense-amount" />
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-expense-category">
                                      <SelectValue placeholder="Selecciona categoría" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="mercadería">Mercadería</SelectItem>
                                    <SelectItem value="servicios">Servicios</SelectItem>
                                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                                    <SelectItem value="transporte">Transporte</SelectItem>
                                    <SelectItem value="personal">Personal</SelectItem>
                                    <SelectItem value="otros">Otros</SelectItem>
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                              <FormLabel>Notas (opcional)</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="Notas adicionales..." data-testid="input-expense-notes" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsExpenseDialogOpen(false)}
                            data-testid="button-cancel-expense"
                          >
                            Cancelar
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createExpenseMutation.isPending}
                            data-testid="button-save-expense"
                          >
                            {createExpenseMutation.isPending ? "Guardando..." : "Guardar Gasto"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isDataLoading ? (
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
                            <Badge variant="destructive">${expense.amount}</Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <Badge variant="secondary">{expense.category}</Badge>
                            <span>
                              {expense.paymentMethod === 'efectivo' ? '💵 Efectivo' : '💳 Transferencia'}
                            </span>
                            {expense.createdAt && (
                              <span>{format(new Date(expense.createdAt), 'HH:mm', { locale: es })}</span>
                            )}
                          </div>
                          {expense.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{expense.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total de gastos del día:</span>
                      <span className="text-red-600">${totalExpenses.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay gastos registrados para esta fecha.</p>
                  <p className="text-sm">Utiliza el botón superior para agregar gastos.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
