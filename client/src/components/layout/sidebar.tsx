import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Panel Principal", href: "/", icon: "dashboard" },
  { name: "Carga Diaria", href: "/carga-diaria", icon: "today" },
  { name: "Productos", href: "/productos", icon: "inventory" },
  { name: "Clientes", href: "/clientes", icon: "people" },
  { name: "Proveedores", href: "/proveedores", icon: "local_shipping" },
  { name: "Finanzas", href: "/finanzas", icon: "account_balance" },
  { name: "API / Asistente", href: "/api-asistente", icon: "api" },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-sidebar-primary rounded-full flex items-center justify-center text-sidebar-primary-foreground font-bold text-lg">
            R&M
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">Sistema Central</h1>
            <p className="text-sm text-muted-foreground">R&M Store</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="material-icons text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted">
          <span className="material-icons text-muted-foreground">person</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Dueño R&M</p>
            <p className="text-xs text-muted-foreground">Administrador</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
