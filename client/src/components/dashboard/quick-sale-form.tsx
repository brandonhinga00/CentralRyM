import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function QuickSaleForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Search products
  const { data: products } = useQuery({
    queryKey: ["/api/products/search", productSearch],
    queryFn: async () => {
      const response = await fetch(
        `/api/products/search?q=${encodeURIComponent(productSearch)}`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) {
        throw new Error("Error al buscar productos");
      }
      return response.json();
    },
    enabled: productSearch.length > 2,
    retry: false,
  });

  // Search customers
  const { data: customers } = useQuery({
    queryKey: ["/api/customers/search", customerSearch],
    queryFn: async () => {
      const response = await fetch(
        `/api/customers/search?q=${encodeURIComponent(customerSearch)}`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) {
        throw new Error("Error al buscar clientes");
      }
      return response.json();
    },
    enabled: customerSearch.length > 2 && paymentMethod === "fiado",
    retry: false,
  });

  const createSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      return await apiRequest("POST", "/api/sales", saleData);
    },
    onSuccess: () => {
      toast({
        title: "Venta registrada",
        description: "La venta se registró exitosamente.",
      });
      // Reset form
      setProductSearch("");
      setCustomerSearch("");
      setQuantity("1");
      setPaymentMethod("");
      setSelectedProduct(null);
      setSelectedCustomer(null);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/dashboard/recent-sales"],
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Tu sesión ha expirado. Redirigiendo...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "No se pudo registrar la venta.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Form submission data:", {
      selectedProduct,
      paymentMethod,
      quantity,
      selectedCustomer,
      productSearch,
      customerSearch,
    });

    if (!selectedProduct || !paymentMethod || !quantity) {
      console.log("Validation failed:", {
        hasProduct: !!selectedProduct,
        hasPaymentMethod: !!paymentMethod,
        hasQuantity: !!quantity,
      });
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "fiado" && !selectedCustomer) {
      toast({
        title: "Error",
        description: "Para ventas fiadas debes seleccionar un cliente.",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = Number(selectedProduct.salePrice) * Number(quantity);

    const saleData = {
      sale: {
        saleDate: selectedDate,
        customerId: paymentMethod === "fiado" ? selectedCustomer?.id : null,
        paymentMethod,
        totalAmount: totalAmount.toString(),
        isPaid: paymentMethod !== "fiado",
        entryMethod: "manual",
      },
      items: [
        {
          productId: selectedProduct.id,
          quantity: quantity,
          unitPrice: selectedProduct.salePrice,
          totalPrice: totalAmount.toString(),
        },
      ],
    };

    createSaleMutation.mutate(saleData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span className="material-icons">add_shopping_cart</span>
            <span>Carga Rápida de Venta</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <span className="material-icons text-muted-foreground">today</span>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
              data-testid="input-sale-date"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product">Producto</Label>
              <div className="relative">
                <Input
                  id="product"
                  placeholder="Buscar producto..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pr-10"
                  data-testid="input-product-search"
                />
                <span className="absolute right-3 top-2.5 material-icons text-muted-foreground text-sm">
                  search
                </span>
              </div>
              {products && (products as any[]).length > 0 && (
                <div className="mt-1 border border-border rounded-md bg-card max-h-32 overflow-y-auto">
                  {(products as any[]).map((product: any) => (
                    <button
                      key={product.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                      onClick={() => {
                        setSelectedProduct(product);
                        setProductSearch(product.name);
                      }}
                      data-testid={`option-product-${product.id}`}
                    >
                      {product.name} - ${product.salePrice}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                data-testid="input-quantity"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment-method">Método de Pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger data-testid="select-payment-method">
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="fiado">Fiado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="customer">Cliente (si es fiado)</Label>
              <div className="relative">
                <Input
                  id="customer"
                  placeholder="Nombre del cliente..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pr-10"
                  //disabled={paymentMethod !== "fiado"}
                  data-testid="input-customer-search"
                />
                <span className="absolute right-3 top-2.5 material-icons text-muted-foreground text-sm">
                  search
                </span>
              </div>
              {paymentMethod === "fiado" &&
                customers &&
                (customers as any[]).length > 0 && (
                  <div className="mt-1 border border-border rounded-md bg-card max-h-32 overflow-y-auto">
                    {(customers as any[]).map((customer: any) => (
                      <button
                        key={customer.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setCustomerSearch(customer.name);
                        }}
                        data-testid={`option-customer-${customer.id}`}
                      >
                        {customer.name}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              type="submit"
              className="flex-1 flex items-center justify-center space-x-2"
              disabled={createSaleMutation.isPending}
              data-testid="button-register-sale"
            >
              <span className="material-icons">add_shopping_cart</span>
              <span>
                {createSaleMutation.isPending
                  ? "Registrando..."
                  : "Registrar Venta"}
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="px-6 flex items-center space-x-2"
              data-testid="button-scan-barcode"
            >
              <span className="material-icons">qr_code_scanner</span>
              <span>Escanear</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
