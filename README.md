# ERP Tienda de Electrónica

Prototipo funcional de sistema ERP para una tienda de electrónica con gestión de inventario, pedidos, incidencias y más.

## Características

- **Dashboard analítico** con KPIs en tiempo real y gráficos interactivos
- **Gestión de Inventario** por categorías y subcategorías con filtros, ordenación y paginación
- **Sistema de Pedidos** multicanal (Online, Tienda Fija, B2B) con seguimiento de estados
- **Simulador B2C** - Interfaz móvil para comprar como cliente final
- **Gestión de Incidencias** con prioridades y categorías
- **Panel de Proveedores** con CRUD completo, registro de entregas y seguimiento de pedidos
- **Gestión de Tareas** con estados, prioridades, asignación y filtros
- **Finanzas** (solo accesible para Gerente) con gráficos y registro de facturas
- **Control de Roles**: Gerente, Responsable de Almacén, Empleado de Tienda
- **Modo Claro/Oscuro** integrado

## Tecnologías

- HTML5, CSS3 (CSS Variables para theming)
- JavaScript Vanilla (ES6+)
- Chart.js para visualizaciones
- Phosphor Icons
- localStorage para persistencia de datos

## Cómo usar

1. Abre `index.html` en cualquier navegador moderno
2. Los datos se guardan automáticamente en localStorage
3. Usa el selector de rol en la barra superior para cambiar entre vistas
4. Click en "Reset Datos" para restaurar valores iniciales

## Estructura

```
/
├── index.html      # Punto de entrada
├── css/
│   └── styles.css  # Todos los estilos
├── js/
│   ├── app.js      # Lógica de la aplicación
│   └── data.js     # Datos iniciales y gestión de BD
└── contexto/        # Documentación del proyecto (no incluido en repo)
```

## Roles de Usuario

| Rol | Permisos |
|-----|----------|
| **Gerente** | Acceso completo a todas las vistas, incluyendo Finanzas |
| **Responsable Almacén** | Inventario, Pedidos, Incidencias, Proveedores, Tareas |
| **Empleado Tienda** | Solo lectura en Dashboard e Inventario |

## Licencia

MIT License - Ver archivo LICENSE

---

Desarrollado como prototipo ERP para tienda de electrónica.
