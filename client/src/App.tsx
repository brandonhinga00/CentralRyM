import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import DailyEntry from "@/pages/daily-entry";
import Products from "@/pages/products";
import Customers from "@/pages/customers";
import Suppliers from "@/pages/suppliers";
import Finances from "@/pages/finances";
import ApiStatus from "@/pages/api-status";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/carga-diaria" component={DailyEntry} />
          <Route path="/productos" component={Products} />
          <Route path="/clientes" component={Customers} />
          <Route path="/proveedores" component={Suppliers} />
          <Route path="/finanzas" component={Finances} />
          <Route path="/api-asistente" component={ApiStatus} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
