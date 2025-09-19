import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import crypto from "crypto";
import { 
  insertProductSchema,
  insertCustomerSchema,
  insertSaleSchema,
  insertSaleItemSchema,
  insertPaymentSchema,
  insertExpenseSchema,
  insertSupplierSchema,
  insertCategorySchema,
  insertApiKeySchema,
  insertCashClosingSchema
} from "@shared/schema";

// Middleware to validate API key for mobile assistant
const validateApiKey = async (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ message: "API key requerida" });
  }
  
  try {
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyRecord = await storage.getApiKeyByHash(hashedKey);
    
    if (!keyRecord) {
      return res.status(401).json({ message: "API key inválida" });
    }
    
    // Update last used timestamp
    await storage.updateApiKey(keyRecord.id, { lastUsed: new Date() });
    
    req.apiKey = keyRecord;
    next();
  } catch (error) {
    console.error("Error validating API key:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export async function registerRoutes(app: Express, needsHttpServer: boolean = false): Promise<Server | void> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Error al obtener usuario" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/summary/:date', isAuthenticated, async (req, res) => {
    try {
      const { date } = req.params;
      const summary = await storage.getDailySummary(date);
      res.json(summary);
    } catch (error) {
      console.error("Error getting daily summary:", error);
      res.status(500).json({ message: "Error al obtener resumen diario" });
    }
  });

  app.get('/api/dashboard/low-stock', isAuthenticated, async (req, res) => {
    try {
      const lowStockProducts = await storage.getLowStockProducts();
      res.json(lowStockProducts);
    } catch (error) {
      console.error("Error getting low stock products:", error);
      res.status(500).json({ message: "Error al obtener productos con stock bajo" });
    }
  });

  app.get('/api/dashboard/top-debtors', isAuthenticated, async (req, res) => {
    try {
      const debtors = await storage.getCustomersWithDebt();
      res.json(debtors.slice(0, 10)); // Top 10 debtors
    } catch (error) {
      console.error("Error getting top debtors:", error);
      res.status(500).json({ message: "Error al obtener principales deudores" });
    }
  });

  app.get('/api/customers/with-debt', isAuthenticated, async (req, res) => {
    try {
      const debtors = await storage.getCustomersWithDebt();
      res.json(debtors); // All customers with debt
    } catch (error) {
      console.error("Error getting customers with debt:", error);
      res.status(500).json({ message: "Error al obtener clientes con deuda" });
    }
  });

  app.get('/api/dashboard/recent-sales/:date', isAuthenticated, async (req, res) => {
    try {
      const { date } = req.params;
      const salesWithItems = await storage.getSalesWithItems(date, date);
      res.json(salesWithItems);
    } catch (error) {
      console.error("Error getting recent sales:", error);
      res.status(500).json({ message: "Error al obtener ventas recientes" });
    }
  });

  // Product routes
  app.get('/api/products', isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Error al obtener productos" });
    }
  });

  app.get('/api/products/search', isAuthenticated, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Parámetro de búsqueda requerido" });
      }
      const products = await storage.searchProducts(q);
      res.json(products);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ message: "Error al buscar productos" });
    }
  });

  app.get('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Error al obtener producto" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: "Error al crear producto" });
    }
  });

  app.put('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, productData);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(400).json({ message: "Error al actualizar producto" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Error al eliminar producto" });
    }
  });

  // Customer routes
  app.get('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Error al obtener clientes" });
    }
  });

  app.get('/api/customers/search', isAuthenticated, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Parámetro de búsqueda requerido" });
      }
      const customers = await storage.searchCustomers(q);
      res.json(customers);
    } catch (error) {
      console.error("Error searching customers:", error);
      res.status(500).json({ message: "Error al buscar clientes" });
    }
  });

  app.get('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Error al obtener cliente" });
    }
  });

  app.post('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(400).json({ message: "Error al crear cliente" });
    }
  });

  app.put('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, customerData);
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(400).json({ message: "Error al actualizar cliente" });
    }
  });

  app.delete('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Error al eliminar cliente" });
    }
  });

  // Sale routes
  app.get('/api/sales', isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const sales = await storage.getSalesWithItems(
        startDate as string,
        endDate as string
      );
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ message: "Error al obtener ventas" });
    }
  });

  app.post('/api/sales', isAuthenticated, async (req, res) => {
    try {
      const { sale, items } = req.body;
      const saleData = insertSaleSchema.parse(sale);
      const itemsData = z.array(insertSaleItemSchema).parse(items);
      
      const newSale = await storage.createSale(saleData, itemsData);
      res.status(201).json(newSale);
    } catch (error) {
      console.error("Error creating sale:", error);
      res.status(400).json({ message: "Error al crear venta" });
    }
  });

  // Payment routes
  app.get('/api/payments', isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate, customerId } = req.query;
      let payments;
      
      if (customerId) {
        payments = await storage.getPaymentsByCustomer(customerId as string);
      } else {
        payments = await storage.getPayments(
          startDate as string,
          endDate as string
        );
      }
      
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Error al obtener pagos" });
    }
  });

  app.post('/api/payments', isAuthenticated, async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      
      // Validate payment amount is positive
      const paymentAmount = Number(paymentData.amount);
      if (!isFinite(paymentAmount) || paymentAmount <= 0) {
        return res.status(400).json({ 
          message: "El monto del pago debe ser un número positivo válido" 
        });
      }
      
      // Validate overpayment prevention
      if (paymentData.customerId) {
        const customer = await storage.getCustomer(paymentData.customerId);
        if (customer) {
          const currentDebt = Number(customer.currentDebt || 0);
          
          if (paymentAmount > currentDebt) {
            return res.status(400).json({ 
              message: `El pago de $${paymentAmount.toFixed(2)} excede la deuda actual de $${currentDebt.toFixed(2)}` 
            });
          }
        }
      }
      
      const payment = await storage.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(400).json({ message: "Error al crear pago" });
    }
  });

  // Expense routes
  app.get('/api/expenses', isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const expenses = await storage.getExpenses(
        startDate as string,
        endDate as string
      );
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Error al obtener gastos" });
    }
  });

  app.post('/api/expenses', isAuthenticated, async (req, res) => {
    try {
      const expenseData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(400).json({ message: "Error al crear gasto" });
    }
  });

  // Cash closing routes
  app.get('/api/cash-closings', isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const cashClosings = await storage.getCashClosings(
        startDate as string,
        endDate as string
      );
      res.json(cashClosings);
    } catch (error) {
      console.error("Error fetching cash closings:", error);
      res.status(500).json({ message: "Error al obtener cierres de caja" });
    }
  });

  app.get('/api/cash-closings/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const cashClosing = await storage.getCashClosing(id);
      if (!cashClosing) {
        return res.status(404).json({ message: "Cierre de caja no encontrado" });
      }
      res.json(cashClosing);
    } catch (error) {
      console.error("Error fetching cash closing:", error);
      res.status(500).json({ message: "Error al obtener cierre de caja" });
    }
  });

  app.get('/api/cash-closings/by-date/:date', isAuthenticated, async (req, res) => {
    try {
      const { date } = req.params;
      const cashClosing = await storage.getCashClosingByDate(date);
      res.json(cashClosing);
    } catch (error) {
      console.error("Error fetching cash closing by date:", error);
      res.status(500).json({ message: "Error al obtener cierre de caja por fecha" });
    }
  });

  app.post('/api/cash-closings', isAuthenticated, async (req, res) => {
    try {
      // Security: Never trust client for closedBy - use authenticated user
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Check if closing already exists for this date
      const existingClosing = await storage.getCashClosingByDate(req.body.closingDate);
      if (existingClosing) {
        return res.status(409).json({ message: "Ya existe un cierre para esta fecha" });
      }

      // Remove closedBy from client data and set from server
      const { closedBy, ...clientData } = req.body;
      const cashClosingData = insertCashClosingSchema.parse({
        ...clientData,
        closedBy: userId
      });
      
      const cashClosing = await storage.createCashClosing(cashClosingData);
      res.status(201).json(cashClosing);
    } catch (error) {
      console.error("Error creating cash closing:", error);
      res.status(400).json({ message: "Error al crear cierre de caja" });
    }
  });

  // Supplier routes
  app.get('/api/suppliers', isAuthenticated, async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Error al obtener proveedores" });
    }
  });

  app.post('/api/suppliers', isAuthenticated, async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(400).json({ message: "Error al crear proveedor" });
    }
  });

  app.put('/api/suppliers/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const supplierData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(id, supplierData);
      res.json(supplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(400).json({ message: "Error al actualizar proveedor" });
    }
  });

  app.delete('/api/suppliers/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSupplier(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(400).json({ message: "Error al eliminar proveedor" });
    }
  });

  app.get('/api/purchase-suggestions', isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getProducts();
      const suggestions = products
        .filter(product => {
          const currentStock = product.currentStock ?? 0;
          const minStock = product.minStock ?? 0;
          return currentStock <= minStock;
        })
        .map(product => {
          const currentStock = product.currentStock ?? 0;
          const minStock = product.minStock ?? 0;
          const maxStock = product.maxStock ?? 0;
          return {
            ...product,
            suggestedQuantity: maxStock > 0 ? maxStock - currentStock : minStock * 2,
            priority: currentStock === 0 ? 'urgent' : 'normal' as const
          };
        });
      res.json(suggestions);
    } catch (error) {
      console.error("Error generating purchase suggestions:", error);
      res.status(500).json({ message: "Error al generar sugerencias de compra" });
    }
  });

  // Category routes
  app.get('/api/categories', isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Error al obtener categorías" });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(400).json({ message: "Error al crear categoría" });
    }
  });

  // API Key management routes
  app.get('/api/api-keys', isAuthenticated, async (req, res) => {
    try {
      const apiKeys = await storage.getApiKeys();
      // Don't return the actual hash for security
      const safeApiKeys = apiKeys.map(key => ({
        ...key,
        keyHash: undefined,
      }));
      res.json(safeApiKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ message: "Error al obtener claves API" });
    }
  });

  app.post('/api/api-keys', isAuthenticated, async (req, res) => {
    try {
      const { keyName, permissions } = req.body;
      
      // Generate a random API key
      const apiKey = crypto.randomBytes(32).toString('hex');
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      const apiKeyData = insertApiKeySchema.parse({
        keyName,
        keyHash,
        permissions,
        isActive: true,
      });
      
      const newApiKey = await storage.createApiKey(apiKeyData);
      
      // Return the plain key only once
      res.status(201).json({
        ...newApiKey,
        keyHash: undefined,
        plainKey: apiKey, // Only returned once
      });
    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(400).json({ message: "Error al crear clave API" });
    }
  });

  app.delete('/api/api-keys/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteApiKey(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ message: "Error al eliminar clave API" });
    }
  });

  // ======================
  // MOBILE ASSISTANT API ROUTES
  // ======================

  // Check API key status
  app.get('/api/mobile/status', validateApiKey, (req, res) => {
    res.json({ 
      status: 'active',
      message: 'API funcionando correctamente',
      timestamp: new Date().toISOString()
    });
  });

  // Get product stock by barcode or name
  app.get('/api/mobile/products/stock', validateApiKey, async (req, res) => {
    try {
      const { barcode, name } = req.query;
      
      if (!barcode && !name) {
        return res.status(400).json({ message: "Se requiere código de barras o nombre del producto" });
      }
      
      let product;
      if (barcode) {
        product = await storage.getProductByBarcode(barcode as string);
      } else if (name) {
        const products = await storage.searchProducts(name as string);
        product = products[0]; // Take first match
      }
      
      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      
      res.json({
        product: {
          id: product.id,
          name: product.name,
          currentStock: product.currentStock,
          salePrice: product.salePrice,
          unit: product.unit,
        }
      });
    } catch (error) {
      console.error("Error getting product stock:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get customer debt
  app.get('/api/mobile/customers/debt', validateApiKey, async (req, res) => {
    try {
      const { name } = req.query;
      
      if (!name) {
        return res.status(400).json({ message: "Se requiere nombre del cliente" });
      }
      
      const customers = await storage.searchCustomers(name as string);
      const customer = customers[0]; // Take first match
      
      if (!customer) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }
      
      res.json({
        customer: {
          id: customer.id,
          name: customer.name,
          currentDebt: customer.currentDebt,
          creditLimit: customer.creditLimit,
        }
      });
    } catch (error) {
      console.error("Error getting customer debt:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get all debtors
  app.get('/api/mobile/customers/debtors', validateApiKey, async (req, res) => {
    try {
      const debtors = await storage.getCustomersWithDebt();
      res.json({
        debtors: debtors.map(customer => ({
          id: customer.id,
          name: customer.name,
          currentDebt: customer.currentDebt,
        }))
      });
    } catch (error) {
      console.error("Error getting debtors:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Register a new sale
  app.post('/api/mobile/sales', validateApiKey, async (req, res) => {
    try {
      const { 
        customerName, 
        paymentMethod, 
        items, 
        saleDate 
      } = req.body;
      
      if (!paymentMethod || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Datos de venta incompletos" });
      }
      
      let customerId = null;
      
      // Find customer if payment method is fiado
      if (paymentMethod === 'fiado') {
        if (!customerName) {
          return res.status(400).json({ message: "Nombre del cliente requerido para ventas fiadas" });
        }
        
        const customers = await storage.searchCustomers(customerName);
        const customer = customers[0];
        
        if (!customer) {
          return res.status(404).json({ message: "Cliente no encontrado" });
        }
        
        customerId = customer.id;
      }
      
      // Validate products and calculate total
      let totalAmount = 0;
      const saleItems = [];
      
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(404).json({ message: `Producto ${item.productId} no encontrado` });
        }
        
        if ((product.currentStock || 0) < item.quantity) {
          return res.status(400).json({ 
            message: `Stock insuficiente para ${product.name}. Stock actual: ${product.currentStock}` 
          });
        }
        
        const itemTotal = Number(product.salePrice) * Number(item.quantity);
        totalAmount += itemTotal;
        
        saleItems.push({
          productId: item.productId,
          quantity: Number(item.quantity).toString(),
          unitPrice: Number(product.salePrice).toString(),
          totalPrice: itemTotal.toString(),
        });
      }
      
      // Create sale
      const saleData = {
        saleDate: saleDate || new Date().toISOString().split('T')[0],
        customerId,
        paymentMethod,
        totalAmount: totalAmount.toString(),
        isPaid: paymentMethod !== 'fiado',
        entryMethod: 'api',
        notes: 'Venta registrada desde asistente móvil',
      };
      
      const sale = await storage.createSale(saleData, saleItems);
      
      res.status(201).json({
        sale: {
          id: sale.id,
          totalAmount: sale.totalAmount,
          paymentMethod: sale.paymentMethod,
          customerName: customerName || null,
        },
        message: 'Venta registrada exitosamente'
      });
    } catch (error) {
      console.error("Error creating mobile sale:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Register a payment
  app.post('/api/mobile/payments', validateApiKey, async (req, res) => {
    try {
      const { customerName, amount, paymentMethod, paymentDate } = req.body;
      
      if (!customerName || !amount || !paymentMethod) {
        return res.status(400).json({ message: "Datos de pago incompletos" });
      }
      
      // Find customer
      const customers = await storage.searchCustomers(customerName);
      const customer = customers[0];
      
      if (!customer) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }
      
      if (Number(amount) > Number(customer.currentDebt)) {
        return res.status(400).json({ 
          message: `El monto supera la deuda actual de $${customer.currentDebt}` 
        });
      }
      
      const paymentData = {
        customerId: customer.id,
        amount: amount.toString(),
        paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        paymentMethod,
        entryMethod: 'api',
        notes: 'Pago registrado desde asistente móvil',
      };
      
      const payment = await storage.createPayment(paymentData);
      
      res.status(201).json({
        payment: {
          id: payment.id,
          amount: payment.amount,
          customerName: customer.name,
          remainingDebt: Number(customer.currentDebt) - Number(amount),
        },
        message: 'Pago registrado exitosamente'
      });
    } catch (error) {
      console.error("Error creating mobile payment:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Update product stock
  app.patch('/api/mobile/products/:id/stock', validateApiKey, async (req, res) => {
    try {
      const { id } = req.params;
      const { stock, reason } = req.body;
      
      if (typeof stock !== 'number') {
        return res.status(400).json({ message: "Stock debe ser un número" });
      }
      
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      
      const updatedProduct = await storage.updateProductStock(id, stock);
      
      // Create stock movement record
      await storage.createStockMovement({
        productId: id,
        movementType: 'adjustment',
        quantity: (stock - Number(product.currentStock || 0)).toString(),
        reason: reason || 'Ajuste desde asistente móvil',
      });
      
      res.json({
        product: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          previousStock: product.currentStock,
          newStock: updatedProduct.currentStock,
        },
        message: 'Stock actualizado exitosamente'
      });
    } catch (error) {
      console.error("Error updating product stock:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get simple sales report
  app.get('/api/mobile/reports/sales', validateApiKey, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const sales = await storage.getSales(
        startDate as string,
        endDate as string
      );
      
      const totalSales = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      const cashSales = sales.filter(s => s.paymentMethod === 'efectivo').reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      const transferSales = sales.filter(s => s.paymentMethod === 'transferencia').reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      const creditSales = sales.filter(s => s.paymentMethod === 'fiado').reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      
      res.json({
        period: {
          startDate: startDate || 'Sin límite',
          endDate: endDate || 'Sin límite',
        },
        summary: {
          totalSales,
          salesCount: sales.length,
          cashSales,
          transferSales,
          creditSales,
        }
      });
    } catch (error) {
      console.error("Error getting sales report:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Only create HTTP server if needed (for development HMR)
  if (needsHttpServer) {
    const httpServer = createServer(app);
    return httpServer;
  }
  
  // In production, return void - Express app will be used directly
  return;
}
