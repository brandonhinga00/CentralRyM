import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AiSummaryProps {
  date?: string;
}

export default function AiSummary({ date }: AiSummaryProps) {
  // AiSummary shows weekly summary, not daily, so date is not used currently
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className="material-icons text-primary">psychology</span>
          <span>Resumen Inteligente de la Semana</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="space-y-3 text-sm">
            <p className="text-foreground">
              <strong>📈 Resumen de la semana:</strong> Tus productos estrella fueron <strong>Coca Cola 500ml</strong> y <strong>Pan Lactal</strong>. 
              La ganancia estimada fue de <strong>$245,670</strong>, un <span className="text-green-600 font-medium">15% más</span> que la semana pasada.
            </p>
            
            <p className="text-foreground">
              <strong>🎯 Dato curioso:</strong> Noté que la venta de helados aumenta significativamente los viernes por la tarde. 
              Te sugiero tener más stock para el próximo fin de semana.
            </p>
            
            <p className="text-foreground">
              <strong>💰 Fiados:</strong> María González y Juan Rodríguez representan el 45% de tu cartera de fiados. 
              Considera un seguimiento más frecuente con estos clientes.
            </p>
          </div>
          
          <div className="mt-4 flex space-x-3">
            <Button 
              className="flex items-center space-x-2"
              data-testid="button-full-analysis"
            >
              <span className="material-icons text-sm">trending_up</span>
              <span>Ver Análisis Completo</span>
            </Button>
            <Button 
              variant="outline"
              className="flex items-center space-x-2"
              data-testid="button-generate-shopping-list"
            >
              <span className="material-icons text-sm">local_shipping</span>
              <span>Generar Lista de Compras</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
