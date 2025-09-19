import {
  users,
  suppliers,
  categories,
  products,
  customers,
  sales,
  saleItems,
  payments,
  expenses,
  stockMovements,
  apiKeys,
  type User,
  type UpsertUser,
  type InsertSupplier,
  type Supplier,
  type InsertCategory,
  type Category,
  type InsertProduct,
  type Product,
  type InsertCustomer,
  type Customer,
  type InsertSale,
  type Sale,
  type InsertSaleItem,
  type SaleItem,
  type InsertPayment,
  type Payment,
  type InsertExpense,
  type Expense,
  type InsertStockMovement,
  type StockMovement,
  type InsertApiKey,
  type ApiKey,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, sql, and, gte, lte, like, ne } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Supplier operations
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: string): Promise<void>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  searchProducts(query: string): Promise<Product[]>;
  getLowStockProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  updateProductStock(id: string, newStock: number): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  searchCustomers(query: string): Promise<Customer[]>;
  getCustomersWithDebt(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  updateCustomerDebt(id: string, newDebt: number): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;

  // Sale operations
  getSales(startDate?: string, endDate?: string): Promise<Sale[]>;
  getSalesWithItems(startDate?: string, endDate?: string): Promise<(Sale & { saleItems: (SaleItem & { product: Product })[] })[]>;
  getSale(id: string): Promise<Sale | undefined>;
  getSalesByCustomer(customerId: string): Promise<Sale[]>;
  createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<Sale>;
  updateSale(id: string, sale: Partial<InsertSale>): Promise<Sale>;
  deleteSale(id: string): Promise<void>;

  // Payment operations
  getPayments(startDate?: string, endDate?: string): Promise<Payment[]>;
  getPaymentsByCustomer(customerId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment>;
  deletePayment(id: string): Promise<void>;

  // Expense operations
  getExpenses(startDate?: string, endDate?: string): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;

  // Stock movement operations
  getStockMovements(productId?: string, startDate?: string, endDate?: string): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;

  // API key operations
  getApiKeys(): Promise<ApiKey[]>;
  getApiKeyByHash(hash: string): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: string, apiKey: Partial<InsertApiKey>): Promise<ApiKey>;
  deleteApiKey(id: string): Promise<void>;

  // Dashboard operations
  getDailySummary(date: string): Promise<{
    totalSales: number;
    creditGiven: number;
    debtCollected: number;
    totalExpenses: number;
    salesCount: number;
    apiSalesCount: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Supplier operations
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(asc(suppliers.name));
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const [updatedSupplier] = await db
      .update(suppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return updatedSupplier;
  }

  async deleteSupplier(id: string): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true)).orderBy(asc(products.name));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.barcode, barcode));
    return product;
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          like(products.name, `%${query}%`)
        )
      )
      .orderBy(asc(products.name))
      .limit(20);
  }

  async getLowStockProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          sql`${products.currentStock} <= ${products.minStock}`
        )
      )
      .orderBy(asc(products.currentStock));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async updateProductStock(id: string, newStock: number): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ currentStock: newStock, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.isActive, true)).orderBy(asc(customers.name));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.isActive, true),
          like(customers.name, `%${query}%`)
        )
      )
      .orderBy(asc(customers.name))
      .limit(20);
  }

  async getCustomersWithDebt(): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.isActive, true),
          sql`${customers.currentDebt} > 0`
        )
      )
      .orderBy(desc(customers.currentDebt));
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async updateCustomerDebt(id: string, newDebt: number): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ currentDebt: newDebt.toString(), updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.update(customers).set({ isActive: false }).where(eq(customers.id, id));
  }

  // Sale operations
  async getSales(startDate?: string, endDate?: string): Promise<Sale[]> {
    let query = db.select().from(sales);
    
    if (startDate || endDate) {
      const conditions = [];
      if (startDate) conditions.push(gte(sales.saleDate, startDate));
      if (endDate) conditions.push(lte(sales.saleDate, endDate));
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(sales.saleDate), desc(sales.createdAt));
  }

  async getSalesWithItems(startDate?: string, endDate?: string): Promise<(Sale & { saleItems: (SaleItem & { product: Product })[] })[]> {
    let salesQuery = db.select().from(sales);
    
    if (startDate || endDate) {
      const conditions = [];
      if (startDate) conditions.push(gte(sales.saleDate, startDate));
      if (endDate) conditions.push(lte(sales.saleDate, endDate));
      salesQuery = salesQuery.where(and(...conditions));
    }
    
    const salesData = await salesQuery.orderBy(desc(sales.saleDate), desc(sales.createdAt));
    
    const salesWithItems = await Promise.all(
      salesData.map(async (sale) => {
        const items = await db
          .select({
            id: saleItems.id,
            saleId: saleItems.saleId,
            productId: saleItems.productId,
            quantity: saleItems.quantity,
            unitPrice: saleItems.unitPrice,
            totalPrice: saleItems.totalPrice,
            createdAt: saleItems.createdAt,
            product: products,
          })
          .from(saleItems)
          .innerJoin(products, eq(saleItems.productId, products.id))
          .where(eq(saleItems.saleId, sale.id));
        
        return { ...sale, saleItems: items };
      })
    );
    
    return salesWithItems;
  }

  async getSale(id: string): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale;
  }

  async getSalesByCustomer(customerId: string): Promise<Sale[]> {
    return await db
      .select()
      .from(sales)
      .where(eq(sales.customerId, customerId))
      .orderBy(desc(sales.saleDate));
  }

  async createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<Sale> {
    return await db.transaction(async (tx) => {
      const [newSale] = await tx.insert(sales).values(sale).returning();
      
      // Insert sale items
      const saleItemsWithSaleId = items.map(item => ({ ...item, saleId: newSale.id }));
      await tx.insert(saleItems).values(saleItemsWithSaleId);
      
      // Update stock for each product
      for (const item of items) {
        await tx
          .update(products)
          .set({
            currentStock: sql`${products.currentStock} - ${Number(item.quantity)}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
        
        // Create stock movement
        await tx.insert(stockMovements).values({
          productId: item.productId,
          movementType: 'sale',
          quantity: (-Number(item.quantity)).toString(),
          reason: `Venta #${newSale.id}`,
          referenceId: newSale.id,
        });
      }
      
      // Update customer debt if payment method is fiado
      if (sale.paymentMethod === 'fiado' && sale.customerId) {
        await tx
          .update(customers)
          .set({
            currentDebt: sql`${customers.currentDebt} + ${Number(sale.totalAmount)}`,
            updatedAt: new Date(),
          })
          .where(eq(customers.id, sale.customerId));
      }
      
      return newSale;
    });
  }

  async updateSale(id: string, sale: Partial<InsertSale>): Promise<Sale> {
    const [updatedSale] = await db
      .update(sales)
      .set({ ...sale, updatedAt: new Date() })
      .where(eq(sales.id, id))
      .returning();
    return updatedSale;
  }

  async deleteSale(id: string): Promise<void> {
    await db.delete(sales).where(eq(sales.id, id));
  }

  // Payment operations
  async getPayments(startDate?: string, endDate?: string): Promise<Payment[]> {
    let query = db.select().from(payments);
    
    if (startDate || endDate) {
      const conditions = [];
      if (startDate) conditions.push(gte(payments.paymentDate, startDate));
      if (endDate) conditions.push(lte(payments.paymentDate, endDate));
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(payments.paymentDate), desc(payments.createdAt));
  }

  async getPaymentsByCustomer(customerId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.customerId, customerId))
      .orderBy(desc(payments.paymentDate));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    return await db.transaction(async (tx) => {
      const [newPayment] = await tx.insert(payments).values(payment).returning();
      
      // Update customer debt
      await tx
        .update(customers)
        .set({
          currentDebt: sql`${customers.currentDebt} - ${Number(payment.amount)}`,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, payment.customerId));
      
      return newPayment;
    });
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment> {
    const [updatedPayment] = await db
      .update(payments)
      .set(payment)
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  async deletePayment(id: string): Promise<void> {
    await db.delete(payments).where(eq(payments.id, id));
  }

  // Expense operations
  async getExpenses(startDate?: string, endDate?: string): Promise<Expense[]> {
    let query = db.select().from(expenses);
    
    if (startDate || endDate) {
      const conditions = [];
      if (startDate) conditions.push(gte(expenses.expenseDate, startDate));
      if (endDate) conditions.push(lte(expenses.expenseDate, endDate));
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(expenses.expenseDate), desc(expenses.createdAt));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense> {
    const [updatedExpense] = await db
      .update(expenses)
      .set(expense)
      .where(eq(expenses.id, id))
      .returning();
    return updatedExpense;
  }

  async deleteExpense(id: string): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  // Stock movement operations
  async getStockMovements(productId?: string, startDate?: string, endDate?: string): Promise<StockMovement[]> {
    let query = db.select().from(stockMovements);
    
    const conditions = [];
    if (productId) conditions.push(eq(stockMovements.productId, productId));
    if (startDate) conditions.push(gte(stockMovements.createdAt, new Date(startDate)));
    if (endDate) conditions.push(lte(stockMovements.createdAt, new Date(endDate)));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(stockMovements.createdAt));
  }

  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    const [newMovement] = await db.insert(stockMovements).values(movement).returning();
    return newMovement;
  }

  // API key operations
  async getApiKeys(): Promise<ApiKey[]> {
    return await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
  }

  async getApiKeyByHash(hash: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(and(eq(apiKeys.keyHash, hash), eq(apiKeys.isActive, true)));
    return apiKey;
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const [newApiKey] = await db.insert(apiKeys).values(apiKey).returning();
    return newApiKey;
  }

  async updateApiKey(id: string, apiKey: Partial<InsertApiKey>): Promise<ApiKey> {
    const [updatedApiKey] = await db
      .update(apiKeys)
      .set(apiKey)
      .where(eq(apiKeys.id, id))
      .returning();
    return updatedApiKey;
  }

  async deleteApiKey(id: string): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
  }

  // Dashboard operations
  async getDailySummary(date: string): Promise<{
    totalSales: number;
    creditGiven: number;
    debtCollected: number;
    totalExpenses: number;
    salesCount: number;
    apiSalesCount: number;
  }> {
    // Total sales for the day
    const totalSalesResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(sales)
      .where(and(eq(sales.saleDate, date), ne(sales.paymentMethod, 'fiado')));

    // Credit given (fiado sales)
    const creditGivenResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
      })
      .from(sales)
      .where(and(eq(sales.saleDate, date), eq(sales.paymentMethod, 'fiado')));

    // Debt collected (payments)
    const debtCollectedResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(eq(payments.paymentDate, date));

    // Total expenses
    const totalExpensesResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(eq(expenses.expenseDate, date));

    // API sales count
    const apiSalesResult = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(sales)
      .where(and(eq(sales.saleDate, date), eq(sales.entryMethod, 'api')));

    return {
      totalSales: Number(totalSalesResult[0]?.total || 0),
      creditGiven: Number(creditGivenResult[0]?.total || 0),
      debtCollected: Number(debtCollectedResult[0]?.total || 0),
      totalExpenses: Number(totalExpensesResult[0]?.total || 0),
      salesCount: Number(totalSalesResult[0]?.count || 0),
      apiSalesCount: Number(apiSalesResult[0]?.count || 0),
    };
  }
}

export const storage = new DatabaseStorage();
