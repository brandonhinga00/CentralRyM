# Sistema RyM - Gestión Empresarial

Una aplicación completa de gestión empresarial construida con React, Express.js, PostgreSQL y Supabase.

## 🚀 Características

- **Dashboard Interactivo**: Panel principal con métricas en tiempo real
- **Carga Diaria**: Registro de ventas y gastos del día
- **Gestión Financiera**: Análisis de ingresos, gastos y balances
- **Gestión de Productos**: Inventario y control de stock
- **Gestión de Clientes**: Base de datos de clientes y deudas
- **Proveedores**: Gestión de proveedores y compras
- **Autenticación**: Login seguro con Google OAuth
- **API Móvil**: Soporte para aplicación móvil asistente

## 🛠️ Tecnologías

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Base de Datos**: PostgreSQL (Supabase)
- **ORM**: Drizzle
- **Autenticación**: Supabase Auth
- **UI**: Tailwind CSS + shadcn/ui
- **Hosting**: Railway (Free Tier)

## 📦 Instalación Local

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd CentralRM
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   Crear archivo `.env` con:
   ```env
   DATABASE_URL=your_supabase_database_url
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SESSION_SECRET=your_random_session_secret
   NODE_ENV=development
   ```

4. **Configurar base de datos**
   ```bash
   npm run db:push
   ```

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

## 🚀 Despliegue

### Producción
- **URL**: https://sistemarym.up.railway.app
- **Hosting**: Railway
- **Base de Datos**: Supabase

### Configuración de Producción
Las variables de entorno están configuradas en Railway:
- `DATABASE_URL`: Conexión a Supabase
- `SUPABASE_URL`: URL del proyecto Supabase
- `SUPABASE_ANON_KEY`: Clave anónima de Supabase
- `SESSION_SECRET`: Secreto para sesiones
- `NODE_ENV`: production

## 📱 API Móvil

La aplicación incluye soporte para una aplicación móvil asistente con API REST segura.

### Configuración de API Key
1. Crear API Key en la interfaz de administración
2. Configurar la app móvil con la API Key
3. La API permite:
   - Consultar stock de productos
   - Registrar ventas desde móvil
   - Gestionar pagos de deudas

## 🔧 Scripts Disponibles

```bash
npm run dev          # Desarrollo local
npm run build        # Build de producción
npm run preview      # Preview del build
npm run db:push      # Sincronizar esquema de BD
npm run db:studio    # Interfaz visual de BD
```

## 📊 Funcionalidades

### Dashboard
- Ventas del día
- Balance financiero
- Alertas de stock bajo
- Deudores principales

### Carga Diaria
- Registro de ventas con productos
- Registro de gastos por categoría
- Conciliación diaria automática
- Cálculos en tiempo real

### Finanzas
- Análisis de ingresos por método de pago
- Seguimiento de gastos
- Balance neto
- Cierre de caja

### Gestión
- Productos con control de stock
- Clientes con seguimiento de deudas
- Proveedores
- Categorías de productos

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 📞 Soporte

Para soporte técnico o preguntas, por favor contactar al desarrollador.