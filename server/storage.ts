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
  cashClosings,
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
  type CashClosing,
  type InsertCashClosing,
} from "@shared/schema";
import { db, getSupabaseClient } from "./db";
import { eq, desc, asc, sql, and, gte, lte, like, ilike, ne } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Supplier operations
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier, userId: string): Promise<Supplier>;
  updateSupplier(
    id: string,
    supplier: Partial<InsertSupplier>,
  ): Promise<Supplier>;
  deleteSupplier(id: string): Promise<void>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory, userId: string): Promise<Category>;
  updateCategory(
    id: string,
    category: Partial<InsertCategory>,
  ): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  searchProducts(query: string): Promise<Product[]>;
  getLowStockProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct, userId: string): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  updateProductStock(id: string, newStock: number): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  searchCustomers(query: string): Promise<Customer[]>;
  getCustomersWithDebt(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer, userId: string): Promise<Customer>;
  updateCustomer(
    id: string,
    customer: Partial<InsertCustomer>,
  ): Promise<Customer>;
  updateCustomerDebt(id: string, newDebt: number): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;

  // Sale operations
  getSales(startDate?: string, endDate?: string): Promise<Sale[]>;
  getSalesWithItems(
    startDate?: string,
    endDate?: string,
  ): Promise<(Sale & { saleItems: (SaleItem & { product: Product })[] })[]>;
  getSale(id: string): Promise<Sale | undefined>;
  getSalesByCustomer(customerId: string): Promise<Sale[]>;
  getSalesWithItemsByCustomer(
    customerId: string,
  ): Promise<(Sale & { saleItems: (SaleItem & { product: Product })[] })[]>;
  createSale(sale: InsertSale, items: InsertSaleItem[], userId: string): Promise<Sale>;
  updateSale(id: string, sale: Partial<InsertSale>): Promise<Sale>;
  deleteSale(id: string): Promise<void>;

  // Payment operations
  getPayments(startDate?: string, endDate?: string): Promise<Payment[]>;
  getPaymentsByCustomer(customerId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment, userId: string): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment>;
  deletePayment(id: string): Promise<void>;

  // Expense operations
  getExpenses(startDate?: string, endDate?: string): Promise<Expense[]>;
  createExpense(expense: InsertExpense, userId: string): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;

  // Stock movement operations
  getStockMovements(
    productId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement, userId: string): Promise<StockMovement>;

  // API key operations
  getApiKeys(): Promise<ApiKey[]>;
  getApiKeyByHash(hash: string): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey, userId: string): Promise<ApiKey>;
  updateApiKey(id: string, apiKey: Partial<InsertApiKey>): Promise<ApiKey>;
  deleteApiKey(id: string): Promise<void>;

  // Cash closing operations
  getCashClosings(startDate?: string, endDate?: string): Promise<CashClosing[]>;
  getCashClosing(id: string): Promise<CashClosing | undefined>;
  getCashClosingByDate(date: string): Promise<CashClosing | undefined>;
  createCashClosing(cashClosing: InsertCashClosing): Promise<CashClosing>;

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
    // For user queries, we can use the direct database connection
    // since user data is not sensitive in the same way
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
  async getSuppliers(userId?: string): Promise<Supplier[]> {
    const conditions = [];

    if (userId) {
      conditions.push(eq(suppliers.userId, userId));
    }

    if (conditions.length > 0) {
      return await db
        .select()
        .from(suppliers)
        .where(and(...conditions))
        .orderBy(asc(suppliers.name));
    }

    return await db.select().from(suppliers).orderBy(asc(suppliers.name));
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier, userId: string): Promise<Supplier> {
    const [newSupplier] = await db
      .insert(suppliers)
      .values({ ...supplier, userId })
      .returning();
    return newSupplier;
  }

  async updateSupplier(
    id: string,
    supplier: Partial<InsertSupplier>,
  ): Promise<Supplier> {
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
  async getCategories(userId?: string): Promise<Category[]> {
    const conditions = [];

    if (userId) {
      conditions.push(eq(categories.userId, userId));
    }

    if (conditions.length > 0) {
      return await db
        .select()
        .from(categories)
        .where(and(...conditions))
        .orderBy(asc(categories.name));
    }

    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory, userId: string): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values({ ...category, userId })
      .returning();
    return newCategory;
  }

  async updateCategory(
    id: string,
    category: Partial<InsertCategory>,
  ): Promise<Category> {
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
  async getProducts(userId?: string): Promise<Product[]> {
    // For RLS to work, we need to use Supabase client with user context
    // This ensures RLS policies are properly enforced
    const supabase = getSupabaseClient();

    if (userId) {
      // Set the user context for RLS
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;
      return data as Product[];
    }

    // Fallback for cases without user context (should not happen in production)
    return await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(asc(products.name));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product;
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.barcode, barcode));
    return product;
  }

  async searchProducts(query: string, userId?: string): Promise<Product[]> {
    const conditions = [eq(products.isActive, true), ilike(products.name, `%${query}%`)];

    if (userId) {
      conditions.push(eq(products.userId, userId));
    }

    return await db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(asc(products.name))
      .limit(20);
  }

  async getLowStockProducts(userId?: string): Promise<Product[]> {
    const conditions = [
      eq(products.isActive, true),
      sql`${products.currentStock} <= ${products.minStock}`,
    ];

    if (userId) {
      conditions.push(eq(products.userId, userId));
    }

    return await db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(asc(products.currentStock));
  }

  async createProduct(product: InsertProduct, userId: string): Promise<Product> {
    const [newProduct] = await db.insert(products).values({ ...product, userId }).returning();
    return newProduct;
  }

  async updateProduct(
    id: string,
    product: Partial<InsertProduct>,
  ): Promise<Product> {
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
    await db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, id));
  }

  // Customer operations
  async getCustomers(userId?: string): Promise<Customer[]> {
    const conditions = [eq(customers.isActive, true)];

    if (userId) {
      conditions.push(eq(customers.userId, userId));
    }

    return await db
      .select()
      .from(customers)
      .where(and(...conditions))
      .orderBy(asc(customers.name));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    return customer;
  }

  async searchCustomers(query: string, userId?: string): Promise<Customer[]> {
    const conditions = [eq(customers.isActive, true), ilike(customers.name, `%${query}%`)];

    if (userId) {
      conditions.push(eq(customers.userId, userId));
    }

    return await db
      .select()
      .from(customers)
      .where(and(...conditions))
      .orderBy(asc(customers.name))
      .limit(20);
  }

  async getCustomersWithDebt(userId?: string): Promise<Customer[]> {
    const conditions = [
      eq(customers.isActive, true),
      sql`${customers.currentDebt} > 0`,
    ];

    if (userId) {
      conditions.push(eq(customers.userId, userId));
    }

    return await db
      .select()
      .from(customers)
      .where(and(...conditions))
      .orderBy(desc(customers.currentDebt));
  }

  async createCustomer(customer: InsertCustomer, userId: string): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values({ ...customer, userId })
      .returning();
    return newCustomer;
  }

  async updateCustomer(
    id: string,
    customer: Partial<InsertCustomer>,
  ): Promise<Customer> {
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
    await db
      .update(customers)
      .set({ isActive: false })
      .where(eq(customers.id, id));
  }

  // Sale operations
  async getSales(startDate?: string, endDate?: string, userId?: string): Promise<Sale[]> {
    const conditions = [];
    if (startDate) conditions.push(gte(sales.saleDate, startDate));
    if (endDate) conditions.push(lte(sales.saleDate, endDate));
    if (userId) conditions.push(eq(sales.userId, userId));

    if (conditions.length > 0) {
      return await db
        .select()
        .from(sales)
        .where(and(...conditions))
        .orderBy(desc(sales.saleDate), desc(sales.createdAt));
    }

    return await db
      .select()
      .from(sales)
      .orderBy(desc(sales.saleDate), desc(sales.createdAt));
  }

  async getSalesWithItems(
    startDate?: string,
    endDate?: string,
    userId?: string,
  ): Promise<(Sale & { saleItems: (SaleItem & { product: Product })[] })[]> {
    const conditions = [];
    if (startDate) conditions.push(gte(sales.saleDate, startDate));
    if (endDate) conditions.push(lte(sales.saleDate, endDate));
    if (userId) conditions.push(eq(sales.userId, userId));

    let salesData;
    if (conditions.length > 0) {
      salesData = await db
        .select()
        .from(sales)
        .where(and(...conditions))
        .orderBy(desc(sales.saleDate), desc(sales.createdAt));
    } else {
      salesData = await db
        .select()
        .from(sales)
        .orderBy(desc(sales.saleDate), desc(sales.createdAt));
    }

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
      }),
    );

    return salesWithItems;
  }

  async getSale(id: string): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale;
  }

  async getSalesByCustomer(customerId: string, userId?: string): Promise<Sale[]> {
    const conditions = [eq(sales.customerId, customerId)];

    if (userId) {
      conditions.push(eq(sales.userId, userId));
    }

    return await db
      .select()
      .from(sales)
      .where(and(...conditions))
      .orderBy(desc(sales.saleDate));
  }

  async getSalesWithItemsByCustomer(
    customerId: string,
    userId?: string,
  ): Promise<(Sale & { saleItems: (SaleItem & { product: Product })[] })[]> {
    const conditions = [eq(sales.customerId, customerId)];

    if (userId) {
      conditions.push(eq(sales.userId, userId));
    }

    const salesData = await db
      .select()
      .from(sales)
      .where(and(...conditions))
      .orderBy(desc(sales.saleDate));

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
      }),
    );

    return salesWithItems;
  }

  async createSale(sale: InsertSale, items: InsertSaleItem[], userId: string): Promise<Sale> {
    return await db.transaction(async (tx) => {
      const [newSale] = await tx.insert(sales).values({ ...sale, userId }).returning();

      // Insert sale items
      const saleItemsWithSaleId = items.map((item) => ({
        ...item,
        saleId: newSale.id,
      }));
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
          userId,
          productId: item.productId,
          movementType: "sale",
          quantity: (-Number(item.quantity)).toString(),
          reason: `Venta #${newSale.id}`,
          referenceId: newSale.id,
        });
      }

      // Update customer debt if payment method is fiado
      if (sale.paymentMethod === "fiado" && sale.customerId) {
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
  async getPayments(startDate?: string, endDate?: string, userId?: string): Promise<Payment[]> {
    const conditions = [];
    if (startDate) conditions.push(gte(payments.paymentDate, startDate));
    if (endDate) conditions.push(lte(payments.paymentDate, endDate));
    if (userId) conditions.push(eq(payments.userId, userId));

    if (conditions.length > 0) {
      return await db
        .select()
        .from(payments)
        .where(and(...conditions))
        .orderBy(desc(payments.paymentDate), desc(payments.createdAt));
    }

    return await db
      .select()
      .from(payments)
      .orderBy(desc(payments.paymentDate), desc(payments.createdAt));
  }

  async getPaymentsByCustomer(customerId: string, userId?: string): Promise<Payment[]> {
    const conditions = [eq(payments.customerId, customerId)];

    if (userId) {
      conditions.push(eq(payments.userId, userId));
    }

    return await db
      .select()
      .from(payments)
      .where(and(...conditions))
      .orderBy(desc(payments.paymentDate));
  }

  async createPayment(payment: InsertPayment, userId: string): Promise<Payment> {
    return await db.transaction(async (tx) => {
      const [newPayment] = await tx
        .insert(payments)
        .values({ ...payment, userId })
        .returning();

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

  async updatePayment(
    id: string,
    payment: Partial<InsertPayment>,
  ): Promise<Payment> {
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
  async getExpenses(startDate?: string, endDate?: string, userId?: string): Promise<Expense[]> {
    const conditions = [];
    if (startDate) conditions.push(gte(expenses.expenseDate, startDate));
    if (endDate) conditions.push(lte(expenses.expenseDate, endDate));
    if (userId) conditions.push(eq(expenses.userId, userId));

    if (conditions.length > 0) {
      return await db
        .select()
        .from(expenses)
        .where(and(...conditions))
        .orderBy(desc(expenses.expenseDate), desc(expenses.createdAt));
    }

    return await db
      .select()
      .from(expenses)
      .orderBy(desc(expenses.expenseDate), desc(expenses.createdAt));
  }

  async createExpense(expense: InsertExpense, userId: string): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values({ ...expense, userId }).returning();
    return newExpense;
  }

  async updateExpense(
    id: string,
    expense: Partial<InsertExpense>,
  ): Promise<Expense> {
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
  async getStockMovements(
    productId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StockMovement[]> {
    const conditions = [];
    if (productId) conditions.push(eq(stockMovements.productId, productId));
    if (startDate)
      conditions.push(gte(stockMovements.createdAt, new Date(startDate)));
    if (endDate)
      conditions.push(lte(stockMovements.createdAt, new Date(endDate)));

    if (conditions.length > 0) {
      return await db
        .select()
        .from(stockMovements)
        .where(and(...conditions))
        .orderBy(desc(stockMovements.createdAt));
    }

    return await db
      .select()
      .from(stockMovements)
      .orderBy(desc(stockMovements.createdAt));
  }

  async createStockMovement(
    movement: InsertStockMovement,
    userId: string,
  ): Promise<StockMovement> {
    const [newMovement] = await db
      .insert(stockMovements)
      .values({ ...movement, userId })
      .returning();
    return newMovement;
  }

  // API key operations
  async getApiKeys(userId?: string): Promise<ApiKey[]> {
    const conditions = [];

    if (userId) {
      conditions.push(eq(apiKeys.userId, userId));
    }

    if (conditions.length > 0) {
      return await db
        .select()
        .from(apiKeys)
        .where(and(...conditions))
        .orderBy(desc(apiKeys.createdAt));
    }

    return await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
  }

  async getApiKeyByHash(hash: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.keyHash, hash), eq(apiKeys.isActive, true)));
    return apiKey;
  }

  async createApiKey(apiKey: InsertApiKey, userId: string): Promise<ApiKey> {
    const [newApiKey] = await db.insert(apiKeys).values({ ...apiKey, userId }).returning();
    return newApiKey;
  }

  async updateApiKey(
    id: string,
    apiKey: Partial<InsertApiKey>,
  ): Promise<ApiKey> {
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
    // Total sales for the day (excluding fiado - only actual cash received)
    const totalSalesResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(sales)
      .where(and(eq(sales.saleDate, date), ne(sales.paymentMethod, "fiado")));

    // Credit given (fiado sales)
    const creditGivenResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
      })
      .from(sales)
      .where(and(eq(sales.saleDate, date), eq(sales.paymentMethod, "fiado")));

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
      .where(and(eq(sales.saleDate, date), eq(sales.entryMethod, "api")));

    return {
      totalSales: Number(totalSalesResult[0]?.total || 0),
      creditGiven: Number(creditGivenResult[0]?.total || 0),
      debtCollected: Number(debtCollectedResult[0]?.total || 0),
      totalExpenses: Number(totalExpensesResult[0]?.total || 0),
      salesCount: Number(totalSalesResult[0]?.count || 0),
      apiSalesCount: Number(apiSalesResult[0]?.count || 0),
    };
  }

  // Cash closing operations
  async getCashClosings(
    startDate?: string,
    endDate?: string,
    userId?: string,
  ): Promise<CashClosing[]> {
    const conditions = [];
    if (startDate) conditions.push(gte(cashClosings.closingDate, startDate));
    if (endDate) conditions.push(lte(cashClosings.closingDate, endDate));
    if (userId) conditions.push(eq(cashClosings.closedBy, userId));

    if (conditions.length > 0) {
      return await db
        .select()
        .from(cashClosings)
        .where(and(...conditions))
        .orderBy(desc(cashClosings.closingDate));
    }

    return await db
      .select()
      .from(cashClosings)
      .orderBy(desc(cashClosings.closingDate));
  }

  async getCashClosing(id: string): Promise<CashClosing | undefined> {
    const [cashClosing] = await db
      .select()
      .from(cashClosings)
      .where(eq(cashClosings.id, id));
    return cashClosing;
  }

  async getCashClosingByDate(date: string): Promise<CashClosing | undefined> {
    const [cashClosing] = await db
      .select()
      .from(cashClosings)
      .where(eq(cashClosings.closingDate, date));
    return cashClosing;
  }

  async createCashClosing(
    cashClosingData: InsertCashClosing,
  ): Promise<CashClosing> {
    const [newCashClosing] = await db
      .insert(cashClosings)
      .values(cashClosingData)
      .returning();
    return newCashClosing;
  }
}

export const storage = new DatabaseStorage();
