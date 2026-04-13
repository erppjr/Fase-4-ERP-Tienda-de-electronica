// Simulador de Base de Datos para el Prototipo V4

const defaultDB = {
    categoriasEstructura: [
        { id: 'CAT-1', nombre: 'Ordenadores', subcategorias: ['Portátiles', 'Sobremesa', 'Mini PCs'] },
        { id: 'CAT-2', nombre: 'Periféricos', subcategorias: ['Monitores', 'Audio', 'Ratones', 'Teclados', 'Video'] },
        { id: 'CAT-3', nombre: 'Dispositivos Inteligentes', subcategorias: ['Smartphones', 'Smartwatches', 'Tablets', 'Smart Home'] },
        { id: 'CAT-4', nombre: 'Impresión Oficina', subcategorias: ['Impresoras', 'Consumibles', 'Maquinaria', 'Mobiliario'] },
        { id: 'CAT-5', nombre: 'Componentes', subcategorias: ['Hardware', 'Almacenamiento', 'Redes', 'Refrigeración', 'Cajas y Fuentes'] },
        { id: 'CAT-0', nombre: 'Sin Clasificar', subcategorias: ['General'] }
    ],
    productos: [
        // Ordenadores
        { id: 'PRD-001', nombre: 'Laptop Ultraligero 14" i7', categoria: 'Ordenadores', subcategoria: 'Portátiles', marca: 'Asus', stock: 23, estado: 'disponible', ubicacion: 'Pasillo 1', precio: 1299 },
        { id: 'PRD-002', nombre: 'PC Sobremesa Gaming RTX', categoria: 'Ordenadores', subcategoria: 'Sobremesa', marca: 'MSI', stock: 8, estado: 'bajo', ubicacion: 'Pasillo 1', precio: 1899 },
        { id: 'PRD-003', nombre: 'Mini PC Oficina i5', categoria: 'Ordenadores', subcategoria: 'Mini PCs', marca: 'Intel', stock: 15, estado: 'disponible', ubicacion: 'Pasillo 2', precio: 549 },
        { id: 'PRD-022', nombre: 'MacBook Pro 16" M3 Max', categoria: 'Ordenadores', subcategoria: 'Portátiles', marca: 'Apple', stock: 5, estado: 'bajo', ubicacion: 'Vitrina VIP', precio: 3499 },
        { id: 'PRD-023', nombre: 'Workstation Xeon W-3300', categoria: 'Ordenadores', subcategoria: 'Sobremesa', marca: 'Dell', stock: 3, estado: 'bajo', ubicacion: 'Almacén B', precio: 4500 },
        { id: 'PRD-024', nombre: 'Laptop Gaming 15.6" Ryzen 7', categoria: 'Ordenadores', subcategoria: 'Portátiles', marca: 'Lenovo', stock: 45, estado: 'disponible', ubicacion: 'Pasillo 1', precio: 1150 },
        { id: 'PRD-025', nombre: 'All-in-One 24" Home Office', categoria: 'Ordenadores', subcategoria: 'Sobremesa', marca: 'HP', stock: 12, estado: 'bajo', ubicacion: 'Pasillo 2', precio: 799 },
        { id: 'PRD-026', nombre: 'Chromebook 11" Estudiantes', categoria: 'Ordenadores', subcategoria: 'Portátiles', marca: 'Acer', stock: 120, estado: 'disponible', ubicacion: 'Almacén A', precio: 249 },

        // Periféricos 
        { id: 'PRD-004', nombre: 'Monitor Gaming 27" 144Hz', categoria: 'Periféricos', subcategoria: 'Monitores', marca: 'BenQ', stock: 0, estado: 'agotado', ubicacion: 'Almacén B', precio: 349 },
        { id: 'PRD-005', nombre: 'Monitor Oficina 24" IPS', categoria: 'Periféricos', subcategoria: 'Monitores', marca: 'LG', stock: 50, estado: 'disponible', ubicacion: 'Pasillo 2', precio: 149 },
        { id: 'PRD-006', nombre: 'Auriculares Noise Cancelling', categoria: 'Periféricos', subcategoria: 'Audio', marca: 'Sony', stock: 12, estado: 'bajo', ubicacion: 'Pasillo 3', precio: 199 },
        { id: 'PRD-007', nombre: 'Ratón Ergonómico', categoria: 'Periféricos', subcategoria: 'Ratones', marca: 'Logitech', stock: 35, estado: 'disponible', ubicacion: 'Expositor A', precio: 45 },
        { id: 'PRD-008', nombre: 'Webcam 1080p Streaming', categoria: 'Periféricos', subcategoria: 'Video', marca: 'Logitech', stock: 10, estado: 'bajo', ubicacion: 'Pasillo 3', precio: 85 },
        { id: 'PRD-027', nombre: 'Teclado Mecánico RGB Switch Red', categoria: 'Periféricos', subcategoria: 'Teclados', marca: 'Corsair', stock: 24, estado: 'disponible', ubicacion: 'Expositor B', precio: 130 },
        { id: 'PRD-028', nombre: 'Teclado Inalámbrico Minimalista', categoria: 'Periféricos', subcategoria: 'Teclados', marca: 'Logitech', stock: 40, estado: 'disponible', ubicacion: 'Pasillo 3', precio: 99 },
        { id: 'PRD-029', nombre: 'Ratón Gaming Ultra Ligero', categoria: 'Periféricos', subcategoria: 'Ratones', marca: 'Razer', stock: 18, estado: 'disponible', ubicacion: 'Expositor A', precio: 75 },
        { id: 'PRD-030', nombre: 'Barra de Sonido 2.1 PC', categoria: 'Periféricos', subcategoria: 'Audio', marca: 'Creative', stock: 8, estado: 'bajo', ubicacion: 'Pasillo 3', precio: 50 },
        { id: 'PRD-031', nombre: 'Monitor Curvo UltraWide 34"', categoria: 'Periféricos', subcategoria: 'Monitores', marca: 'Samsung', stock: 7, estado: 'bajo', ubicacion: 'Almacén B', precio: 599 },
        { id: 'PRD-032', nombre: 'Capturadora de Video 4K', categoria: 'Periféricos', subcategoria: 'Video', marca: 'Elgato', stock: 14, estado: 'bajo', ubicacion: 'Pasillo 3', precio: 190 },

        // Dispositivos Inteligentes
        { id: 'PRD-009', nombre: 'Smartphone X Pro 128GB', categoria: 'Dispositivos Inteligentes', subcategoria: 'Smartphones', marca: 'Apple', stock: 45, estado: 'disponible', ubicacion: 'Vitrina 1', precio: 899 },
        { id: 'PRD-010', nombre: 'Smartphone Z Lite 64GB', categoria: 'Dispositivos Inteligentes', subcategoria: 'Smartphones', marca: 'Samsung', stock: 20, estado: 'disponible', ubicacion: 'Vitrina 1', precio: 499 },
        { id: 'PRD-011', nombre: 'Smartwatch Series 5', categoria: 'Dispositivos Inteligentes', subcategoria: 'Smartwatches', marca: 'Apple', stock: 5, estado: 'bajo', ubicacion: 'Vitrina 2', precio: 249 },
        { id: 'PRD-012', nombre: 'Tablet 10" 64GB', categoria: 'Dispositivos Inteligentes', subcategoria: 'Tablets', marca: 'Samsung', stock: 18, estado: 'disponible', ubicacion: 'Vitrina 2', precio: 329 },
        { id: 'PRD-033', nombre: 'Tablet iPad Pro 12.9"', categoria: 'Dispositivos Inteligentes', subcategoria: 'Tablets', marca: 'Apple', stock: 12, estado: 'bajo', ubicacion: 'Vitrina 2', precio: 1099 },
        { id: 'PRD-034', nombre: 'Smartphone Mi 14 Ultra', categoria: 'Dispositivos Inteligentes', subcategoria: 'Smartphones', marca: 'Xiaomi', stock: 30, estado: 'disponible', ubicacion: 'Vitrina 1', precio: 799 },
        { id: 'PRD-035', nombre: 'Altavoz Inteligente Echo Dot 5', categoria: 'Dispositivos Inteligentes', subcategoria: 'Smart Home', marca: 'Amazon', stock: 85, estado: 'disponible', ubicacion: 'Pasillo 4', precio: 50 },
        { id: 'PRD-036', nombre: 'Bombilla LED WiFi RGB', categoria: 'Dispositivos Inteligentes', subcategoria: 'Smart Home', marca: 'Philips', stock: 110, estado: 'disponible', ubicacion: 'Pasillo 4', precio: 25 },
        { id: 'PRD-037', nombre: 'Pulsera de Actividad Band 8', categoria: 'Dispositivos Inteligentes', subcategoria: 'Smartwatches', marca: 'Xiaomi', stock: 65, estado: 'disponible', ubicacion: 'Expositor B', precio: 40 },

        // Impresión y Oficina
        { id: 'PRD-013', nombre: 'Impresora Multifunción Wi-Fi', categoria: 'Impresión Oficina', subcategoria: 'Impresoras', marca: 'HP', stock: 14, estado: 'bajo', ubicacion: 'Pasillo 4', precio: 120 },
        { id: 'PRD-014', nombre: 'Pack 4 Cartuchos Tinta', categoria: 'Impresión Oficina', subcategoria: 'Consumibles', marca: 'Epson', stock: 65, estado: 'disponible', ubicacion: 'Pasillo 4', precio: 45 },
        { id: 'PRD-015', nombre: 'Destructora de Papel P-4', categoria: 'Impresión Oficina', subcategoria: 'Maquinaria', marca: 'Fellowes', stock: 4, estado: 'bajo', ubicacion: 'Pasillo 4', precio: 89 },
        { id: 'PRD-038', nombre: 'Impresora Láser Monocromo B/N', categoria: 'Impresión Oficina', subcategoria: 'Impresoras', marca: 'Brother', stock: 22, estado: 'disponible', ubicacion: 'Pasillo 4', precio: 140 },
        { id: 'PRD-039', nombre: 'Tóner Láser Alta Capacidad', categoria: 'Impresión Oficina', subcategoria: 'Consumibles', marca: 'Brother', stock: 40, estado: 'disponible', ubicacion: 'Pasillo 4', precio: 65 },
        { id: 'PRD-040', nombre: 'Plastificadora A4', categoria: 'Impresión Oficina', subcategoria: 'Maquinaria', marca: 'Olympia', stock: 15, estado: 'disponible', ubicacion: 'Pasillo 4', precio: 35 },
        { id: 'PRD-041', nombre: 'Silla Oficina Ergonómica Malla', categoria: 'Impresión Oficina', subcategoria: 'Mobiliario', marca: 'Sihoo', stock: 9, estado: 'bajo', ubicacion: 'Almacén C', precio: 199 },
        { id: 'PRD-042', nombre: 'Mesa Elevable Motorizada 140cm', categoria: 'Impresión Oficina', subcategoria: 'Mobiliario', marca: 'FlexiSpot', stock: 4, estado: 'bajo', ubicacion: 'Almacén C', precio: 299 },
        { id: 'PRD-043', nombre: 'Pack 500 Folios A4 80g', categoria: 'Impresión Oficina', subcategoria: 'Consumibles', marca: 'Navigator', stock: 200, estado: 'disponible', ubicacion: 'Pasillo 4', precio: 6 },

        // Componentes 
        { id: 'PRD-016', nombre: 'Tarjeta Gráfica RTX 4060 Ti', categoria: 'Componentes', subcategoria: 'Hardware', marca: 'Nvidia', stock: 6, estado: 'bajo', ubicacion: 'Almacén A', precio: 450 },
        { id: 'PRD-017', nombre: 'Memoria RAM 32GB DDR5', categoria: 'Componentes', subcategoria: 'Hardware', marca: 'Corsair', stock: 30, estado: 'disponible', ubicacion: 'Pasillo 5', precio: 135 },
        { id: 'PRD-018', nombre: 'Disco SSD NVMe 1TB', categoria: 'Componentes', subcategoria: 'Almacenamiento', marca: 'Western Digital', stock: 42, estado: 'disponible', ubicacion: 'Pasillo 5', precio: 85 },
        { id: 'PRD-019', nombre: 'Disco Duro Externo 4TB', categoria: 'Componentes', subcategoria: 'Almacenamiento', marca: 'Seagate', stock: 15, estado: 'disponible', ubicacion: 'Pasillo 5', precio: 110 },
        { id: 'PRD-020', nombre: 'Router Wi-Fi 6 Doble Banda', categoria: 'Componentes', subcategoria: 'Redes', marca: 'TP-Link', stock: 22, estado: 'disponible', ubicacion: 'Pasillo 6', precio: 130 },
        { id: 'PRD-021', nombre: 'Switch Gigabit 8 Puertos', categoria: 'Componentes', subcategoria: 'Redes', marca: 'Ubiquiti', stock: 35, estado: 'disponible', ubicacion: 'Pasillo 6', precio: 25 },
        { id: 'PRD-044', nombre: 'Procesador Ryzen 7 7800X3D', categoria: 'Componentes', subcategoria: 'Hardware', marca: 'AMD', stock: 12, estado: 'bajo', ubicacion: 'Vitrina Componentes', precio: 380 },
        { id: 'PRD-045', nombre: 'Procesador Core i9 14900K', categoria: 'Componentes', subcategoria: 'Hardware', marca: 'Intel', stock: 5, estado: 'bajo', ubicacion: 'Vitrina Componentes', precio: 590 },
        { id: 'PRD-046', nombre: 'Placa Base B650 ATX AM5', categoria: 'Componentes', subcategoria: 'Hardware', marca: 'Gigabyte', stock: 20, estado: 'disponible', ubicacion: 'Pasillo 5', precio: 199 },
        { id: 'PRD-047', nombre: 'Disco SSD NVMe 2TB Gen4', categoria: 'Componentes', subcategoria: 'Almacenamiento', marca: 'Samsung', stock: 18, estado: 'disponible', ubicacion: 'Pasillo 5', precio: 160 },
        { id: 'PRD-048', nombre: 'Sistema Refrigeración Líquida 240mm', categoria: 'Componentes', subcategoria: 'Refrigeración', marca: 'Cooler Master', stock: 10, estado: 'bajo', ubicacion: 'Pasillo 6', precio: 95 },
        { id: 'PRD-049', nombre: 'Ventilador Caja 120mm RGB', categoria: 'Componentes', subcategoria: 'Refrigeración', marca: 'Corsair', stock: 80, estado: 'disponible', ubicacion: 'Pasillo 6', precio: 25 },
        { id: 'PRD-050', nombre: 'Fuente Alimentación 850W 80+ Gold', categoria: 'Componentes', subcategoria: 'Cajas y Fuentes', marca: 'Seasonic', stock: 15, estado: 'disponible', ubicacion: 'Pasillo 5', precio: 135 },
        { id: 'PRD-051', semt: 'Caja ATX Cristal Templado', categoria: 'Componentes', subcategoria: 'Cajas y Fuentes', marca: 'NZXT', stock: 11, estado: 'bajo', ubicacion: 'Almacén B', precio: 89 },
        { id: 'PRD-052', nombre: 'Repetidor Mesh WiFi 6 (Pack 2)', categoria: 'Componentes', subcategoria: 'Redes', marca: 'TP-Link', stock: 25, estado: 'disponible', ubicacion: 'Pasillo 6', precio: 120 }
    ],
    pedidos: [
        { id: 'PED-1023', fecha: '2026-04-10', cliente: 'Juan Pérez', monto: 1988, estado: 'en_proceso', origen: 'Online' },
        { id: 'PED-1024', fecha: '2026-04-10', cliente: 'María Gómez', monto: 349, estado: 'incidencia', origen: 'Tienda Fija' },
        { id: 'PED-1025', fecha: '2026-04-09', cliente: 'Carlos Ruiz', monto: 122, estado: 'completado', origen: 'Online' },
        { id: 'PED-1026', fecha: '2026-04-10', cliente: 'Ana Santos', monto: 85, estado: 'pendiente', origen: 'Online' },
        { id: 'PED-1027', fecha: '2026-04-11', cliente: 'Tech Solutions S.L.', monto: 4500, estado: 'pendiente', origen: 'B2B' },
        { id: 'PED-1028', fecha: '2026-04-11', cliente: 'Roberto Blanco', monto: 249, estado: 'en_proceso', origen: 'Online' },
        { id: 'PED-1029', fecha: '2026-04-11', cliente: 'Laura Gómez', monto: 1290, estado: 'pendiente', origen: 'Online' },
        { id: 'PED-1030', fecha: '2026-04-12', cliente: 'Innovaciones Digitales', monto: 8500, estado: 'en_proceso', origen: 'B2B' },
        { id: 'PED-1031', fecha: '2026-04-12', cliente: 'Pedro Martínez', monto: 50, estado: 'completado', origen: 'Tienda Fija' },
        { id: 'PED-1032', fecha: '2026-04-13', cliente: 'Sofia Castro', monto: 349, estado: 'incidencia', origen: 'Online' },
        { id: 'PED-1033', fecha: '2026-04-13', cliente: 'Estudios de Diseño 3D', monto: 3499, estado: 'en_proceso', origen: 'B2B' },
        { id: 'PED-1034', fecha: '2026-04-13', cliente: 'Lucía Fernández', monto: 199, estado: 'completado', origen: 'Online' },
        { id: 'PED-1035', fecha: '2026-04-14', cliente: 'Miguel Ángel', monto: 899, estado: 'pendiente', origen: 'Online' },
        { id: 'PED-1036', fecha: '2026-04-14', cliente: 'Clínica Dental', monto: 650, estado: 'incidencia', origen: 'B2B' },
        { id: 'PED-1037', fecha: '2026-04-14', cliente: 'Andrés López', monto: 65, estado: 'completado', origen: 'Tienda Fija' },
        { id: 'PED-1038', fecha: '2026-04-15', cliente: 'Beatriz Nuñez', monto: 149, estado: 'en_proceso', origen: 'Online' },
        { id: 'PED-1039', fecha: '2026-04-15', cliente: 'Constructora S.A.', monto: 1950, estado: 'pendiente', origen: 'B2B' },
        { id: 'PED-1040', fecha: '2026-04-15', cliente: 'Víctor Hugo', monto: 329, estado: 'completado', origen: 'Online' },
        { id: 'PED-1041', fecha: '2026-04-15', cliente: 'Elena Torres', monto: 45, estado: 'pendiente', origen: 'Tienda Fija' },
        { id: 'PED-1042', fecha: '2026-04-16', cliente: 'Grupo Inversor', monto: 12000, estado: 'incidencia', origen: 'B2B' }
    ],
    incidencias: [
        { id: 'INC-001', fecha: '2026-04-10', categoria: 'Inventario', prioridad: 'Alta', titulo: 'Falta de Stock Crítico', descripcion: 'El monitor PRD-004 figura como disponible en web pero el stock físico es 0.', estado: 'abierta' },
        { id: 'INC-002', fecha: '2026-04-09', categoria: 'Proveedores', prioridad: 'Media', titulo: 'Producto Dañado', descripcion: 'Caja abollada al descargar portátiles del camión de Proyectores Global.', estado: 'resuelta' },
        { id: 'INC-003', fecha: '2026-04-11', categoria: 'Pedidos', prioridad: 'Crítica', titulo: 'Error en Envío B2B', descripcion: 'El pedido PED-1027 contiene teclados en lugar de monitores según reporte del cliente.', estado: 'abierta' },
        { id: 'INC-004', fecha: '2026-04-12', categoria: 'Local', prioridad: 'Baja', titulo: 'Climatización Sala 2', descripcion: 'El aire acondicionado de la sala de servidores hace un ruido inusual.', estado: 'abierta' },
        { id: 'INC-005', fecha: '2026-04-12', categoria: 'App', prioridad: 'Alta', titulo: 'Lentitud en Checkout', descripcion: 'Varios usuarios reportan que el simulador B2C tarda en procesar el pago.', estado: 'abierta' }
    ],
    proveedores: [
        { id: 'PROV-1', nombre: 'Global Hardware S.A.', contacto: 'Andrés Valencia', email: 'vientos@globalhw.com', categorias: ['Componentes', 'Ordenadores'], logo: '🏢' },
        { id: 'PROV-2', nombre: 'Periféricos Extreme', contacto: 'Elena Marcos', email: 'contacto@extreme.com', categorias: ['Periféricos'], logo: '🖱️' },
        { id: 'PROV-3', nombre: 'Digital Solutions', contacto: 'Marcos Portillo', email: 'info@digitalsolutions.com', categorias: ['Dispositivos Inteligentes', 'Ordenadores'], logo: '📱' },
        { id: 'PROV-4', nombre: 'Office Logistics', contacto: 'Clara Soto', email: 'logistica@office.com', categorias: ['Impresión Oficina'], logo: '🖨️' }
    ],
    pedidosProveedor: [
        { id: 'ORD-501', proveedorId: 'PROV-1', fecha: '2026-04-05', monto: 12500, estado: 'completado', lineas: [{nombre: 'Tarjeta Gráfica RTX 4060 Ti', cantidad: 20, precioUnitario: 450}] },
        { id: 'ORD-502', proveedorId: 'PROV-2', fecha: '2026-04-12', monto: 2400, estado: 'en_camino', lineas: [{nombre: 'Monitor Gaming 27" 144Hz', cantidad: 10, precioUnitario: 240}] },
        { id: 'ORD-503', proveedorId: 'PROV-3', fecha: '2026-04-13', monto: 5000, estado: 'solicitado', lineas: [{nombre: 'Smartphone X Pro 128GB', cantidad: 8, precioUnitario: 625}] }
    ],
    alertas: [
        { id: 'ALT-1', mensaje: 'Stock crítico: Monitor Gaming 27" 144Hz (PRD-004)', tipo: 'danger' },
        { id: 'ALT-2', mensaje: 'Incidencia abierta en pedido PED-1024', tipo: 'warning' },
        { id: 'ALT-3', mensaje: 'Llegada programada Proveedor Hardware - Hoy 16:00', tipo: 'info' }
    ]
};

