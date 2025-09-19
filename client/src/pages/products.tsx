import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Package, Plus, Search, Edit, Trash2, AlertTriangle } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  barcode: z.string().optional(),
  category: z.string().min(1, "La categoría es requerida"),
  costPrice: z.string().min(1, "El precio de compra es requerido"),
  salePrice: z.string().min(1, "El precio de venta es requerido"),
  currentStock: z.string().min(1, "El stock actual es requerido"),
  minStock: z.string().min(1, "El stock mínimo es requerido"),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function Products() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load products
  const { data: products, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ["/api/products"],
    enabled: isAuthenticated,
  });

  // Load low stock products
  const { data: lowStockProducts, isLoading: lowStockLoading } = useQuery({
    queryKey: ["/api/products/low-stock"],
    enabled: isAuthenticated,
  });

  const filteredProducts = products ? (products as any[]).filter((product: any) => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm))
  ) : [];

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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="border-b bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Gestión de Productos</h2>
              <p className="text-muted-foreground">Administra tu inventario y control de stock</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2" data-testid="button-new-product">
                  <Plus className="h-4 w-4" />
                  <span>Nuevo Producto</span>
                </Button>
              </DialogTrigger>
              <ProductFormDialog onClose={() => setIsDialogOpen(false)} />
            </Dialog>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Búsqueda y Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar productos por nombre o código..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search-products"
                  />
                </div>
                <Button variant="outline" data-testid="button-filter">
                  Filtros
                </Button>
                <Button variant="outline" data-testid="button-import">
                  Importar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Alertas de Stock */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                <span>Productos con Stock Bajo</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockLoading ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Cargando alertas de stock...</p>
                  </div>
                ) : lowStockProducts && (lowStockProducts as any[]).length > 0 ? (
                  (lowStockProducts as any[]).map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">Stock: {product.currentStock} (Mínimo: {product.minStock})</p>
                      </div>
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay productos con stock bajo.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Productos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Todos los Productos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Cargando productos...</p>
                  </div>
                ) : productsError ? (
                  <div className="text-center py-8 text-red-500">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Error al cargar productos</p>
                    <p className="text-sm">{String(productsError)}</p>
                  </div>
                ) : !filteredProducts.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay productos registrados aún.</p>
                    <p className="text-sm">Comienza agregando tu primer producto.</p>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="mt-4" data-testid="button-add-first-product">
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Primer Producto
                        </Button>
                      </DialogTrigger>
                      <ProductFormDialog onClose={() => setIsDialogOpen(false)} />
                    </Dialog>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredProducts.map((product: any) => (
                      <div key={product.id} className="border rounded-lg p-4" data-testid={`product-item-${product.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-sm" data-testid={`product-name-${product.id}`}>{product.name}</h3>
                            <div className="text-xs text-muted-foreground space-y-1 mt-1">
                              {product.barcode && (
                                <p data-testid={`product-barcode-${product.id}`}>Código: {product.barcode}</p>
                              )}
                              <p data-testid={`product-stock-${product.id}`}>Stock: {product.currentStock}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm" data-testid={`product-price-${product.id}`}>${product.salePrice}</p>
                            <p className="text-xs text-muted-foreground">Costo: ${product.costPrice || 'N/A'}</p>
                          </div>
                          <div className="ml-4 flex space-x-2">
                            <Button variant="outline" size="sm" data-testid={`button-edit-product-${product.id}`}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" data-testid={`button-delete-product-${product.id}`}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function ProductFormDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      barcode: "",
      category: "",
      costPrice: "",
      salePrice: "",
      currentStock: "",
      minStock: "",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Error al crear el producto");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Producto creado",
        description: "El producto se ha creado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear el producto",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    console.log("Form data submitted:", data);
    console.log("Form errors:", form.formState.errors);
    
    // Transform the data to match backend schema
    const transformedData = {
      name: data.name,
      barcode: data.barcode || undefined,
      categoryId: null, // For now, we'll set category handling later
      costPrice: data.costPrice,
      salePrice: data.salePrice,
      currentStock: data.currentStock,
      minStock: data.minStock,
    };
    
    console.log("Transformed data:", transformedData);
    createProductMutation.mutate(transformedData);
  };

  return (
    <DialogContent className="sm:max-w-[500px]" data-testid="dialog-product-form">
      <DialogHeader>
        <DialogTitle>Nuevo Producto</DialogTitle>
        <DialogDescription>
          Completa la información del producto para agregarlo al inventario.
        </DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Producto</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: Coca Cola 500ml" 
                    data-testid="input-product-name"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="barcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código de Barras (Opcional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: 7790001234567" 
                    data-testid="input-product-barcode"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: Bebidas, Golosinas, etc." 
                    data-testid="input-product-category"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="costPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio de Compra</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="150.00" 
                      data-testid="input-product-cost-price"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="salePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio de Venta</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="200.00" 
                      data-testid="input-product-sale-price"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="currentStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Actual</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="20" 
                      data-testid="input-product-current-stock"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="minStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Mínimo</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="5" 
                      data-testid="input-product-min-stock"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              data-testid="button-cancel-product"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createProductMutation.isPending}
              data-testid="button-save-product"
            >
              {createProductMutation.isPending ? "Guardando..." : "Guardar Producto"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}
