import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function ApiStatus() {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/dashboard/summary', today],
    retry: false,
  });

  // Get API keys to find last usage
  const { data: apiKeys, isLoading: apiKeysLoading } = useQuery({
    queryKey: ['/api/api-keys'],
    retry: false,
  });

  const isLoading = summaryLoading || apiKeysLoading;

  const apiSalesCount = (summary as any)?.apiSalesCount || 0;
  
  // Find most recent API usage
  const getLastSyncText = () => {
    if (!apiKeys || !(apiKeys as any[]).length) {
      return "API no configurada";
    }
    
    const activeKey = (apiKeys as any[]).find((key: any) => key.isActive && key.lastUsed);
    if (!activeKey?.lastUsed) {
      return "sin sincronización";
    }
    
    try {
      return formatDistanceToNow(new Date(activeKey.lastUsed), { 
        addSuffix: true, 
        locale: es 
      });
    } catch {
      return "fecha inválida";
    }
  };
  
  const lastSync = getLastSyncText();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className="material-icons text-primary">api</span>
          <span>Estado del Asistente Móvil</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-muted rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-background rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-background rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="font-medium text-green-800">API Conectada</span>
            </div>
            <p className="text-sm text-green-600" data-testid="text-last-sync">
              Última sincronización: {lastSync}
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="material-icons text-blue-600 text-lg">sync</span>
              <span className="font-medium text-blue-800">Ventas Hoy via API</span>
            </div>
            <p className="text-lg font-bold text-blue-800" data-testid="text-api-sales-today">
              {apiSalesCount} ventas
            </p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="material-icons text-purple-600 text-lg">smartphone</span>
              <span className="font-medium text-purple-800">Consultas de Stock</span>
            </div>
            <p className="text-lg font-bold text-purple-800" data-testid="text-stock-queries">
              {apiKeys && (apiKeys as any[]).some((k: any) => k.isActive && k.lastUsed) ? "consultas activas" : "sin consultas"}
            </p>
          </div>
          </div>
        )}
        
        <div className="mt-4">
          <Button 
            variant="outline"
            className="flex items-center space-x-2"
            data-testid="button-configure-api"
          >
            <span className="material-icons text-sm">settings</span>
            <span>Configurar API</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
