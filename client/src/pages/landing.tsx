import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, TrendingUp, Users, Smartphone } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg">
                R&M
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Sistema Central R&M</h1>
                <p className="text-sm text-muted-foreground">R&M Store - Córdoba, Argentina</p>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = "/api/login"}
              size="lg"
              data-testid="button-login"
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Gestión Integral para Tu Negocio
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              El sistema completo para administrar ventas, inventario, clientes y finanzas de tu kiosco. 
              Con API segura para tu asistente móvil y análisis inteligentes.
            </p>
            <Button 
              size="lg" 
              className="text-lg px-8 py-4"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-get-started"
            >
              Comenzar Ahora
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-foreground mb-12">
            Funcionalidades Principales
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Gestión de Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Carga rápida de ventas con control automático de stock y soporte para fiados.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Control de Inventario</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Gestión completa de productos con alertas inteligentes de stock bajo.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Cuentas Corrientes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Administración de clientes y fiados con libreta virtual y seguimiento de pagos.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>API Móvil</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  API segura para integración con asistente móvil y consultas en tiempo real.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
              R&M
            </div>
            <span className="text-lg font-semibold">Sistema Central R&M</span>
          </div>
          <p className="text-gray-400">
            Desarrollado especialmente para R&M Store, Córdoba, Argentina
          </p>
        </div>
      </footer>
    </div>
  );
}
