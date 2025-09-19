import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useLocation } from "wouter";

export default function DailySales() {
  const [, navigate] = useLocation();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['/api/dashboard/recent-sales', today],
    retry: false,
  });

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'efectivo':
        return 'bg-green-500';
      case 'transferencia':
        return 'bg-blue-500';
      case 'fiado':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span className="material-icons">shopping_cart</span>
            <span>Ventas del Día</span>
          </CardTitle>
          <span className="text-sm text-muted-foreground" data-testid="text-sales-count">
            {(salesData as any[])?.length || 0} ventas
          </span>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg animate-pulse">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-2 h-2 bg-background rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-background rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-background rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-background rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : salesData && (salesData as any[]).length > 0 ? (
            (salesData as any[]).map((sale: any) => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${getPaymentMethodColor(sale.paymentMethod)}`}></div>
                  <div>
                    <p className="font-medium text-foreground">
                      {sale.saleItems?.map((item: any) => `${item.product?.name} x${item.quantity}`).join(', ') || 'Venta'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {sale.paymentMethod === 'efectivo' ? 'Efectivo' :
                       sale.paymentMethod === 'transferencia' ? 'Transferencia' :
                       `Fiado${sale.customer ? ` (${sale.customer.name})` : ''}`} • {formatTime(sale.createdAt)}
                    </p>
                  </div>
                </div>
                <span className="font-medium text-foreground">
                  ${Number(sale.totalAmount).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <span className="material-icons text-4xl opacity-50 mb-2 block">shopping_cart</span>
              <p>No hay ventas registradas hoy.</p>
              <p className="text-sm">Las ventas aparecerán aquí automáticamente.</p>
            </div>
          )}
        </div>
        
        <Button
          variant="outline"
          className="w-full mt-4"
          data-testid="button-view-all-sales"
          onClick={() => navigate("/carga-diaria")}
        >
          Ver Todas las Ventas
        </Button>
      </CardContent>
    </Card>
  );
}
