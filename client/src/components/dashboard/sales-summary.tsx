import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

export default function SalesSummary() {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const { data: summary, isLoading } = useQuery({
    queryKey: ['/api/dashboard/summary', today],
    retry: false,
  });

  if (isLoading) {
    return (
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
    );
  }

  const summaryData = summary as any || {
    totalSales: 0,
    creditGiven: 0,
    debtCollected: 0,
    salesCount: 0,
  };

  const balance = (summaryData.totalSales || 0) + (summaryData.debtCollected || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ventas del Día</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-daily-sales">
                ${summaryData.totalSales?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="material-icons text-green-600">trending_up</span>
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">
            {summaryData.salesCount || 0} operaciones
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Fiado Otorgado</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-credit-given">
                ${summaryData.creditGiven?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="material-icons text-orange-600">credit_card</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Ventas a crédito</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Deudas Cobradas</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-debt-collected">
                ${summaryData.debtCollected?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="material-icons text-blue-600">payments</span>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">Pagos recibidos</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Balance del Día</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-daily-balance">
                ${balance?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="material-icons text-green-600">account_balance_wallet</span>
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">Ingresos totales</p>
        </CardContent>
      </Card>
    </div>
  );
}
