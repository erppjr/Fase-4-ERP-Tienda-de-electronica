document.addEventListener('DOMContentLoaded', () => {
    // Referencias al DOM
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const navItems = document.querySelectorAll('.nav-item');
    const viewContainer = document.getElementById('view-container');
    const roleSelect = document.getElementById('role-select');
    const displayRole = document.getElementById('display-role');

    // Estado global de Charts (para destruirlos antes de re-dibujar)
    let doughnutChart = null;
    let barChart = null;
    let categoryCharts = [];

    // --- Manejo del Modo Oscuro / Claro ---
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            htmlElement.removeAttribute('data-theme');
            themeToggleBtn.innerHTML = '<i class="ph ph-sun"></i>';
        } else {
            htmlElement.setAttribute('data-theme', 'dark');
            themeToggleBtn.innerHTML = '<i class="ph ph-moon"></i>';
        }
        // Redibujar gráficas con nuevos colores si estamos en Dashboard
        const currentView = document.querySelector('.nav-item.active').getAttribute('data-view');
        if (currentView === 'dashboard') renderDashboard();
    });

    // --- Manejo de Roles (Prototipo) ---
    window.currentRole = 'gerente';
    roleSelect.addEventListener('change', (e) => {
        window.currentRole = e.target.value;
        const selectedRole = e.target.options[e.target.selectedIndex].text;
        displayRole.textContent = selectedRole;
        
        const proveedoresNav = document.querySelector('[data-view="proveedores"]');
        if (e.target.value === 'tienda') {
            proveedoresNav.style.display = 'none';
        } else {
            proveedoresNav.style.display = 'flex';
        }
        
        const finanzasNav = document.querySelector('[data-view="finanzas"]');
        if (finanzasNav) {
            finanzasNav.style.display = e.target.value === 'gerente' ? 'flex' : 'none';
        }

        const currentView = document.querySelector('.nav-item.active').getAttribute('data-view');
        // Si estaba en finanzas y cede privilegios, expulsar al dashboard
        if (currentView === 'finanzas' && e.target.value !== 'gerente') {
            document.querySelector('.nav-item[data-view="dashboard"]').click();
        } else {
            renderView(currentView);
        }
    });

    // --- Navegación ---
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            document.querySelector('.nav-item.active').classList.remove('active');
            item.classList.add('active');
            const view = item.getAttribute('data-view');
            renderView(view);
        });
    });

    // --- Inyección de Modal ---
    const modalHTML = `
        <div id="app-modal" class="modal-overlay">
            <div class="modal">
                <div class="view-header" style="margin-bottom: 16px;">
                    <h2 id="modal-title" class="view-title" style="font-size: 20px;">Título</h2>
                    <button class="btn btn-secondary" onclick="cerrarModal()" style="padding: 4px;"><i class="ph ph-x"></i></button>
                </div>
                <div id="modal-body"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    window.abrirModal = (title, content) => {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('app-modal').style.display = 'flex';
    };

    window.cerrarModal = () => {
        document.getElementById('app-modal').style.display = 'none';
    };

    // --- Funciones Helpers de Datos ---
    function actualizarKPIs() {
        if(window.recalcularKPIs) window.recalcularKPIs();
        if(window.saveERPData) window.saveERPData();
    }

    // --- Sistema de Vistas ---
    function renderView(viewName) {
        viewContainer.innerHTML = '';
        
        // Destruir gráficos anteriores si existen
        if (doughnutChart) { doughnutChart.destroy(); doughnutChart = null; }
        if (barChart) { barChart.destroy(); barChart = null; }
        categoryCharts.forEach(c => c.destroy());
        categoryCharts = [];

        switch (viewName) {
            case 'dashboard': renderDashboard(); break;
            case 'inventario': renderInventario(); break;
            case 'pedidos': renderPedidos(); break;
            case 'incidencias': renderIncidencias(); break;
            case 'proveedores': renderProveedores(); break;
            case 'finanzas': renderFinanzas(); break;
            default: viewContainer.innerHTML = '<h1>Vista no encontrada</h1>';
        }
    }
    window.renderView = renderView; // Exposición global para que Nivel 2 pueda volver a Categorias

    // --- Render Dashboard ---
    function renderDashboard() {
        actualizarKPIs();
        const { totalStock, pedidosPendientes, incidenciasAbiertas } = window.erpDB.kpis;
        
        let textColor = htmlElement.getAttribute('data-theme') === 'dark' ? '#f3f4f6' : '#111827';
        let gridColor = htmlElement.getAttribute('data-theme') === 'dark' ? '#2e344e' : '#e5e7eb';

        const html = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">Dashboard</h1>
                    <p class="view-subtitle">Monitor de actividad en tiempo real</p>
                </div>
                <button class="btn btn-secondary" onclick="window.resetERPData()"><i class="ph ph-arrows-clockwise"></i> Reset Datos</button>
            </div>

            <div class="card-grid">
                <div class="kpi-card">
                    <div class="kpi-header"><span>Stock Total</span><i class="ph ph-package"></i></div>
                    <div class="kpi-value">${totalStock}</div>
                    <p class="view-subtitle" style="margin-top: 8px;">Capacidad del Almacén</p>
                    <div class="progress-container"><div class="progress-bar" style="width: ${Math.min((totalStock/200)*100, 100)}%; background-color: var(--primary);"></div></div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-header"><span>Pedidos Pendientes</span><i class="ph ph-shopping-cart text-warning"></i></div>
                    <div class="kpi-value text-warning">${pedidosPendientes}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-header"><span>Incidencias Abiertas</span><i class="ph ph-warning-circle text-danger"></i></div>
                    <div class="kpi-value text-danger">${incidenciasAbiertas}</div>
                </div>
            </div>

            <div class="card-grid" style="grid-template-columns: 1fr 1fr;">
                <div class="kpi-card">
                    <h3 style="margin-bottom: 16px;">Ventas y Pedidos</h3>
                    <div class="chart-container"><canvas id="pedidosChart"></canvas></div>
                </div>
                <div class="kpi-card">
                    <h3 style="margin-bottom: 16px;">Stock por Categoría</h3>
                    <div class="chart-container"><canvas id="stockChart"></canvas></div>
                </div>
            </div>
        `;
        viewContainer.innerHTML = html;

        // --- Gráfico de Pedidos (Doughnut) ---
        setTimeout(() => {
            const ctxD = document.getElementById('pedidosChart').getContext('2d');
            const counts = { completado: 0, pendiente: 0, preparacion: 0, incidencia: 0 };
            window.erpDB.pedidos.forEach(p => counts[p.estado]++);

            doughnutChart = new Chart(ctxD, {
                type: 'doughnut',
                data: {
                    labels: ['Completado', 'Pendiente', 'Preparación', 'Incidencia'],
                    datasets: [{
                        data: [counts.completado, counts.pendiente, counts.preparacion, counts.incidencia],
                        backgroundColor: ['#00e676', '#ffb300', '#4d7cff', '#ff3d71'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { color: textColor } } }
                }
            });

            // --- Gráfico de Stock (Bar) ---
            const ctxB = document.getElementById('stockChart').getContext('2d');
            const stockCat = {};
            window.erpDB.productos.forEach(p => {
                stockCat[p.categoria] = (stockCat[p.categoria] || 0) + p.stock;
            });
            
            barChart = new Chart(ctxB, {
                type: 'bar',
                data: {
                    labels: Object.keys(stockCat),
                    datasets: [{
                        label: 'Unidades',
                        data: Object.values(stockCat),
                        backgroundColor: '#4d7cff',
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        y: { ticks: { color: textColor }, grid: { color: gridColor } },
                        x: { ticks: { color: textColor }, grid: { display: false } }
                    },
                    plugins: { legend: { display:false } }
                }
            });
        }, 100);
    }

    // --- Render Inventario Nivel 1 (Estructural) ---
    function renderInventario() {
        actualizarKPIs();
        
        let textColor = htmlElement.getAttribute('data-theme') === 'dark' ? '#f3f4f6' : '#111827';
        const role = roleSelect.value;
        const isAdmin = role === 'gerente' || role === 'almacen';

        // CRUD Simulado Completo
        window.abrirGestionEstructura = () => {
            const cats = window.erpDB.categoriasEstructura.filter(c => c.id !== 'CAT-0');
            const catsOptions = cats.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');

            const adminHtml = `
                <div style="max-height: 60vh; overflow-y: auto; padding-right: 8px;">
                    <h3 style="margin-bottom:8px;font-size:16px;">1. Categorías Principales</h3>
                    <div style="background:var(--bg-color); padding:12px; border-radius:8px; margin-bottom:16px;">
                        <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:4px;">Añadir Categoría</label>
                        <div style="display:flex; gap:8px;">
                            <input type="text" id="nuevo-cat-nombre" class="form-control" placeholder="Ej: Componentes PC" style="flex:1;">
                            <button class="btn btn-secondary" onclick="crearCategoria()">Crear</button>
                        </div>

                        <label style="font-size:12px; color:var(--text-muted); display:block; margin-top:12px; margin-bottom:4px;">Renombrar Categoría</label>
                        <div style="display:flex; gap:8px;">
                            <select id="edit-cat-target" class="form-control" style="width:40%;">
                                ${catsOptions}
                            </select>
                            <input type="text" id="edit-cat-nuevo" class="form-control" placeholder="Nuevo nombre..." style="flex:1;">
                            <button class="btn btn-secondary" onclick="renombrarCategoria()">Renombrar</button>
                        </div>
                    </div>

                    <h3 style="margin-bottom:8px;font-size:16px;">2. Subcategorías Múltiples</h3>
                    <div style="background:var(--bg-color); padding:12px; border-radius:8px; margin-bottom:16px;">
                        <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:4px;">Añadir Subcategoría a una Categoría</label>
                        <div style="display:flex; gap:8px;">
                            <select id="nueva-sub-parent" class="form-control" style="width:40%;">
                                ${catsOptions}
                            </select>
                            <input type="text" id="nuevo-sub-nombre" class="form-control" placeholder="Ej: Tarjetas Gráficas" style="flex:1;">
                            <button class="btn btn-secondary" onclick="crearSubcategoria()">Añadir</button>
                        </div>
                    </div>

                    <hr style="margin:24px 0; border:0; border-top:1px solid var(--border-color);">

                    <div class="form-group">
                        <label class="text-danger" style="font-weight:600;">Eliminar Categoría Entera</label>
                        <p style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">Sus productos irán a "Sin Clasificar".</p>
                        <div style="display:flex; gap:8px;">
                            <select id="delete-cat" class="form-control" style="flex:1;">
                                ${catsOptions}
                            </select>
                            <button class="btn btn-secondary" style="background:#ef4444; color:white; border:none;" onclick="ejecutarEliminarCategoria()">Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
            abrirModal('Gestor de Categorías', adminHtml);
        };

        window.crearCategoria = () => {
            const nombre = document.getElementById('nuevo-cat-nombre').value.trim();
            if(!nombre) return alert('El nombre no puede estar vacío');
            window.erpDB.categoriasEstructura.push({ id: 'CAT-' + Date.now(), nombre: nombre, subcategorias: [] });
            window.saveERPData();
            actualizarKPIs();
            renderView('inventario');
            setTimeout(() => window.abrirGestionEstructura(), 50); // Reabrir modal fresh
        };

        window.renombrarCategoria = () => {
            const oldName = document.getElementById('edit-cat-target').value;
            const newName = document.getElementById('edit-cat-nuevo').value.trim();
            if(!newName || !oldName) return;
            // Renombrar en Estructura
            const cat = window.erpDB.categoriasEstructura.find(c => c.nombre === oldName);
            if(cat) cat.nombre = newName;
            // Propagar a Productos ("CASCADA")
            window.erpDB.productos.forEach(p => { if(p.categoria === oldName) p.categoria = newName; });
            window.saveERPData();
            actualizarKPIs();
            renderView('inventario');
            setTimeout(() => window.abrirGestionEstructura(), 50);
        };

        window.crearSubcategoria = () => {
            const targetCat = document.getElementById('nueva-sub-parent').value;
            const nombre = document.getElementById('nuevo-sub-nombre').value.trim();
            if(!nombre || !targetCat) return;
            const cat = window.erpDB.categoriasEstructura.find(c => c.nombre === targetCat);
            if(cat && !cat.subcategorias.includes(nombre)) {
                cat.subcategorias.push(nombre);
            }
            window.saveERPData();
            actualizarKPIs();
            renderView('inventario');
            setTimeout(() => window.abrirGestionEstructura(), 50);
        };

        window.ejecutarEliminarCategoria = () => {
            const catToDelete = document.getElementById('delete-cat').value;
            window.erpDB.productos.forEach(p => {
                if(p.categoria === catToDelete) {
                    p.categoria = 'Sin Clasificar';
                    p.subcategoria = 'General';
                }
            });
            window.erpDB.categoriasEstructura = window.erpDB.categoriasEstructura.filter(c => c.nombre !== catToDelete);
            window.saveERPData();
            actualizarKPIs();
            cerrarModal();
            renderView('inventario');
        };
        
        const cardsHtml = window.erpDB.categoriasEstructura.map((catObj, index) => {
            const productosCat = window.erpDB.productos.filter(p => p.categoria === catObj.nombre);
            const totalStock = productosCat.reduce((acc, curr) => acc + curr.stock, 0);

            return `
                <div class="kpi-card" style="min-height: 250px;">
                    <div class="kpi-header">
                        <span style="font-size: 16px; font-weight: bold; color: var(--text-main);">${catObj.nombre}</span>
                        <i class="ph ph-list-dashes"></i>
                    </div>
                    <div style="font-size: 24px; font-weight: 700; margin-top: 8px;">${totalStock} <span style="font-size: 14px; font-weight: normal; color: var(--text-muted);">en stock</span></div>
                    
                    <div class="chart-container" style="height: 140px; margin-top: 12px;">
                        <canvas id="catChart-${index}"></canvas>
                    </div>

                    <button class="btn btn-primary" style="margin-top: 16px; width: 100%; justify-content: center;" onclick="window.verProductosCategoria('${catObj.nombre}')">Ver Productos</button>
                </div>
            `;
        }).join('');

        viewContainer.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">Categorías de Inventario</h1>
                    <p class="view-subtitle">Estructura B2B y Distribución del stock</p>
                </div>
                ${isAdmin ? `<button class="btn btn-secondary" onclick="abrirGestionEstructura()"><i class="ph ph-sliders"></i> Gestor de Categorías</button>` : ''}
            </div>
            <div class="card-grid">
                ${cardsHtml}
            </div>
        `;

        // Renderizar gráficas
        setTimeout(() => {
            window.erpDB.categoriasEstructura.forEach((catObj, index) => {
                const canvasEl = document.getElementById('catChart-' + index);
                if(!canvasEl) return;
                const ctx = canvasEl.getContext('2d');
                
                const subCats = {};
                window.erpDB.productos.filter(p => p.categoria === catObj.nombre).forEach(p => {
                    subCats[p.subcategoria] = (subCats[p.subcategoria] || 0) + p.stock;
                });
                
                const backgroundColors = ['#4d7cff', '#00e676', '#ffb300', '#ff3d71', '#d500f9', '#00e5ff'];
                
                // Si la categoría esta vacía, grafico gris
                if(Object.keys(subCats).length === 0) {
                     categoryCharts.push(new Chart(ctx, { type: 'doughnut', data: { labels:['Vacío'], datasets:[{data:[1], backgroundColor:['#e5e7eb']}] }, options: {plugins:{legend:{display:false}}, responsive:true, maintainAspectRatio:false} }));
                     return;
                }

                const chart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(subCats),
                        datasets: [{
                            data: Object.values(subCats),
                            backgroundColor: backgroundColors.slice(0, Object.keys(subCats).length),
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: { color: textColor, boxWidth: 12, font: { size: 10 } }
                            }
                        }
                    }
                });
                categoryCharts.push(chart);
            });
        }, 100);
    }

    // Nivel 2: Tabla de productos filtrados
    let activeFilters = new Set();
    
    // Objeto temporal para filtros de tabla (además de subcats)
    let tableFilters = { loc: 'all', brand: 'all', sortName: 'asc', sortStock: 'none' };

    window.toggleSubcatFilter = (subcat) => {
        if (activeFilters.has(subcat)) activeFilters.delete(subcat);
        else activeFilters.add(subcat);
        renderNivel2Completo(document.getElementById('nivel2-catname').value);
    };

    window.aplicarToolbarFiltros = () => {
        tableFilters.loc = document.getElementById('filt-loc').value;
        tableFilters.brand = document.getElementById('filt-brand').value;
        tableFilters.sortName = document.getElementById('filt-sort-name').value;
        tableFilters.sortStock = document.getElementById('filt-sort-stock').value;
        renderNivel2Completo(document.getElementById('nivel2-catname').value);
    }

    window.verProductosCategoria = (catName) => {
        activeFilters.clear(); 
        tableFilters = { loc: 'all', brand: 'all', sortName: 'asc', sortStock: 'none' };
        renderNivel2Completo(catName);
    };

    function renderNivel2Completo(catName) {
        categoryCharts.forEach(c => c.destroy());
        categoryCharts = [];

        const role = roleSelect.value;
        const isAdmin = role === 'gerente' || role === 'almacen';

        window.ajustarStock = (idStr) => {
            const prd = window.erpDB.productos.find(p => p.id === idStr);
            const content = `
                <div class="form-group">
                    <label>Producto</label>
                    <input type="text" class="form-control" value="${prd.nombre}" disabled>
                </div>
                <div class="form-group">
                    <label>Nuevo Stock Absoluto</label>
                    <input type="number" id="input-stock" class="form-control" value="${prd.stock}">
                </div>
                <input type="hidden" id="ajuste-cat" value="${catName}">
                <button class="btn btn-primary" onclick="guardarStock('${prd.id}')">Guardar Cambios</button>
            `;
            abrirModal('Ajustar Stock', content);
        };

        window.guardarStock = (idStr) => {
            const newVal = parseInt(document.getElementById('input-stock').value);
            const volverCat = document.getElementById('ajuste-cat').value;
            const prd = window.erpDB.productos.find(p => p.id === idStr);
            if (!isNaN(newVal) && newVal >= 0) {
                prd.stock = newVal;
                actualizarKPIs();
                cerrarModal();
                renderNivel2Completo(volverCat);
            }
        };

        const productosOriginales = window.erpDB.productos.filter(p => p.categoria === catName);
        const refMap = {};
        
        // Estructura de la categoría actual (fija las píldoras base aunque esten vacías)
        const catObj = window.erpDB.categoriasEstructura.find(c => c.nombre === catName);
        let subcatsArray = catObj ? catObj.subcategorias : [];

        // Extraer subcat reales por seguridad
        productosOriginales.forEach(p => {
            if(!subcatsArray.includes(p.subcategoria)) subcatsArray.push(p.subcategoria);
        });

        // Contar refs 
        subcatsArray.forEach(sub => refMap[sub] = 0);
        productosOriginales.forEach(p => refMap[p.subcategoria]++);

        // Listas dinámicas para toolbar
        const localizacionesUnicas = [...new Set(productosOriginales.map(p => p.ubicacion))].sort();
        const marcasUnicas = [...new Set(productosOriginales.map(p => p.marca))].sort();

        const matrixHtml = subcatsArray.map((sub, index) => {
            const isActive = activeFilters.has(sub);
            // Cada píldora ahora tiene un hueco para un micro chart
            return `
                <div class="subcat-card ${isActive ? 'active' : ''}" onclick="toggleSubcatFilter('${sub}')">
                    <div style="display:flex; flex-direction:column;">
                        <span>${sub}</span>
                        <span class="badge-count" style="margin-top:4px;width:fit-content;">${refMap[sub]} ref</span>
                    </div>
                    ${refMap[sub] > 0 ? `<div class="subcat-chart-wrapper"><canvas id="microChart-${index}"></canvas></div>` : ''}
                </div>
            `;
        }).join('');

        // 1. Filtrar
        let productosFiltrados = productosOriginales;
        if (activeFilters.size > 0) productosFiltrados = productosFiltrados.filter(p => activeFilters.has(p.subcategoria));
        if (tableFilters.loc !== 'all') productosFiltrados = productosFiltrados.filter(p => p.ubicacion === tableFilters.loc);
        if (tableFilters.brand !== 'all') productosFiltrados = productosFiltrados.filter(p => p.marca === tableFilters.brand);

        // 2. Ordenar
        productosFiltrados.sort((a, b) => {
            let stockDiff = 0;
            if (tableFilters.sortStock === 'asc') stockDiff = a.stock - b.stock;
            else if (tableFilters.sortStock === 'desc') stockDiff = b.stock - a.stock;
            
            if (stockDiff !== 0) return stockDiff;
            
            if (tableFilters.sortName === 'asc') return a.nombre.localeCompare(b.nombre);
            if (tableFilters.sortName === 'desc') return b.nombre.localeCompare(a.nombre);
            
            return 0;
        });

        const filas = productosFiltrados.map(p => {
            const estadoClase = p.estado === 'disponible' ? 'success' : (p.estado === 'bajo' ? 'warning' : 'danger');
            return `
                <tr>
                    <td style="font-weight: 600;">${p.id}</td>
                    <td>${p.nombre}</td>
                    <td><span style="display:block;font-size:11px;color:var(--text-muted);">${p.subcategoria}</span><b>${p.marca}</b></td>
                    <td><span class="status ${estadoClase}">${p.stock} unid.</span></td>
                    <td>${p.ubicacion}</td>
                    <td>
                        ${isAdmin ? `<button class="btn btn-secondary" onclick="ajustarStock('${p.id}')"><i class="ph ph-pencil-simple"></i> Ajustar</button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');

        viewContainer.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">Inventario: ${catName}</h1>
                </div>
                <button class="btn btn-secondary" onclick="window.renderView('inventario')"><i class="ph ph-arrow-left"></i> Volver a Categorías</button>
            </div>
            
            <input type="hidden" id="nivel2-catname" value="${catName}">
            
            <!-- Matrix B2B (Filtros Subcat) -->
            <div class="subcat-matrix">
                ${matrixHtml}
            </div>

            <!-- Toolbar B2B (Filtros Tabla) -->
            <div class="table-toolbar">
                <div style="display:flex;align-items:center;gap:8px;">
                    <i class="ph ph-funnel" style="font-size:18px;"></i>
                    <select id="filt-loc" class="form-control" onchange="aplicarToolbarFiltros()">
                        <option value="all">Todas las Ubicaciones</option>
                        ${localizacionesUnicas.map(loc => `<option value="${loc}" ${tableFilters.loc===loc?'selected':''}>${loc}</option>`).join('')}
                    </select>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <i class="ph ph-tag" style="font-size:18px;"></i>
                    <select id="filt-brand" class="form-control" onchange="aplicarToolbarFiltros()">
                        <option value="all">Todas las Marcas</option>
                        ${marcasUnicas.map(b => `<option value="${b}" ${tableFilters.brand===b?'selected':''}>${b}</option>`).join('')}
                    </select>
                </div>
                <div style="display:flex;align-items:center;gap:8px;margin-left:auto;">
                    <i class="ph ph-sort-ascending" style="font-size:18px;"></i>
                    <select id="filt-sort-name" class="form-control" onchange="aplicarToolbarFiltros()" style="min-width: 130px;">
                        <option value="none" ${tableFilters.sortName==='none'?'selected':''}>-- Orden Nombre --</option>
                        <option value="asc" ${tableFilters.sortName==='asc'?'selected':''}>Nombre (A-Z)</option>
                        <option value="desc" ${tableFilters.sortName==='desc'?'selected':''}>Nombre (Z-A)</option>
                    </select>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <i class="ph ph-list-numbers" style="font-size:18px;"></i>
                    <select id="filt-sort-stock" class="form-control" onchange="aplicarToolbarFiltros()" style="min-width: 130px;">
                        <option value="none" ${tableFilters.sortStock==='none'?'selected':''}>-- Orden Stock --</option>
                        <option value="asc" ${tableFilters.sortStock==='asc'?'selected':''}>Menor Stock Primero</option>
                        <option value="desc" ${tableFilters.sortStock==='desc'?'selected':''}>Mayor Stock Primero</option>
                    </select>
                </div>
            </div>

            <div class="table-container">
                <table>
                    <thead><tr><th>ID</th><th>Nombre</th><th>Subcategoría y Marca</th><th>Stock</th><th>Ubicación</th><th>Acciones</th></tr></thead>
                    <tbody>
                        ${filas.length > 0 ? filas : '<tr><td colspan="6" style="text-align:center; padding: 32px;">No hay productos que coincidan con los filtros</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;

        // Renderizar mini charts post-DOM
        setTimeout(() => {
            subcatsArray.forEach((sub, index) => {
                if(refMap[sub] === 0) return; // Si no hay canvas, saltar.
                const ctx = document.getElementById('microChart-' + index);
                if(!ctx) return;

                // Extraer desglose de marcas para la subcategoría
                const marcaStats = {};
                productosOriginales.filter(p => p.subcategoria === sub).forEach(p => {
                    marcaStats[p.marca] = (marcaStats[p.marca] || 0) + 1; // Unidades relativas (referencias o stock, usamos refs)
                });
                const colors = ['#4d7cff', '#00e676', '#ffb300', '#ff3d71', '#d500f9', '#00e5ff'];

                const mChart = new Chart(ctx.getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(marcaStats),
                        datasets: [{
                            data: Object.values(marcaStats),
                            backgroundColor: colors.slice(0, Object.keys(marcaStats).length),
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '60%', // hueco grande para ser un mini anillo
                        plugins: {
                            legend: { display: false },
                            tooltip: { // Minimalista
                                callbacks: {
                                    label: function(context) { return ' ' + context.label + ': ' + context.raw; }
                                }
                            }
                        }
                    }
                });
                categoryCharts.push(mChart);
            });
        }, 100);
    }

    // --- Render Pedidos Dashboard (Nivel 1 & 2) ---
    let pedidosChartsArray = []; // Control de multigraficas
    window.pedidosTimeFilter = window.pedidosTimeFilter || '7d';

    window.cambiarFiltroGraficaPedidos = (filter) => {
        window.pedidosTimeFilter = filter;
        renderView('pedidos'); 
    };

    window.verPedidosEstado = (estado) => {
        renderPedidosNivel2(estado);
    };

    window.cambiarEstadoPedidoGlobal = (idStr, selElement, returnToState) => {
        const targetEstado = selElement.value;
        const p = window.erpDB.pedidos.find(x => x.id === idStr);

        if (targetEstado === 'incidencia') {
            // Revertir el selector visualmente hasta que se confirme en el modal
            selElement.value = p.estado; 
            abrirModalReporteIncidenciaPedido(idStr, returnToState);
            return;
        }

        p.estado = targetEstado;
        window.saveERPData();
        actualizarKPIs();
        
        if (returnToState) {
            renderPedidosNivel2(returnToState); // Nivel 2
        } else {
            renderView('pedidos'); // Nivel 1 refresh
        }
    };

    window.abrirModalReporteIncidenciaPedido = (pedidoId, returnToState) => {
        const content = `
            <div style="margin-bottom:20px; padding:12px; background:rgba(255, 61, 113, 0.1); border-radius:8px; border:1px solid rgba(255, 61, 113, 0.2);">
                <p style="margin:0; font-size:13px; color:#ff3d71;"><strong>Atención:</strong> Vas a marcar el pedido <b>${pedidoId}</b> como Incidencia. Esto creará una entrada en el panel de control de incidencias.</p>
            </div>
            <div class="form-group">
                <label>Prioridad del Problema</label>
                <select id="modal-inc-prio" class="form-control">
                    <option value="Baja">Baja</option>
                    <option value="Media" selected>Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                </select>
            </div>
            <div class="form-group">
                <label>Asunto Breve</label>
                <input type="text" id="modal-inc-titulo" class="form-control" placeholder="Ej: Error en dirección de entrega">
            </div>
            <div class="form-group">
                <label>Descripción del Problema</label>
                <textarea id="modal-inc-desc" class="form-control" rows="4" placeholder="Detalla qué ha ocurrido..."></textarea>
            </div>
            <button class="btn btn-primary" style="width:100%;" onclick="confirmarIncidenciaDesdePedido('${pedidoId}', '${returnToState}')">Confirmar y Reportar</button>
        `;
        abrirModal('Reportar Incidencia en Pedido', content);
    };

    window.confirmarIncidenciaDesdePedido = (pedidoId, returnToState) => {
        const titulo = document.getElementById('modal-inc-titulo').value.trim();
        const desc = document.getElementById('modal-inc-desc').value.trim();
        const prio = document.getElementById('modal-inc-prio').value;

        if(!titulo || !desc) return alert('Por favor, indica un asunto y descripción.');

        // 1. Crear incidencia
        const nuevaInc = {
            id: 'INC-' + (window.erpDB.incidencias.length + 500),
            fecha: new Date().toLocaleDateString('sv-SE'),
            categoria: 'Pedidos',
            prioridad: prio,
            titulo: titulo,
            descripcion: desc,
            estado: 'abierta',
            relacionId: pedidoId
        };
        window.erpDB.incidencias.unshift(nuevaInc);

        // 2. Marcar pedido
        const p = window.erpDB.pedidos.find(x => x.id === pedidoId);
        if(p) p.estado = 'incidencia';

        window.saveERPData();
        actualizarKPIs();
        cerrarModal();
        
        if (returnToState && returnToState !== 'undefined') {
            renderPedidosNivel2(returnToState); 
        } else {
            renderView('pedidos');
        }
    };

    // --- Lógica Dinámica del Simulador Móvil B2C ---
    window.simuladorState = {
        carrito: [],
        vista: 'tienda', // 'tienda' o 'checkout'
        cliente: 'Cliente Mobile VIP'
    };

    window.simAddToCart = (id) => {
        const p = window.erpDB.productos.find(x => x.id === id);
        if(!p) return;
        const exists = window.simuladorState.carrito.find(x => x.id === id);
        if(exists) exists.cantidad++;
        else window.simuladorState.carrito.push({ id: p.id, nombre: p.nombre, precioUnitario: p.precio, cantidad: 1 });
        window.renderSimUI();
    };

    window.simRemoveFromCart = (id) => {
        const idx = window.simuladorState.carrito.findIndex(x => x.id === id);
        if(idx > -1) {
            window.simuladorState.carrito[idx].cantidad--;
            if(window.simuladorState.carrito[idx].cantidad <= 0) window.simuladorState.carrito.splice(idx, 1);
        }
        window.renderSimUI();
    };

    window.simSetVista = (v) => {
        window.simuladorState.vista = v;
        window.renderSimUI();
    };

    window.simSetCliente = (val) => {
        window.simuladorState.cliente = val;
    };

    window.ejecutarCompraSimulada = () => {
        if(window.simuladorState.carrito.length === 0) return alert('El carrito está vacío. Añade algún producto primero.');
        
        let total = 0;
        const lineas = window.simuladorState.carrito.map(item => {
            total += item.precioUnitario * item.cantidad;
            return { nombre: item.nombre, cantidad: item.cantidad, precioUnitario: item.precioUnitario };
        });

        const nextId = window.erpDB.pedidos.length + 1000;
        const nuevoPedido = {
            id: 'PED-' + nextId,
            fecha: new Date().toLocaleDateString('sv-SE'), // YYYY-MM-DD local
            cliente: window.simuladorState.cliente || 'Usuario App',
            monto: total,
            estado: 'pendiente',
            origen: 'Online',
            lineas: lineas
        };

        window.erpDB.pedidos.unshift(nuevoPedido); 
        window.saveERPData();
        window.cerrarModal();
        window.actualizarKPIs();
        window.renderView('pedidos');
    };

    window.renderSimUI = () => {
        const s = window.simuladorState;
        const container = document.getElementById('sim-body');
        const footer = document.getElementById('sim-footer');
        const badge = document.getElementById('sim-cart-badge');
        
        if(!container || !footer || !badge) return;

        let totalCartElements = s.carrito.reduce((acc, curr) => acc + curr.cantidad, 0);
        badge.textContent = totalCartElements;
        badge.style.display = totalCartElements > 0 ? 'flex' : 'none';

        if (s.vista === 'tienda') {
            const catalogo = window.erpDB.productos.filter(p => p.estado !== 'agotado').slice(0, 15);
            const articulosHtm = catalogo.map(p => `
                <div style="background:#fff; padding:12px; border-radius:12px; display:flex; gap:12px; margin-bottom:12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); align-items:center;">
                    <div style="width:50px; height:50px; background:#f3f4f6; border-radius:8px; display:flex; align-items:center; justify-content:center;"><i class="ph ph-package" style="font-size:24px; color:#4d7cff;"></i></div>
                    <div style="flex:1;">
                        <div style="font-weight:600; font-size:13px; line-height:1.2; margin-bottom:4px;">${p.nombre}</div>
                        <div style="font-weight:700; color:#1f2937; margin-top:4px;">$${p.precio}</div>
                    </div>
                    <button onclick="window.simAddToCart('${p.id}')" style="background:var(--primary); color:white; border:none; width:32px; height:32px; border-radius:16px; cursor:pointer; display:flex; align-items:center; justify-content:center;"><i class="ph ph-plus" style="font-weight:bold;"></i></button>
                </div>
            `).join('');

            container.innerHTML = `
                <h3 style="font-size:16px; margin: 0 0 16px 0;">Catálogo (Stock Real)</h3>
                ${articulosHtm}
            `;
            footer.innerHTML = `
                <button onclick="window.simSetVista('checkout')" style="width:100%; background: #111827; color:#fff; border:none; padding:16px; border-radius:12px; font-weight:bold; font-size:14px; cursor:pointer;">Ir al Checkout (${totalCartElements} items)</button>
            `;
        } else {
            // Vista Checkout
            const itemsHtml = s.carrito.length === 0 ? '<div style="text-align:center; padding:30px; color:#6b7280;">Carrito vacío</div>' : s.carrito.map(c => `
                <div style="background:#fff; padding:12px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
                    <div style="font-size:12px; font-weight:600; flex:1;">${c.nombre} <br/><span style="color:#6b7280; font-size:11px;">$${c.precioUnitario} / ud</span></div>
                    <div style="display:flex; align-items:center; gap:12px; margin-left:12px;">
                        <button onclick="window.simRemoveFromCart('${c.id}')" style="border:1px solid #e5e7eb; background:#fff; border-radius:16px; width:24px; height:24px; display:flex; align-items:center; justify-content:center; cursor:pointer;">-</button>
                        <span style="font-weight:bold;">${c.cantidad}</span>
                        <button onclick="window.simAddToCart('${c.id}')" style="border:1px solid #e5e7eb; background:#fff; border-radius:16px; width:24px; height:24px; display:flex; align-items:center; justify-content:center; cursor:pointer;">+</button>
                    </div>
                </div>
            `).join('');

            const grandTotal = s.carrito.reduce((acc, curr) => acc + (curr.precioUnitario * curr.cantidad), 0);

            container.innerHTML = `
                <button onclick="window.simSetVista('tienda')" style="background:transparent; border:none; color:#4d7cff; padding:0; margin-bottom:16px; cursor:pointer; font-weight:bold; display:flex; align-items:center; gap:4px;"><i class="ph ph-arrow-left"></i> Volver a Tienda</button>
                <h3 style="font-size:16px; margin: 0 0 16px 0;">Tu Pedido</h3>
                ${itemsHtml}
                <div style="margin-top:24px;">
                    <label style="font-size:12px; font-weight:bold; color:#6b7280;">Nombre de Usuario (Para el envío):</label>
                    <input type="text" value="${s.cliente}" onkeyup="window.simSetCliente(this.value)" style="width:100%; padding:12px; border:1px solid #d1d5db; border-radius:8px; margin-top:8px; font-size:14px; font-family:Inter; box-sizing:border-box; background:#fff; color:#111827;">
                </div>
            `;
            footer.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                    <span style="color:#6b7280; font-size:14px;">Total a Pagar</span>
                    <span style="color:#111827; font-weight:800; font-size:18px;">$${grandTotal.toLocaleString()}</span>
                </div>
                <button onclick="window.ejecutarCompraSimulada()" style="width:100%; background: linear-gradient(135deg, #6366f1, #4d7cff); color:#fff; border:none; padding:16px; border-radius:12px; font-weight:bold; font-size:16px; display:flex; justify-content:center; align-items:center; gap:8px; cursor:pointer;"><i class="ph ph-apple-logo" style="font-size:20px;"></i> Pagar a ERP</button>
            `;
        }
    };

    window.abrirSimuladorMobile = () => {
        window.simuladorState.carrito = [];
        window.simuladorState.vista = 'tienda';
        
        const html = `
        <div style="display:flex; justify-content:center; align-items:center; width:100%; margin: 20px 0;">
            <div style="width: 350px; height: 650px; background: #fff; border-radius: 40px; border: 12px solid #111827; position: relative; overflow: hidden; display:flex; flex-direction:column; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
                <!-- top notch y barra de estado -->
                <div style="position:absolute; top:0; left:50%; transform:translateX(-50%); width: 140px; height: 25px; background: #111827; border-bottom-left-radius: 18px; border-bottom-right-radius: 18px; z-index:10;"></div>
                <div style="height: 35px; background: #fff; width:100%; display:flex; justify-content:space-between; padding: 0 24px; align-items:center; font-size:12px; font-weight:bold; color:#111827; margin-top:4px;">
                    <span>12:45</span>
                    <div style="display:flex; gap:6px;">
                        <i class="ph-fill ph-cell-signal-full"></i>
                        <i class="ph-fill ph-wifi-high"></i>
                        <i class="ph-fill ph-battery-full"></i>
                    </div>
                </div>
                <!-- header app -->
                <div style="background: #ffffff; padding: 12px 20px; border-bottom: 1px solid #f3f4f6; color: #111827; display:flex; justify-content:space-between; align-items:center;">
                    <i class="ph ph-list" style="font-size:22px; cursor:pointer;"></i>
                    <span style="font-weight:900; letter-spacing:1px; font-size:16px;">V-SHOP<span style="color:#6366f1;">.IO</span></span>
                    <div style="position:relative; cursor:pointer;" onclick="window.simSetVista('checkout')">
                        <i class="ph ph-bag" style="font-size:22px;"></i>
                        <span id="sim-cart-badge" style="position:absolute; top:-4px; right:-6px; background:#ff3d71; color:white; font-size:9px; font-weight:bold; height:16px; min-width:16px; border-radius:8px; display:none; align-items:center; justify-content:center;">0</span>
                    </div>
                </div>
                <!-- body items dinamico -->
                <div id="sim-body" style="flex: 1; overflow-y: auto; padding: 20px; background: #f9fafb; color: #111827; text-align:left;">
                </div>
                <!-- footer / checkout dinamico -->
                <div id="sim-footer" style="background: #ffffff; padding: 20px; border-top: 1px solid #e5e7eb;">
                </div>
            </div>
        </div>
        `;
        window.abrirModal("Simulador B2C (Tienda Real)", html);
        setTimeout(() => window.renderSimUI(), 10);
    };

    function renderPedidos() {
        actualizarKPIs();
        
        if (pedidosChartsArray.length > 0) {
            pedidosChartsArray.forEach(c => c && c.destroy());
            pedidosChartsArray = [];
        }
        
        // 1. Calcular KPIs
        const stats = {
            pendiente: { count: 0, monto: 0, color: '#ffb300', bg: 'rgba(255, 179, 0, 0.1)', icon: 'ph-clock' },
            en_proceso: { count: 0, monto: 0, color: '#4d7cff', bg: 'rgba(77, 124, 255, 0.1)', icon: 'ph-package' },
            completado: { count: 0, monto: 0, color: '#00e676', bg: 'rgba(0, 230, 118, 0.1)', icon: 'ph-check-circle' },
            incidencia: { count: 0, monto: 0, color: '#ff3d71', bg: 'rgba(255, 61, 113, 0.1)', icon: 'ph-warning-circle' }
        };

        window.erpDB.pedidos.forEach(p => {
            if (stats[p.estado]) {
                stats[p.estado].count++;
                stats[p.estado].monto += p.monto;
            }
        });

        const cardsHtml = Object.keys(stats).map(estado => {
            const data = stats[estado];
            const titulo = estado.charAt(0).toUpperCase() + estado.slice(1);
            return `
                <div class="kpi-card" style="cursor: pointer; transition: all 0.2s; border-left: 4px solid ${data.color};" onclick="window.verPedidosEstado('${estado}')">
                    <div class="kpi-header">
                        <span style="font-size: 16px; font-weight: bold; color: var(--text-main);">${titulo}</span>
                        <i class="ph ${data.icon}" style="color: ${data.color}; background: ${data.bg}; font-size:24px; padding: 8px; border-radius: 8px;"></i>
                    </div>
                    <div style="font-size: 32px; font-weight: 700; margin-top: 12px; color: ${data.color};">${data.count} <span style="font-size: 14px; font-weight: normal; color: var(--text-muted);">pedidos</span></div>
                    <div style="font-size: 16px; font-weight: 500; margin-top: 4px; color: var(--text-main);">$${data.monto.toLocaleString()} <span style="font-size: 12px; font-weight: normal; color: var(--text-muted);">retenidos</span></div>
                    <button class="btn btn-secondary" style="margin-top:20px; width:100%; border:1px solid ${data.color}; color:${data.color}; background:transparent;">Ver Filtro</button>
                </div>
            `;
        }).join('');

        viewContainer.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">Dashboard Analítico de Pedidos</h1>
                    <p class="view-subtitle">Monitor de envíos y embudo logístico B2B</p>
                </div>
                <button class="btn btn-primary" onclick="window.abrirSimuladorMobile()" style="background: linear-gradient(135deg, #6366f1, #a855f7); border:none; border-radius:30px; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4); padding: 10px 24px; font-weight:bold; letter-spacing:0.5px;"><i class="ph ph-device-mobile"></i> Simulador B2C</button>
            </div>
            
            <div class="card-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                ${cardsHtml}
            </div>

            <div class="kpi-card" style="margin-top: 12px; padding: 24px;">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom: 24px;">
                    <h3 style="font-size: 18px; margin:0;">Análisis Multicanal de Estados</h3>
                    <div style="display:flex; gap: 8px;">
                        <span style="font-size:12px; color:var(--text-muted); display:flex; align-items:center;">Filtro Temporal:</span>
                        <select id="pedidos-chart-filter" class="form-control" style="width: auto; cursor:pointer;" onchange="window.cambiarFiltroGraficaPedidos(this.value)">
                            <option value="hoy" ${window.pedidosTimeFilter === 'hoy' ? 'selected' : ''}>Día de Hoy</option>
                            <option value="7d" ${window.pedidosTimeFilter === '7d' ? 'selected' : ''}>Última Semana</option>
                            <option value="30d" ${window.pedidosTimeFilter === '30d' ? 'selected' : ''}>Mensual (30 d)</option>
                            <option value="1y" ${window.pedidosTimeFilter === '1y' ? 'selected' : ''}>Anual (Meses)</option>
                        </select>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
                    <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: rgba(0,0,0,0.01);">
                        <h4 style="font-size: 13px; margin-bottom: 16px; color: #00e676; text-transform:uppercase; letter-spacing:0.5px;">Evolución: Completados</h4>
                        <div class="chart-container" style="height: 180px; width: 100%;"><canvas id="chart-completado"></canvas></div>
                    </div>
                    <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: rgba(0,0,0,0.01);">
                        <h4 style="font-size: 13px; margin-bottom: 16px; color: #4d7cff; text-transform:uppercase; letter-spacing:0.5px;">Evolución: En Proceso</h4>
                        <div class="chart-container" style="height: 180px; width: 100%;"><canvas id="chart-en-proceso"></canvas></div>
                    </div>
                    <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: rgba(0,0,0,0.01);">
                        <h4 style="font-size: 13px; margin-bottom: 16px; color: #ffb300; text-transform:uppercase; letter-spacing:0.5px;">Evolución: Pendientes</h4>
                        <div class="chart-container" style="height: 180px; width: 100%;"><canvas id="chart-pendiente"></canvas></div>
                    </div>
                    <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: rgba(0,0,0,0.01);">
                        <h4 style="font-size: 13px; margin-bottom: 16px; color: #ff3d71; text-transform:uppercase; letter-spacing:0.5px;">Evolución: Incidencias</h4>
                        <div class="chart-container" style="height: 180px; width: 100%;"><canvas id="chart-incidencia"></canvas></div>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            pedidosChartsArray.forEach(c => c && c.destroy());
            pedidosChartsArray = [];

            // 2. Base date: simulate current day of prototype (max date in db)
            const allDates = window.erpDB.pedidos.map(p => p.fecha).sort();
            const maxDateStr = allDates[allDates.length - 1] || '2026-04-16';
            const baseDate = new Date(maxDateStr + "T00:00:00Z");

            let filteredPedidos = window.erpDB.pedidos;
            let groupFormat = 'daily'; 
            
            if (window.pedidosTimeFilter === 'hoy') {
                filteredPedidos = window.erpDB.pedidos.filter(p => p.fecha === maxDateStr);
            } else if (window.pedidosTimeFilter === '7d') {
                const limitDate = new Date(baseDate); limitDate.setDate(limitDate.getDate() - 7);
                filteredPedidos = window.erpDB.pedidos.filter(p => new Date(p.fecha + "T00:00:00Z") >= limitDate);
            } else if (window.pedidosTimeFilter === '30d') {
                const limitDate = new Date(baseDate); limitDate.setDate(limitDate.getDate() - 30);
                filteredPedidos = window.erpDB.pedidos.filter(p => new Date(p.fecha + "T00:00:00Z") >= limitDate);
            } else if (window.pedidosTimeFilter === '1y') {
                const limitDate = new Date(baseDate); limitDate.setFullYear(limitDate.getFullYear() - 1);
                filteredPedidos = window.erpDB.pedidos.filter(p => new Date(p.fecha + "T00:00:00Z") >= limitDate);
                groupFormat = 'monthly';
            }
            
            const datesMap = {};
            filteredPedidos.forEach(p => {
                let key = p.fecha;
                if (groupFormat === 'monthly') {
                    key = p.fecha.substring(0, 7); // agrupar por YYYY-MM
                }
                // Convert today to hour chunks if 'hoy'? No, just show 1 point or keep it simple.
                if(!datesMap[key]) datesMap[key] = { pendiente: 0, en_proceso: 0, completado: 0, incidencia: 0 };
                datesMap[key][p.estado] = (datesMap[key][p.estado] || 0) + 1;
            });
            
            const totalesPorEstado = { pendiente: 0, en_proceso: 0, completado: 0, incidencia: 0 };
            
            const sortedDates = Object.keys(datesMap).sort();
            
            // Fix si chart se queda en blanco por tener solo 1 o 0 puntos
            if(sortedDates.length === 0) sortedDates.push(groupFormat === 'monthly' ? maxDateStr.substring(0,7) : maxDateStr);
            if(sortedDates.length === 1 && datesMap[sortedDates[0]] === undefined) {
                datesMap[sortedDates[0]] = { pendiente: 0, en_proceso: 0, completado: 0, incidencia: 0 };
            }
            
            const revenuePorFecha = sortedDates.map(d => 0);
            const volumenPorFecha = sortedDates.map(d => 0);

            filteredPedidos.forEach(p => {
                totalesPorEstado[p.estado]++;
                let key = p.fecha;
                if (groupFormat === 'monthly') key = p.fecha.substring(0, 7);
                const index = sortedDates.indexOf(key);
                if(index > -1) {
                    revenuePorFecha[index] += p.monto;
                    volumenPorFecha[index]++;
                }
            });
            
            const dataPendiente = sortedDates.map(d => datesMap[d].pendiente);
            const dataEnProceso = sortedDates.map(d => datesMap[d].en_proceso);
            const dataCompletado = sortedDates.map(d => datesMap[d].completado);
            const dataIncidencia = sortedDates.map(d => datesMap[d].incidencia);

            let textColor = htmlElement.getAttribute('data-theme') === 'dark' ? '#f3f4f6' : '#111827';
            let gridColor = htmlElement.getAttribute('data-theme') === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
            
            const colorsObj = {
                completado: { border: '#00e676', soft: 'rgba(0, 230, 118, 0.1)' },
                en_proceso: { border: '#4d7cff', soft: 'rgba(77, 124, 255, 0.1)' },
                pendiente: { border: '#ffb300', soft: 'rgba(255, 179, 0, 0.1)' },
                incidencia: { border: '#ff3d71', soft: 'rgba(255, 61, 113, 0.1)' }
            };

            const commonOptions = {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                scales: {
                    x: { grid: { display: false, color: gridColor }, ticks: { color: textColor, maxTicksLimit: 6 } },
                    y: { grid: { color: gridColor, borderDash: [4, 4] }, ticks: { color: textColor, stepSize: 1, precision: 0 } }
                },
                interaction: { mode: 'nearest', axis: 'x', intersect: false }
            };

            const buildChart = (id, dataArr, cfs) => {
                const ctx = document.getElementById(id);
                if(!ctx) return;
                const c = new Chart(ctx.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: sortedDates,
                        datasets: [{ data: dataArr, borderColor: cfs.border, backgroundColor: cfs.soft, fill: true, tension: 0.4, borderWidth: 2, pointRadius: 1, pointHoverRadius: 6 }]
                    },
                    options: commonOptions
                });
                pedidosChartsArray.push(c);
            };

            buildChart('chart-completado', dataCompletado, colorsObj.completado);
            buildChart('chart-en-proceso', dataEnProceso, colorsObj.en_proceso);
            buildChart('chart-pendiente', dataPendiente, colorsObj.pendiente);
            buildChart('chart-incidencia', dataIncidencia, colorsObj.incidencia);
        }, 100);
    }

    window.aplicarToolbarFiltrosPedidos = (estadoFiltrado) => {
        window.pedidosTableFilters.fechaSort = document.getElementById('filt-ped-fecha').value;
        window.pedidosTableFilters.origen = document.getElementById('filt-ped-origen').value;
        window.pedidosTableFilters.montoSort = document.getElementById('filt-ped-monto').value;
        renderPedidosNivel2(estadoFiltrado);
    };

    function renderPedidosNivel2(estadoFiltrado) {
        if (pedidosChartsArray.length > 0) {
            pedidosChartsArray.forEach(c => c && c.destroy());
            pedidosChartsArray = [];
        }
        
        window.pedidosTableFilters = window.pedidosTableFilters || { fechaSort: 'desc', origen: 'all', montoSort: 'none' };

        let pedidosFiltrados = window.erpDB.pedidos.filter(p => p.estado === estadoFiltrado);

        if (window.pedidosTableFilters.origen !== 'all') {
            pedidosFiltrados = pedidosFiltrados.filter(p => p.origen === window.pedidosTableFilters.origen);
        }

        pedidosFiltrados.sort((a, b) => {
            if (window.pedidosTableFilters.montoSort !== 'none') {
                if(window.pedidosTableFilters.montoSort === 'desc') return b.monto - a.monto;
                return a.monto - b.monto;
            }
            if (window.pedidosTableFilters.fechaSort === 'asc') {
                return new Date(a.fecha) - new Date(b.fecha);
            }
            return new Date(b.fecha) - new Date(a.fecha);
        });

        window.toggleDetallePedido = (id) => {
            const el = document.getElementById('detalle-' + id);
            if (!el) return;
            // Ocultar todos los demas primero si queremos comportamiento acordeon (opcional, lo dejamos libre)
            if (el.style.display === 'none') el.style.display = 'table-row';
            else el.style.display = 'none';
        };

        const filas = pedidosFiltrados.map(p => {
            let estadoClase;
            switch(p.estado) {
                case 'completado': estadoClase = 'success'; break;
                case 'en_proceso': estadoClase = 'info'; break;
                case 'pendiente': estadoClase = 'warning'; break;
                case 'incidencia': estadoClase = 'danger'; break;
            }
            
            // Generar lineas simuladas inyectadas por DB.js en la startup
            const lineasHtml = (p.lineas || []).map(lin => `
                <li style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color);">
                    <div style="display:flex; gap: 12px; align-items:center;">
                        <span style="background:var(--card-bg); padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold;">${lin.cantidad}x</span>
                        <span style="font-weight: 500;">${lin.nombre}</span>
                    </div>
                    <span>$${(lin.cantidad * lin.precioUnitario).toLocaleString()}</span>
                </li>
            `).join('');

            return `
                <tr style="cursor:pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(99, 102, 241, 0.05)'" onmouseout="this.style.background='transparent'" onclick="window.toggleDetallePedido('${p.id}')">
                    <td style="font-weight: 600; display:flex; align-items:center; gap:8px;"><i class="ph ph-caret-down" style="color:var(--text-muted);"></i>${p.id}</td>
                    <td>${p.fecha}</td>
                    <td><span style="display:block;font-size:12px;color:var(--text-muted);">${p.origen}</span><b>${p.cliente}</b></td>
                    <td style="font-weight: 600;">$${p.monto.toLocaleString()}</td>
                    <td><span class="status ${estadoClase}">${p.estado.toUpperCase()}</span></td>
                    <td onclick="event.stopPropagation()">
                        <select class="form-control" style="padding: 4px; width: auto;" onchange="cambiarEstadoPedidoGlobal('${p.id}', this, '${estadoFiltrado}')">
                            ${(() => {
                                if (p.estado === 'pendiente') return '<option value="pendiente" selected>Pendiente</option><option value="en_proceso">Pasar a En Proceso</option>';
                                if (p.estado === 'en_proceso') return '<option value="en_proceso" selected>En Proceso</option><option value="completado">Aceptar como Completado</option><option value="incidencia">Reportar Incidencia</option>';
                                if (p.estado === 'completado') return '<option value="completado" selected>Completado</option><option value="incidencia">Devolución (Incidencia)</option>';
                                if (p.estado === 'incidencia') return '<option value="incidencia" selected>Incidencia</option><option value="en_proceso">Volver a Procesar</option>';
                                return '';
                            })()}
                        </select>
                    </td>
                </tr>
                <tr id="detalle-${p.id}" style="display:none; background: rgba(0,0,0,0.02);">
                    <td colspan="6" style="padding: 16px 24px;">
                        <div style="background: var(--bg-color); padding: 20px; border-radius: 8px; border: 1px dashed var(--border-color);">
                            <h4 style="margin-bottom: 16px; font-size:13px; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted);">Lista de Productos (Packing List)</h4>
                            <ul style="list-style:none;">
                                ${lineasHtml}
                            </ul>
                            <div style="text-align:right; margin-top: 16px; font-weight: bold; font-size:16px; padding-top: 12px; border-top: 2px solid var(--border-color);">Pago Total: $${p.monto.toLocaleString()}</div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        const titulo = estadoFiltrado.charAt(0).toUpperCase() + estadoFiltrado.slice(1);

        viewContainer.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">Vista Filtrada: Pedidos ${titulo}</h1>
                    <p class="view-subtitle">Acceso directo B2B</p>
                </div>
                <button class="btn btn-secondary" onclick="renderView('pedidos')"><i class="ph ph-arrow-left"></i> Volver al Dashboard</button>
            </div>
            
            <div class="table-toolbar" style="margin-bottom: 24px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <i class="ph ph-storefront" style="font-size:18px;"></i>
                    <select id="filt-ped-origen" class="form-control" onchange="aplicarToolbarFiltrosPedidos('${estadoFiltrado}')">
                        <option value="all">Cualquier Origen</option>
                        <option value="Online" ${window.pedidosTableFilters.origen==='Online'?'selected':''}>Online</option>
                        <option value="B2B" ${window.pedidosTableFilters.origen==='B2B'?'selected':''}>B2B</option>
                        <option value="Tienda Fija" ${window.pedidosTableFilters.origen==='Tienda Fija'?'selected':''}>Tienda Fija</option>
                    </select>
                </div>
                <div style="display:flex;align-items:center;gap:8px;margin-left:auto;">
                    <i class="ph ph-calendar" style="font-size:18px;"></i>
                    <select id="filt-ped-fecha" class="form-control" onchange="aplicarToolbarFiltrosPedidos('${estadoFiltrado}')">
                        <option value="desc" ${window.pedidosTableFilters.fechaSort==='desc'?'selected':''}>Más Recientes</option>
                        <option value="asc" ${window.pedidosTableFilters.fechaSort==='asc'?'selected':''}>Más Antiguos</option>
                    </select>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <i class="ph ph-currency-dollar" style="font-size:18px;"></i>
                    <select id="filt-ped-monto" class="form-control" onchange="aplicarToolbarFiltrosPedidos('${estadoFiltrado}')">
                        <option value="none" ${window.pedidosTableFilters.montoSort==='none'?'selected':''}>-- Ordenar Precio --</option>
                        <option value="desc" ${window.pedidosTableFilters.montoSort==='desc'?'selected':''}>Mayor a Menor ($)</option>
                        <option value="asc" ${window.pedidosTableFilters.montoSort==='asc'?'selected':''}>Menor a Mayor ($)</option>
                    </select>
                </div>
            </div>

            <div class="kpi-card" style="margin-bottom:24px; padding: 16px; display:inline-flex; align-items:center; gap:16px;">
                <h3 style="font-size: 16px; margin:0;">Resultados: <span style="color:var(--primary);">${pedidosFiltrados.length} pedidos localizados</span></h3>
            </div>

            <div class="table-container">
                <table>
                    <thead><tr><th>ID</th><th>Fecha</th><th>Origen y Cliente</th><th>Monto</th><th>Estado</th><th>Cambiar Estado</th></tr></thead>
                    <tbody>
                        ${filas.length > 0 ? filas : '<tr><td colspan="6" style="text-align:center; padding: 32px;">No hay pedidos en este estado</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    }

    // --- Render Incidencias ---
    const incidenciasCatConfig = {
        'Inventario': { icon: 'ph-package', color: '#4d7cff', desc: 'Stock, almacén y logística física.' },
        'App': { icon: 'ph-device-mobile', color: '#a855f7', desc: 'Simulador B2C y errores de plataforma.' },
        'Pedidos': { icon: 'ph-shopping-cart', color: '#ffb300', desc: 'Devoluciones, cobros y errores B2B.' },
        'Proveedores': { icon: 'ph-truck', color: '#00e676', desc: 'Retrasos, daños y facturación de compra.' },
        'Local': { icon: 'ph-storefront', color: '#ff3d71', desc: 'Infraestructura, mantenimiento y oficina.' },
        'Otros': { icon: 'ph-dots-three-circle', color: '#6b7280', desc: 'Consultas generales y varios.' }
    };

    function renderIncidencias() {
        actualizarKPIs();
        
        const categories = ['Inventario', 'App', 'Pedidos', 'Proveedores', 'Local', 'Otros'];
        
        const cardsHtml = categories.map(cat => {
            const config = incidenciasCatConfig[cat];
            const count = window.erpDB.incidencias.filter(i => i.categoria === cat && i.estado === 'abierta').length;
            
            return `
                <div class="kpi-card" style="cursor: pointer; transition: transform 0.2s; border-top: 4px solid ${config.color};" onclick="renderIncidenciasCategoria('${cat}')">
                    <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:12px;">
                        <div style="background:${config.color}20; color:${config.color}; padding:10px; border-radius:12px;">
                            <i class="ph ${config.icon}" style="font-size:24px;"></i>
                        </div>
                        ${count > 0 ? `<span style="background:#ff3d71; color:white; font-size:11px; padding:2px 8px; border-radius:20px; font-weight:bold;">${count} Pendientes</span>` : `<span style="color:var(--text-muted); font-size:11px;">Al día</span>`}
                    </div>
                    <h3 style="margin:0; font-size:18px; color:var(--text-main); font-weight:700;">${cat}</h3>
                    <p style="font-size:12px; color:var(--text-muted); margin-top:8px; line-height:1.4;">${config.desc}</p>
                    <button class="btn btn-secondary" style="margin-top:20px; width:100%; border:1px solid ${config.color}40; color:var(--text-main); display:flex; justify-content:center; align-items:center; gap:8px;">
                        Gestionar <i class="ph ph-arrow-right"></i>
                    </button>
                </div>
            `;
        }).join('');

        viewContainer.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">Centro de Incidencias</h1>
                    <p class="view-subtitle">Gestión centralizada de anomalías operativas y de clientes</p>
                </div>
                <div style="display:flex; gap:12px;">
                    <div class="kpi-mini" style="background:var(--card-bg); padding:8px 16px; border-radius:8px; border:1px solid var(--border-color); display:flex; flex-direction:column; align-items:center;">
                        <span style="font-size:10px; text-transform:uppercase; color:var(--text-muted);">Total Abiertas</span>
                        <span style="font-weight:bold; color:#ff3d71;">${window.erpDB.incidencias.filter(i => i.estado === 'abierta').length}</span>
                    </div>
                </div>
            </div>
            <div class="card-grid">
                ${cardsHtml}
            </div>
        `;
    }

    window.renderIncidenciasCategoria = (catName) => {
        actualizarKPIs();
        const config = incidenciasCatConfig[catName];
        window.incidenciaSortMode = window.incidenciaSortMode || 'fecha';
        
        let incidencias = window.erpDB.incidencias.filter(i => i.categoria === catName);
        
        // Ordenación
        const prioridadesOrder = { 'Crítica': 4, 'Alta': 3, 'Media': 2, 'Baja': 1 };
        if(window.incidenciaSortMode === 'prioridad') {
            incidencias.sort((a,b) => prioridadesOrder[b.prioridad] - prioridadesOrder[a.prioridad]);
        } else {
            incidencias.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
        }

        const filas = incidencias.map(i => {
            const prioColors = {
                'Crítica': { bg: '#ff3d71', text: '#fff' },
                'Alta': { bg: '#ffb300', text: '#000' },
                'Media': { bg: '#4d7cff', text: '#fff' },
                'Baja': { bg: '#00e676', text: '#fff' }
            };
            const p = prioColors[i.prioridad] || prioColors['Media'];
            
            return `
                <tr style="cursor:pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(99, 102, 241, 0.05)'" onmouseout="this.style.background='transparent'" onclick="window.toggleDetalleIncidencia('${i.id}')">
                    <td style="font-weight:600; color:var(--text-muted); display:flex; align-items:center; gap:8px;"><i class="ph ph-caret-down"></i> ${i.id}</td>
                    <td>${i.fecha}</td>
                    <td><span style="background:${p.bg}; color:${p.text}; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:bold;">${i.prioridad}</span></td>
                    <td style="font-weight:bold;">
                        ${i.relacionId ? `<span style="background:#4d7cff15; color:#4d7cff; padding:2px 6px; border-radius:4px; font-size:10px; margin-right:8px;">${i.relacionId}</span>` : ''}
                        ${i.titulo}
                    </td>
                    <td><div style="font-size:12px; color:var(--text-muted); max-width:250px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${i.descripcion}</div></td>
                    <td><span class="status ${i.estado === 'resuelta' ? 'success' : 'warning'}">${i.estado.toUpperCase()}</span></td>
                    <td onclick="event.stopPropagation()">
                        ${i.estado === 'abierta' ? `<button class="btn btn-primary" style="padding:4px 8px; font-size:12px;" onclick="resolverIncidenciaDirecta('${i.id}', '${catName}')">Resolver</button>` : `<i class="ph ph-check-circle" style="color:#00e676; font-size:20px;"></i>`}
                    </td>
                </tr>
                <tr id="detalle-inc-${i.id}" style="display:none; background: rgba(0,0,0,0.02);">
                    <td colspan="7" style="padding: 16px 24px;">
                        <div style="background: var(--bg-color); padding: 20px; border-radius: 8px; border: 1px dashed var(--border-color);">
                            <h4 style="margin-bottom: 8px; font-size:13px; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted);">Descripción Completa</h4>
                            <p style="font-size:14px; line-height:1.6; color:var(--text-main); margin:0;">${i.descripcion}</p>
                            <div style="margin-top:16px; font-size:11px; color:var(--text-muted); display:flex; gap:16px;">
                                <span><b>ID:</b> ${i.id}</span>
                                <span><b>Fecha:</b> ${i.fecha}</span>
                                <span><b>Prioridad:</b> ${i.prioridad}</span>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        viewContainer.innerHTML = `
            <div class="view-header">
                <div style="display:flex; align-items:center; gap:16px;">
                    <button class="btn btn-secondary" onclick="renderView('incidencias')" style="padding:8px;"><i class="ph ph-arrow-left" style="font-size:20px;"></i></button>
                    <div>
                        <h1 class="view-title">${catName}</h1>
                        <p class="view-subtitle">Listado de incidencias registradas en esta categoría</p>
                    </div>
                </div>
                <button class="btn btn-primary" onclick="abrirNuevaIncidenciaCat('${catName}')"><i class="ph ph-plus"></i> Añadir Incidencia</button>
            </div>

            <div class="kpi-card" style="margin-bottom:20px; padding:16px; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; gap:24px;">
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">Filtrar / Ordenar por</span>
                        <div style="display:flex; gap:8px; margin-top:4px;">
                            <button class="btn ${window.incidenciaSortMode === 'fecha' ? 'btn-primary' : 'btn-secondary'}" style="padding:4px 12px; font-size:11px;" onclick="window.setIncincSort('fecha', '${catName}')">Más Recientes</button>
                            <button class="btn ${window.incidenciaSortMode === 'prioridad' ? 'btn-primary' : 'btn-secondary'}" style="padding:4px 12px; font-size:11px;" onclick="window.setIncincSort('prioridad', '${catName}')">Por Prioridad</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Fecha</th>
                            <th>Prioridad</th>
                            <th>Asunto</th>
                            <th>Vista Previa</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filas.length > 0 ? filas : '<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted);">No hay incidencias en esta categoría</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    };

    window.toggleDetalleIncidencia = (id) => {
        const el = document.getElementById('detalle-inc-' + id);
        if(el) {
            el.style.display = el.style.display === 'none' ? 'table-row' : 'none';
        }
    };

    window.setIncincSort = (mode, cat) => {
        window.incidenciaSortMode = mode;
        renderIncidenciasCategoria(cat);
    };

    window.resolverIncidenciaDirecta = (id, cat) => {
        const i = window.erpDB.incidencias.find(x => x.id === id);
        if(!i) return;

        if(i.categoria === 'Pedidos' && i.relacionId) {
            abrirModalRecuperacionPedido(id, i.relacionId);
        } else {
            i.estado = 'resuelta';
            window.saveERPData();
            renderIncidenciasCategoria(cat);
        }
    };

    window.abrirModalRecuperacionPedido = (incId, pedidoId) => {
        const content = `
            <div style="margin-bottom:20px; text-align:center;">
                <div style="background:#00e67615; color:#00e676; padding:15px; border-radius:12px; margin-bottom:15px;">
                    <i class="ph ph-check-circle" style="font-size:32px;"></i>
                    <p style="margin:5px 0 0 0; font-weight:bold;">Incidencia Resuelta</p>
                </div>
                <p style="font-size:14px; color:var(--text-muted);">Has resuelto la incidencia del pedido <b>${pedidoId}</b>. <br> ¿En qué estado debe continuar el pedido?</p>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <button class="btn btn-secondary" style="border:1px solid #ffb300; color:#ffb300;" onclick="finalizarResolucionConEstado('${incId}', '${pedidoId}', 'pendiente')">A Pendiente</button>
                <button class="btn btn-secondary" style="border:1px solid #4d7cff; color:#4d7cff;" onclick="finalizarResolucionConEstado('${incId}', '${pedidoId}', 'en_proceso')">A En Proceso</button>
                <div style="grid-column: span 2;">
                    <button class="btn btn-primary" style="width:100%; background:#00e676; border:none;" onclick="finalizarResolucionConEstado('${incId}', '${pedidoId}', 'completado')">Marcar como Completado</button>
                </div>
            </div>
        `;
        abrirModal('Resolución de Pedido', content);
    };

    window.finalizarResolucionConEstado = (incId, pedidoId, nuevoEstado) => {
        const i = window.erpDB.incidencias.find(x => x.id === incId);
        const p = window.erpDB.pedidos.find(x => x.id === pedidoId);

        if(i) i.estado = 'resuelta';
        if(p) p.estado = nuevoEstado;

        window.saveERPData();
        actualizarKPIs();
        cerrarModal();
        renderIncidenciasCategoria('Pedidos');
    };

    window.abrirNuevaIncidenciaCat = (catName) => {
        let pedidoSelectHtml = '';
        if(catName === 'Pedidos') {
            const pedidosOpts = window.erpDB.pedidos.slice(0, 50).map(p => `<option value="${p.id}">${p.id} - ${p.cliente}</option>`).join('');
            pedidoSelectHtml = `
                <div class="form-group">
                    <label>Vincular a Pedido (Opcional)</label>
                    <select id="new-inc-rel" class="form-control">
                        <option value="">-- Sin pedido específico --</option>
                        ${pedidosOpts}
                    </select>
                </div>
            `;
        }

        const content = `
            <div class="form-group">
                <label>Prioridad de la Incidencia</label>
                <select id="new-inc-prio" class="form-control">
                    <option value="Baja">Baja (Mantenimiento rutinario)</option>
                    <option value="Media" selected>Media (Incidencia estándar)</option>
                    <option value="Alta">Alta (Afecta a procesos)</option>
                    <option value="Crítica">Crítica (Bloqueo total / Seguridad)</option>
                </select>
            </div>
            ${pedidoSelectHtml}
            <div class="form-group">
                <label>Asunto / Breve Descripción</label>
                <input type="text" id="new-inc-titulo" class="form-control" placeholder="Ej: Falta de stock de PRD-004">
            </div>
            <div class="form-group">
                <label>Descripción Detallada</label>
                <textarea id="new-inc-desc" class="form-control" rows="4" placeholder="Explique el problema con detalle..."></textarea>
            </div>
            <button class="btn btn-primary" style="width:100%;" onclick="gestionarGuardarIncidencia('${catName}')">Registrar Incidencia</button>
        `;
        abrirModal(`Nueva Incidencia: ${catName}`, content);
    };

    window.gestionarGuardarIncidencia = (catName) => {
        const titulo = document.getElementById('new-inc-titulo').value.trim();
        const desc = document.getElementById('new-inc-desc').value.trim();
        const prio = document.getElementById('new-inc-prio').value;
        const relId = document.getElementById('new-inc-rel') ? document.getElementById('new-inc-rel').value : null;

        if(!titulo || !desc) return alert('Por favor, completa todos los campos.');

        const nueva = {
            id: 'INC-' + (window.erpDB.incidencias.length + 600),
            fecha: new Date().toLocaleDateString('sv-SE'),
            categoria: catName,
            prioridad: prio,
            titulo: titulo,
            descripcion: desc,
            estado: 'abierta',
            relacionId: relId
        };

        // Si se vincula manualmente a un pedido, marcar el pedido como incidencia
        if(relId) {
            const p = window.erpDB.pedidos.find(x => x.id === relId);
            if(p) p.estado = 'incidencia';
        }

        window.erpDB.incidencias.unshift(nueva);
        window.saveERPData();
        actualizarKPIs();
        cerrarModal();
        renderIncidenciasCategoria(catName);
    };

    function renderProveedores() {
        viewContainer.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">Proveedores y Reposición</h1>
                    <p class="view-subtitle">Gestión de remesas en tránsito</p>
                </div>
            </div>
            <div class="card-grid">
                <div class="kpi-card" style="align-items:center; justify-content:center; text-align:center; min-height:200px">
                    <i class="ph ph-truck text-warning" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <h3>Proveedor A en Tránsito</h3>
                    <p class="view-subtitle" style="margin-top:8px;">Llegada: Hoy 16:00</p>
                    <div class="progress-container" style="width: 80%; margin: 16px auto;"><div class="progress-bar" style="width: 75%; background-color: var(--warning);"></div></div>
                    <span style="font-size:12px; color:var(--text-muted);">Progreso del envío (75%)</span>
                    <button class="btn btn-primary" style="margin-top:16px;">Validar Entrada</button>
                </div>
            </div>
        `;
    }

    // --- Render Finanzas (Solo Gerente) ---
    function renderFinanzas() {
        if (window.currentRole !== 'gerente') {
            viewContainer.innerHTML = '<div class="view-header"><h1 class="text-danger">Acceso Denegado</h1><p>Módulo de acceso exclusivo para la Gerencia General.</p></div>';
            return;
        }

        const facturasCompletadas = window.erpDB.pedidos.filter(p => p.estado === 'completado');
        const ingresosBrutos = facturasCompletadas.reduce((acc, p) => acc + p.monto, 0);
        const impuestos = ingresosBrutos * 0.21; // 21% IVA
        const totalGastosFijos = 45000; // Estático para simulación

        const beneficioNeto = ingresosBrutos - impuestos - totalGastosFijos;

        const filasFacturas = facturasCompletadas.slice(0, 10).map(f => `
            <tr style="transition: background 0.2s;" onmouseover="this.style.background='rgba(99, 102, 241, 0.05)'" onmouseout="this.style.background='transparent'">
                <td style="font-weight: 600; color:var(--primary);">FAC-${f.id.split('-')[1]}</td>
                <td><span style="font-size:12px;color:var(--text-muted);display:block;">Ref.</span>${f.id}</td>
                <td>${f.fecha}</td>
                <td><b>${f.cliente}</b></td>
                <td style="font-weight: 600;">$${f.monto.toLocaleString()}</td>
                <td><span style="background:var(--success);color:white;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:bold;">COBRADA</span></td>
            </tr>
        `).join('');

        viewContainer.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">Libro Mayor y Finanzas</h1>
                    <p class="view-subtitle">Monitor contable, impuestos y Facturación (Privilegios de Gerente)</p>
                </div>
                <div style="display:flex; gap:12px;">
                    <button class="btn btn-secondary" onclick="alert('Exportando modelo 303...')"><i class="ph ph-download-simple"></i> Exportar Fiscal</button>
                </div>
            </div>
            
            <div class="card-grid">
                <div class="kpi-card" style="border-left: 4px solid #00e676">
                    <div class="kpi-header"><span style="color:var(--text-muted);">Ingreso Bruto Volumétrico</span><i class="ph ph-trend-up text-success" style="background:rgba(0,230,118,0.1); padding:8px; border-radius:8px;"></i></div>
                    <div class="kpi-value text-success">$${ingresosBrutos.toLocaleString()}</div>
                    <p class="view-subtitle" style="margin-top: 8px;">Facturación total cobrada por envíos logísticos.</p>
                </div>
                <div class="kpi-card" style="border-left: 4px solid #ff3d71">
                    <div class="kpi-header"><span style="color:var(--text-muted);">Retención Fiscal IVA (21%)</span><i class="ph ph-buildings text-danger" style="background:rgba(255,61,113,0.1); padding:8px; border-radius:8px;"></i></div>
                    <div class="kpi-value text-danger">-$${impuestos.toLocaleString()}</div>
                    <p class="view-subtitle" style="margin-top: 8px;">Obligaciones tributarias retenidas.</p>
                </div>
                <div class="kpi-card" style="border-left: 4px solid #4d7cff">
                    <div class="kpi-header"><span style="color:var(--text-muted);">Beneficio Neto</span><i class="ph ph-bank text-primary" style="background:rgba(77,124,255,0.1); padding:8px; border-radius:8px;"></i></div>
                    <div class="kpi-value text-primary">$${beneficioNeto.toLocaleString()}</div>
                    <p class="view-subtitle" style="margin-top: 8px;">Menos Gasto Fijo Operativo (-$${totalGastosFijos.toLocaleString()})</p>
                </div>
            </div>

            <div class="table-container" style="margin-top: 24px;">
                <div style="padding: 16px 24px; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; background: rgba(0,0,0,0.01);">
                    <div>
                        <h3 style="margin:0; font-size:16px;">Registro de Facturas Emitidas (Automático)</h3>
                        <span style="font-size:13px; color:var(--text-muted);">Generadas nativamente a partir de los Pedidos Completados.</span>
                    </div>
                </div>
                <table>
                    <thead><tr><th>ID Factura</th><th>Ref. Albarán</th><th>Fecha Emisión</th><th>Cliente Pyme</th><th>Monto Total</th><th>Estado Contable</th></tr></thead>
                    <tbody>${filasFacturas}</tbody>
                </table>
            </div>
        `;
    }

    // Iniciar
    renderView('dashboard');
});