// Seed historical orders to populate "Anual" and "Mensual" charts beautifully
if (defaultDB.pedidos.length < 50) {
    const historicalStates = ['completado', 'completado', 'completado', 'completado', 'completado', 'incidencia'];
    for(let i=0; i<80; i++) {
        const daysAgo = Math.floor(Math.random() * 360) + 2; 
        const dateObj = new Date('2026-04-16T12:00:00Z');
        dateObj.setDate(dateObj.getDate() - daysAgo);
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        defaultDB.pedidos.push({
            id: 'PED-H-' + i, fecha: `${y}-${m}-${d}`, cliente: 'Cliente Histórico ' + i, 
            monto: Math.floor(Math.random() * 3000) + 50, 
            estado: historicalStates[Math.floor(Math.random() * historicalStates.length)], origen: 'B2B'
        });
    }
}

// Incrementamos a V9 para el nuevo sistema de proveedores.
const savedData = localStorage.getItem('erp_data_v9'); 
let DB;

if (savedData) {
    DB = JSON.parse(savedData);
} else {
    DB = JSON.parse(JSON.stringify(defaultDB)); 
    // Limpieza de versiones pasadas
    localStorage.removeItem('erp_data'); 
    localStorage.removeItem('erp_data_v2'); 
    localStorage.removeItem('erp_data_v3'); 
    localStorage.removeItem('erp_data_v4'); 
    localStorage.removeItem('erp_data_v5'); 
    localStorage.removeItem('erp_data_v6'); 
    localStorage.removeItem('erp_data_v7'); 
    localStorage.removeItem('erp_data_v8'); 
    localStorage.setItem('erp_data_v9', JSON.stringify(DB));
}

