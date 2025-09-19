import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function TopDebtors() {
  const { data: debtors, isLoading } = useQuery({
    queryKey: ['/api/dashboard/top-debtors'],
    retry: false,
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      'bg-primary text-primary-foreground',
      'bg-secondary text-secondary-foreground',
      'bg-accent text-accent-foreground',
    ];
    return colors[index % colors.length];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span className="material-icons">account_balance_wallet</span>
            <span>Deudores Principales</span>
          </CardTitle>
          <span className="text-sm text-muted-foreground" data-testid="text-debtors-count">
            {(debtors as any[])?.length || 0} clientes
          </span>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg animate-pulse">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-10 h-10 bg-background rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-background rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-background rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-background rounded w-16 mb-2"></div>
                    <div className="h-3 bg-background rounded w-12"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : debtors && (debtors as any[]).length > 0 ? (
            (debtors as any[]).slice(0, 10).map((debtor: any, index: number) => (
              <div key={debtor.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${getAvatarColor(index)}`}>
                    {getInitials(debtor.name)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{debtor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Deuda actual: ${Number(debtor.currentDebt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-red-600">
                    ${Number(debtor.currentDebt).toLocaleString()}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="block mt-1 text-xs text-primary hover:underline p-0 h-auto"
                    data-testid={`button-collect-${debtor.id}`}
                  >
                    Cobrar
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <span className="material-icons text-4xl opacity-50 mb-2 block">account_balance_wallet</span>
              <p>No hay deudores registrados.</p>
              <p className="text-sm">Los clientes con fiados aparecerán aquí.</p>
            </div>
          )}
        </div>
        
        <Button
          variant="outline"
          className="w-full mt-4"
          data-testid="button-view-all-debtors"
        >
          Ver Todos los Deudores
        </Button>
      </CardContent>
    </Card>
  );
}
