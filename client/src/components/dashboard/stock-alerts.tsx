import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function StockAlerts() {
  const [, navigate] = useLocation();
  
  const { data: lowStockProducts, isLoading } = useQuery({
    queryKey: ['/api/dashboard/low-stock'],
    retry: false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-orange-600">
          <span className="material-icons">warning</span>
          <span>Alertas de Stock</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3 bg-muted rounded-lg animate-pulse">
                  <div className="h-4 bg-background rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-background rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : lowStockProducts && (lowStockProducts as any[]).length > 0 ? (
            (lowStockProducts as any[]).map((product: any) => {
              const alertLevel = product.currentStock === 0 ? 'critical' : 
                               product.currentStock <= product.minStock ? 'low' : 'warning';
              
              const bgColor = alertLevel === 'critical' ? 'bg-red-50 border-red-200' :
                             alertLevel === 'low' ? 'bg-orange-50 border-orange-200' :
                             'bg-yellow-50 border-yellow-200';
              
              const textColor = alertLevel === 'critical' ? 'text-red-800' :
                               alertLevel === 'low' ? 'text-orange-800' :
                               'text-yellow-800';
              
              const iconColor = alertLevel === 'critical' ? 'text-red-600' :
                               alertLevel === 'low' ? 'text-orange-600' :
                               'text-yellow-600';

              return (
                <div key={product.id} className={`p-3 border rounded-lg ${bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${textColor}`}>{product.name}</p>
                      <p className={`text-sm ${textColor.replace('800', '600')}`}>
                        {alertLevel === 'critical' ? 'Sin stock' :
                         alertLevel === 'low' ? `Stock crítico: ${product.currentStock} unidades` :
                         `Stock bajo: ${product.currentStock} unidades`}
                      </p>
                    </div>
                    <span className={`material-icons ${iconColor}`}>
                      {alertLevel === 'critical' ? 'error' : 
                       alertLevel === 'low' ? 'warning' : 'info'}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <span className="material-icons text-4xl opacity-50 mb-2 block">inventory</span>
              <p className="text-sm">No hay alertas de stock.</p>
            </div>
          )}
        </div>
        
        <Button
          variant="outline"
          className="w-full mt-4"
          data-testid="button-view-all-products"
          onClick={() => navigate("/productos")}
        >
          Ver Todos los Productos
        </Button>
      </CardContent>
    </Card>
  );
}
