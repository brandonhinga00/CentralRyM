# Políticas de Row-Level Security (RLS) para Supabase

## Resumen
Se han agregado campos `user_id` a todas las tablas relevantes para implementar RLS. Ahora necesitas crear las políticas RLS en Supabase para asegurar que cada usuario solo pueda acceder a sus propios datos.

## Políticas RLS Requeridas

### 1. Habilitar RLS en todas las tablas
```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_closings ENABLE ROW LEVEL SECURITY;
```

### 2. Políticas SELECT (lectura)
```sql
-- Suppliers
CREATE POLICY "Users can view own suppliers" ON suppliers
FOR SELECT USING (auth.uid()::text = user_id);

-- Categories
CREATE POLICY "Users can view own categories" ON categories
FOR SELECT USING (auth.uid()::text = user_id);

-- Products
CREATE POLICY "Users can view own products" ON products
FOR SELECT USING (auth.uid()::text = user_id);

-- Customers
CREATE POLICY "Users can view own customers" ON customers
FOR SELECT USING (auth.uid()::text = user_id);

-- Sales
CREATE POLICY "Users can view own sales" ON sales
FOR SELECT USING (auth.uid()::text = user_id);

-- Payments
CREATE POLICY "Users can view own payments" ON payments
FOR SELECT USING (auth.uid()::text = user_id);

-- Expenses
CREATE POLICY "Users can view own expenses" ON expenses
FOR SELECT USING (auth.uid()::text = user_id);

-- Stock Movements
CREATE POLICY "Users can view own stock movements" ON stock_movements
FOR SELECT USING (auth.uid()::text = user_id);

-- API Keys
CREATE POLICY "Users can view own api keys" ON api_keys
FOR SELECT USING (auth.uid()::text = user_id);

-- Cash Closings (usa closed_by en lugar de user_id)
CREATE POLICY "Users can view own cash closings" ON cash_closings
FOR SELECT USING (auth.uid()::text = closed_by);
```

### 3. Políticas INSERT (creación)
```sql
-- Suppliers
CREATE POLICY "Users can insert own suppliers" ON suppliers
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Categories
CREATE POLICY "Users can insert own categories" ON categories
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Products
CREATE POLICY "Users can insert own products" ON products
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Customers
CREATE POLICY "Users can insert own customers" ON customers
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Sales
CREATE POLICY "Users can insert own sales" ON sales
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Payments
CREATE POLICY "Users can insert own payments" ON payments
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Expenses
CREATE POLICY "Users can insert own expenses" ON expenses
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Stock Movements
CREATE POLICY "Users can insert own stock movements" ON stock_movements
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- API Keys
CREATE POLICY "Users can insert own api keys" ON api_keys
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Cash Closings
CREATE POLICY "Users can insert own cash closings" ON cash_closings
FOR INSERT WITH CHECK (auth.uid()::text = closed_by);
```

### 4. Políticas UPDATE (actualización)
```sql
-- Suppliers
CREATE POLICY "Users can update own suppliers" ON suppliers
FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Categories
CREATE POLICY "Users can update own categories" ON categories
FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Products
CREATE POLICY "Users can update own products" ON products
FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Customers
CREATE POLICY "Users can update own customers" ON customers
FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Sales
CREATE POLICY "Users can update own sales" ON sales
FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Payments
CREATE POLICY "Users can update own payments" ON payments
FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Expenses
CREATE POLICY "Users can update own expenses" ON expenses
FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Stock Movements
CREATE POLICY "Users can update own stock movements" ON stock_movements
FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- API Keys
CREATE POLICY "Users can update own api keys" ON api_keys
FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Cash Closings
CREATE POLICY "Users can update own cash closings" ON cash_closings
FOR UPDATE USING (auth.uid()::text = closed_by) WITH CHECK (auth.uid()::text = closed_by);
```

### 5. Políticas DELETE (eliminación)
```sql
-- Suppliers
CREATE POLICY "Users can delete own suppliers" ON suppliers
FOR DELETE USING (auth.uid()::text = user_id);

-- Categories
CREATE POLICY "Users can delete own categories" ON categories
FOR DELETE USING (auth.uid()::text = user_id);

-- Products
CREATE POLICY "Users can delete own products" ON products
FOR DELETE USING (auth.uid()::text = user_id);

-- Customers
CREATE POLICY "Users can delete own customers" ON customers
FOR DELETE USING (auth.uid()::text = user_id);

-- Sales
CREATE POLICY "Users can delete own sales" ON sales
FOR DELETE USING (auth.uid()::text = user_id);

-- Payments
CREATE POLICY "Users can delete own payments" ON payments
FOR DELETE USING (auth.uid()::text = user_id);

-- Expenses
CREATE POLICY "Users can delete own expenses" ON expenses
FOR DELETE USING (auth.uid()::text = user_id);

-- Stock Movements
CREATE POLICY "Users can delete own stock movements" ON stock_movements
FOR DELETE USING (auth.uid()::text = user_id);

-- API Keys
CREATE POLICY "Users can delete own api keys" ON api_keys
FOR DELETE USING (auth.uid()::text = user_id);

-- Cash Closings
CREATE POLICY "Users can delete own cash closings" ON cash_closings
FOR DELETE USING (auth.uid()::text = closed_by);
```

## Instrucciones de Implementación

1. **Ve al panel de Supabase** → SQL Editor
2. **Ejecuta primero** la habilitación de RLS en todas las tablas
3. **Luego ejecuta** todas las políticas SELECT
4. **Después ejecuta** todas las políticas INSERT
5. **Continúa con** UPDATE y DELETE

## Verificación

Para verificar que las políticas funcionan correctamente:

```sql
-- Prueba con un usuario autenticado
SELECT * FROM products LIMIT 5; -- Debería mostrar solo productos del usuario actual

-- Prueba intentando acceder a datos de otro usuario (debería fallar)
SELECT * FROM products WHERE user_id != auth.uid()::text; -- Debería retornar vacío
```

## Notas Importantes

- `auth.uid()` retorna el UUID del usuario autenticado en Supabase
- Convertimos a `text` porque nuestros campos `user_id` son `varchar`
- `cash_closings` usa `closed_by` en lugar de `user_id` porque ya tenía ese campo
- Todas las operaciones (SELECT, INSERT, UPDATE, DELETE) están restringidas por usuario