// Helpers
window.saveERPData = function() {
    localStorage.setItem('erp_data_v9', JSON.stringify(window.erpDB));
};

window.resetERPData = function() {
    localStorage.removeItem('erp_data_v8');
    location.reload();
};

window.recalcularKPIs = function() {
    const totalStock = window.erpDB.productos.reduce((acc, curr) => acc + curr.stock, 0);
    const pedidosActivos = window.erpDB.pedidos.filter(p => ['pendiente', 'en_proceso', 'incidencia'].includes(p.estado)).length;
    const incidenciasAbiertas = window.erpDB.incidencias.filter(i => i.estado === 'abierta').length;

    window.erpDB.kpis = { totalStock, pedidosPendientes: pedidosActivos, incidenciasAbiertas };
    
    window.erpDB.productos.forEach(p => {
        if (p.stock <= 0) p.estado = 'agotado';
        else if (p.stock < 15) p.estado = 'bajo';
        else p.estado = 'disponible';
    });

    // Inyectar lineas de productos simuladas en los pedidos si no existen para simular Packing List
    window.erpDB.pedidos.forEach(p => {
        if (!p.lineas) {
            p.lineas = [];
            const rndItems = Math.floor(Math.random() * 3) + 1; // 1 a 3 productos distintos
            let currentTotal = 0;
            for(let i=0; i<rndItems; i++) {
                const randomPrd = window.erpDB.productos[Math.floor(Math.random() * window.erpDB.productos.length)];
                const qty = Math.floor(Math.random() * 2) + 1; // 1 a 2 copias de cada hardware
                p.lineas.push({ nombre: randomPrd.nombre, cantidad: qty, precioUnitario: randomPrd.precio });
                currentTotal += (qty * randomPrd.precio);
            }
            // Forzar monto del pedido a la suma exacta de sus productos al arrancar
            p.monto = currentTotal; 
        }
    });
};

window.erpDB = DB;
window.recalcularKPIs(); 
window.saveERPData();
