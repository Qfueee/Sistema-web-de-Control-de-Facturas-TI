<<<<<<< HEAD
# TI Control - CasaIdeas

**TI Control** es una plataforma web interna diseñada para el departamento de Tecnología de DH Empresas Perú S.A. (CasaIdeas). Su objetivo principal es digitalizar y optimizar el seguimiento de facturación de servicios de TI (recurrentes y ocasionales), reemplazando el uso de hojas de cálculo y correos electrónicos.

---

## 🚀 Guía de Instalación

El proyecto está construido utilizando **React 19** y **Vite**. Sigue estos pasos para ejecutarlo en un entorno local o prepararlo para producción.

### Requisitos Previos
- **Node.js** (v18.0 o superior recomendado)
- **npm** (gestor de paquetes, incluido con Node.js)

### 1. Clonar e Instalar Dependencias
Abre tu terminal, navega a la carpeta del proyecto y ejecuta la instalación de los paquetes:

```bash
# Entrar al directorio del proyecto (si no estás ya dentro)
cd GusGus

# Instalar dependencias
npm install
```

### 2. Ejecutar Servidor de Desarrollo (Local)
Para iniciar la aplicación en tu máquina local y ver los cambios en tiempo real:

```bash
npm run dev
```
La terminal te mostrará una URL local (generalmente `http://localhost:5173/`). Abre ese enlace en tu navegador.

### 3. Construir para Producción
Cuando el sistema esté listo para ser alojado en un servidor interno (IIS, Apache, Nginx, etc.):

```bash
npm run build
```
Esto generará una carpeta `dist/` con los archivos HTML, CSS y JavaScript minificados y optimizados, listos para ser desplegados en cualquier servidor web estático.

---

## 🔐 Credenciales de Acceso (Datos de Prueba)

El sistema viene con datos simulados precargados en el navegador (vía LocalStorage) para demostración:

- **Administrador:**
  - Correo: `admin@casaideas.com`
  - Contraseña: `admin`
- **Visor:**
  - Correo: `visor@casaideas.com`
  - Contraseña: `visor`

---

## 🧩 Arquitectura y Funciones del Código

El código está estructurado bajo un enfoque de componentes modulares de React. El manejo de estado global (datos de proveedores, facturas, etc.) se centraliza en un Context API.

### 1. Contexto Global (`src/context/AppContext.jsx`)
Es el "cerebro" de la aplicación. Se encarga de:
- **Persistencia de Datos:** Utiliza `localStorage` para guardar y recuperar la información (simulando una base de datos On-Premise).
- **Gestión de Estados:** 
  - `users`: Lista de usuarios con acceso al sistema.
  - `providers`: Catálogo de proveedores fijos y ocasionales (incluye RUC).
  - `invoices`: Trámites activos e históricos (Bandeja Operativa).
  - `recurrents`: Configuración de fechas de pago mensual por proveedor.
  - `paidRecurrents`: Control de los pagos recurrentes que ya han sido abonados en un mes específico.
- **Funciones Utilitarias:**
  - `formatCurrency()`: Formatea montos a moneda local o dólares (PEN/USD).
  - `resetData()`: Limpia el LocalStorage y restaura los datos simulados por defecto (ideal para pruebas).

### 2. Componentes Principales (`src/components/`)

#### `BandejaOperativa.jsx`
- **Función:** Muestra los trámites de facturación que están "activos" (aún no enviados a contabilidad).
- **Características:** 
  - Calcula la "Antigüedad" en días (desde que ingresó el trámite) y cambia el color a rojo si excede el tiempo límite usando la librería `date-fns`.
  - Incluye filtros dinámicos por ID, Nombre de proveedor y Tipo (Fijo/Ocasional).

#### `InvoiceModal.jsx`
- **Función:** Ventana lateral (Slide-over) para crear o gestionar un trámite individual.
- **Características:**
  - Contiene un *Workflow Stepper* visual para avanzar el estado de la factura (Cotización -> Orden de Compra -> Guía -> Factura -> Contabilidad).
  - Permite guardar notas/observaciones dinámicas sobre el trámite en curso.

#### `BillingCalendar.jsx`
- **Función:** Visualiza la previsión de pagos de servicios fijos mes a mes.
- **Características:**
  - Genera dinámicamente la cuadrícula del mes usando `date-fns`.
  - Cruza el día de pago del servicio con el estado `paidRecurrents` para mostrar iconos de advertencia (vencido) o check (pagado).
  - Permite la gestión (crear/editar/borrar) de obligaciones recurrentes y el toggle de "Marcar como Pagado".

#### `DashboardCharts.jsx`
- **Función:** Panel ejecutivo con métricas.
- **Características:**
  - Genera 4 KPIs (Facturas críticas, Activos, Monto Pendiente, Próximo Vencimiento).
  - Integra la librería **Recharts** para graficar de forma reactiva el gasto acumulado por proveedor y la distribución por estados de las facturas.

#### `Historial.jsx`
- **Función:** Repositorio histórico de todas las facturas procesadas.
- **Características:** Implementa un sistema de **paginación** y filtros compuestos para facilitar la búsqueda en bases de datos extensas.

#### `Configuracion.jsx`
- **Función:** Administración de catálogos base.
- **Características:** 
  - Protegido por rol (solo usuarios con rol `admin` pueden crear o borrar datos).
  - Implementa edición *inline* para modificar tipos de proveedores sin abrir modales.

### 3. Sistema de Diseño (`src/index.css`)
Todo el apartado visual se controla sin frameworks pesados (Zero dependencias como Tailwind o Bootstrap), utilizando puro CSS3 moderno:
- **Variables CSS:** Paleta de colores centralizada (`--primary`, `--surface-color`, etc.) para facilitar futuros *re-brandings*.
- **Glassmorphism:** Efectos de desenfoque (`backdrop-filter`) usados en modales.
- **Micro-animaciones:** Clases como `.animate-in` para transiciones suaves al cargar pantallas o hacer hover en los botones.

---
*Desarrollado para DH Empresas Perú S.A. - Departamento de TI.*
=======
# Sistema-web-de-Control-de-Facturas-TI
Un sistema web diseñado para poder manejar las facturas del área de TI en la empresa CasaIdeas, tiene funciones de mapeo de facturación fija y seguimiento de ciclo de vida de las compras
>>>>>>> 23486d3dfe7dec3b5ebb5e59297da2752e4aaaad
