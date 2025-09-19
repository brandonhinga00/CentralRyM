import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Finances() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isCashClosingOpen, setIsCashClosingOpen] = useState(false);
  const [cashClosed, setCashClosed] = useState(false);

  // API queries for financial data with error handling
  const { data: dailySales = [], isLoading: salesLoading, error: salesError } = useQuery({
    queryKey: ['/api/sales', selectedDate],
    queryFn: () => apiRequest("GET", `/api/sales?startDate=${selectedDate}&endDate=${selectedDate}`),
    enabled: !!selectedDate,
  });

  const { data: dailyExpenses = [], isLoading: expensesLoading, error: expensesError } = useQuery({
    queryKey: ['/api/expenses', selectedDate],
    queryFn: () => apiRequest("GET", `/api/expenses?startDate=${selectedDate}&endDate=${selectedDate}`),
    enabled: !!selectedDate,
  });

  const { data: dailyPayments = [], isLoading: paymentsLoading, error: paymentsError } = useQuery({
    queryKey: ['/api/payments', selectedDate],
    queryFn: () => apiRequest("GET", `/api/payments?startDate=${selectedDate}&endDate=${selectedDate}`),
    enabled: !!selectedDate,
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

  const formattedDate = format(new Date(selectedDate), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

  const handleCloseCash = () => {
    setCashClosed(true);
    setIsCashClosingOpen(false);
    toast({
      title: "Caja cerrada",
      description: `Caja cerrada exitosamente para el ${formattedDate}`,
    });
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
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmar Cierre de Caja</DialogTitle>
                    <DialogDescription>
                      ¿Estás seguro que deseas cerrar la caja para el {formattedDate}?
                      Esta acción marcará el día como finalizado.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Ingresos totales:</span>
                      <span className="text-green-600 font-bold">${netIncome.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Gastos totales:</span>
                      <span className="text-red-600 font-bold">${totalExpenses.toFixed(2)}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Balance final:</span>
                      <span className={`text-xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${netBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={() => setIsCashClosingOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCloseCash}>
                      Confirmar Cierre
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
                <Button size="sm" className="flex items-center space-x-2" data-testid="button-new-expense">
                  <Plus className="h-4 w-4" />
                  <span>Nuevo Gasto</span>
                </Button>
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
