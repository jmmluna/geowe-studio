import { PluginContext } from '../../core/plugin-context';

export default {
    id: 'hub-manager-plugin',
    name: 'GeoWE Hub',
    activate: async (ctx: PluginContext) => {
        const SIDEBAR_ID = 'marketplace';
        const TOOLBAR_BTN_ID = 'btn-hub-manager';
        const CATALOG_URL = 'hub/catalog.json';
        const DEFAULT_ICON = 'https://raw.githubusercontent.com/jmmluna/geowe-studio/main/public/logo-geowe.png';

        // Estado del Plugin
        let currentTab = 'explore';
        let searchQuery = '';
        let catalog: any[] = [];
        
        const STYLES = `
            .hub-container { font-family: 'Inter', system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; background: #fff; height: 100%; }
            .hub-header { background: #fff; padding: 15px; border-bottom: 1px solid #edf2f7; display: flex; flex-direction: column; gap: 10px; position: sticky; top: 0; z-index: 10; }
            .hub-search-container { position: relative; display: flex; align-items: center; }
            .hub-search-container .material-icons { position: absolute; left: 12px; color: #a0aec0; font-size: 18px; }
            .hub-search-input { width: 100%; padding: 10px 15px 10px 40px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; transition: all 0.2s; outline: none; }
            .hub-search-input:focus { border-color: #3182ce; box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1); }
            .hub-tabs { display: flex; background: #fff; }
            .hub-tab { flex: 1; padding: 12px; text-align: center; cursor: pointer; font-size: 13px; font-weight: 600; color: #718096; transition: all 0.3s; border-bottom: 2px solid transparent; }
            .hub-tab:hover { color: #3182ce; }
            .hub-tab.active { color: #3182ce; border-bottom-color: #3182ce; }
            .hub-content { flex: 1; overflow-y: auto; padding: 15px; scrollbar-width: thin; }
            .hub-grid { display: flex; flex-direction: column; gap: 15px; }
            .hub-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 15px; display: flex; flex-direction: column; gap: 12px; transition: all 0.2s; }
            .hub-card:hover { transform: translateY(-2px); border-color: #bee3f8; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .hub-card-header { display: flex; gap: 10px; align-items: start; }
            .hub-card-icon { width: 48px; height: 48px; border-radius: 10px; background: #edf2f7; display: flex; align-items: center; justify-content: center; color: #4a5568; overflow: hidden; flex-shrink: 0; }
            .hub-card-icon img { width: 100%; height: 100%; object-fit: cover; }
            .hub-card-title { font-weight: 700; font-size: 15px; color: #2d3748; line-height: 1.2; }
            .hub-card-author { font-size: 12px; color: #a0aec0; }
            .hub-card-desc { font-size: 13px; color: #4a5568; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            .hub-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 3px 10px; border-radius: 20px; background: #ebf8ff; color: #3182ce; align-self: start; }
            .hub-tech-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 3px 10px; border-radius: 20px; background: #f7fafc; color: #718096; border: 1px solid #e2e8f0; align-self: start; }
            .hub-card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #f7fafc; }
            .hub-card-actions { display: flex; gap: 8px; }
            .hub-btn-sm { padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
            .hub-btn-install { background: #3182ce; color: #fff; }
            .hub-btn-install:hover { background: #2b6cb0; }
            .hub-btn-outline { background: #fff; border: 1px solid #e2e8f0; color: #718096; }
            .hub-empty { text-align: center; padding: 60px 20px; color: #a0aec0; }
            .hub-empty .material-icons { font-size: 48px; display: block; margin-bottom: 15px; opacity: 0.5; }
        `;

        const TEMPLATE = `
            <div class="hub-container">
                <div class="hub-header">
                    <div class="hub-search-container">
                        <span class="material-icons">search</span>
                        <input type="text" id="hub-search" class="hub-search-input" placeholder="Buscar plugins..." value="{{searchQuery}}">
                    </div>
                    <div class="hub-tabs">
                        <div class="hub-tab {{exploreActive}}" data-tab="explore">Marketplace</div>
                        <div class="hub-tab {{activeActive}}" data-tab="active">Instalados</div>
                    </div>
                </div>
                <div class="hub-content">{{content}}</div>
            </div>
        `;

        const fetchCatalog = async () => {
            try {
                const response = await fetch(CATALOG_URL);
                if (response.ok) {
                    const data = await response.json();
                    catalog = data.plugins;
                    refreshUI();
                }
            } catch (e) {
                console.error('Error fetching hub catalog', e);
            }
        };

        const renderCard = (plugin: any) => {
            const isActive = ctx.plugins.getActive().some(p => p.id === plugin.id);
            const iconUrl = plugin.icon && (plugin.icon.includes('/') || plugin.icon.includes('http')) ? plugin.icon : null;
            const iconHtml = iconUrl 
                ? `<img src="${iconUrl}" onerror="this.src='${DEFAULT_ICON}'">` 
                : `<span class="material-icons">${plugin.icon || 'extension'}</span>`;

            return `
                <div class="hub-card">
                    <div class="hub-card-header">
                        <div class="hub-card-icon">${iconHtml}</div>
                        <div>
                            <div class="hub-card-title">${plugin.name}</div>
                            <div class="hub-card-author">por ${plugin.author || 'Anónimo'}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <div class="hub-badge">${plugin.category || 'Varios'}</div>
                        ${plugin.technology ? `<div class="hub-tech-badge">${plugin.technology}</div>` : ''}
                    </div>
                    <div class="hub-card-desc">${plugin.description || 'Sin descripción.'}</div>
                    <div class="hub-card-footer">
                        <div style="font-size: 11px; color: #a0aec0">v${plugin.version}</div>
                        <div class="hub-card-actions">
                            ${plugin.repository ? `<button class="hub-btn-sm hub-btn-outline hub-btn-repo" data-url="${plugin.repository}"><span class="material-icons" style="font-size:16px">code</span></button>` : ''}
                            ${isActive 
                                ? `<button class="hub-btn-sm hub-btn-outline" disabled style="color:#48bb78"><span class="material-icons" style="font-size:16px">check_circle</span>Activo</button>` 
                                : `<button class="hub-btn-sm hub-btn-install" data-id="${plugin.id}"><span class="material-icons" style="font-size:16px">download</span>Instalar</button>`}
                        </div>
                    </div>
                </div>
            `;
        };

        const renderActiveList = () => {
            const active = ctx.plugins.getActive();
            if (active.length === 0) return '<div class="hub-empty"><span class="material-icons">extension_off</span><p>No hay plugins activos</p></div>';

            return `
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${active.map(p => `
                        <div style="background:#fff; border:1px solid #e2e8f0; padding:12px; border-radius:10px; display:flex; justify-content:space-between; align-items:center">
                            <div>
                                <div style="font-weight:700; font-size:14px; color:#2d3748">${p.name}</div>
                                <div style="font-size:11px; color:#a0aec0">${p.id}</div>
                            </div>
                            <span class="material-icons" style="color:#48bb78; font-size:20px">check_circle</span>
                        </div>
                    `).join('')}
                </div>
            `;
        };

        const getProcessedHTML = () => {
            let content = '';
            
            if (currentTab === 'explore') {
                const filtered = catalog.filter(p => 
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.technology?.toLowerCase().includes(searchQuery.toLowerCase())
                );
                content = `<div class="hub-grid">${filtered.length ? filtered.map(renderCard).join('') : '<div class="hub-empty"><span class="material-icons">search_off</span><p>No se encontraron plugins</p></div>'}</div>`;
            } else {
                content = renderActiveList();
            }

            return TEMPLATE
                .replace('{{searchQuery}}', searchQuery)
                .replace('{{exploreActive}}', currentTab === 'explore' ? 'active' : '')
                .replace('{{activeActive}}', currentTab === 'active' ? 'active' : '')
                .replace('{{content}}', content);
        };

        let scrollPos = 0;

        const refreshUI = () => {
            // Guardar scroll actual antes de refrescar
            const contentEl = document.querySelector('.hub-content');
            if (contentEl) scrollPos = contentEl.scrollTop;

            ctx.ui.registerSidebar({
                id: SIDEBAR_ID,
                title: 'GeoWE Marketplace',
                icon: 'storefront',
                content: getProcessedHTML(),
                onRender: setupEvents
            });
        };

        const setupEvents = (el: HTMLElement) => {
            // Restaurar scroll
            const contentEl = el.querySelector('.hub-content');
            if (contentEl) contentEl.scrollTop = scrollPos;

            const searchInput = el.querySelector('#hub-search') as HTMLInputElement;
            
            el.onclick = async (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                const btn = target.closest('button, .hub-tab') as HTMLElement;
                if (!btn) return;

                if (btn.classList.contains('hub-tab')) {
                    const tab = btn.getAttribute('data-tab');
                    if (tab) {
                        currentTab = tab;
                        scrollPos = 0; // Reset scroll al cambiar de pestaña
                        refreshUI();
                    }
                    return;
                }

                if (btn.classList.contains('hub-btn-install')) {
                    const id = btn.getAttribute('data-id');
                    const pluginData = catalog.find(p => p.id === id);
                    if (pluginData && pluginData.downloadUrl) {
                        (btn as any).disabled = true;
                        btn.innerHTML = '<span class="material-icons" style="font-size:16px">hourglass_empty</span>';
                        
                        try {
                            if ((window as any).pluginManager) {
                                await (window as any).pluginManager.loadRemotePlugin(pluginData.downloadUrl);
                                // No llamamos a refreshUI aquí, confiaremos en el evento plugin:loaded
                                ctx.ui.setStatus(`Instalando ${pluginData.name}...`);
                            }
                        } catch (err) {
                            console.error('Error:', err);
                            btn.innerHTML = '<span class="material-icons" style="font-size:16px">error</span>';
                            (btn as any).disabled = false;
                        }
                    }
                    return;
                }

                if (btn.classList.contains('hub-btn-repo')) {
                    const url = btn.getAttribute('data-url');
                    if (url) window.open(url, '_blank');
                    return;
                }
            };

            const search = el.querySelector('#hub-search') as HTMLInputElement;
            if (search) {
                search.oninput = (e) => {
                    searchQuery = (e.target as HTMLInputElement).value;
                    refreshUI();
                    
                    setTimeout(() => {
                        const newSearch = document.getElementById('hub-search') as HTMLInputElement;
                        if (newSearch) {
                            newSearch.focus();
                            newSearch.setSelectionRange(searchQuery.length, searchQuery.length);
                        }
                    }, 0);
                };
            }
        };

        const toggleHub = () => {
            refreshUI(); // Asegurar contenido fresco
            ctx.ui.setStatus('Cargando Marketplace...');
            
            // Retardo mínimo para asegurar que el core ha registrado el cambio de panels
            setTimeout(() => {
                ctx.commands.execute('ui:activePluginSidebar', SIDEBAR_ID);
                ctx.commands.execute('ui:openSidebar');
            }, 50);
        };

        // Inicialización
        ctx.ui.addStyles(STYLES);
        
        // Registrar inmediatamente con estado vacío para evitar pantalla en blanco si el fetch tarda
        refreshUI();

        fetchCatalog();

        ctx.ui.addButton({
            id: TOOLBAR_BTN_ID,
            label: 'GeoWE Hub',
            icon: 'storefront',
            commandId: 'hub:toggle',
            activeOnSidebarId: SIDEBAR_ID
        });

        ctx.commands.register('hub:toggle', toggleHub);

        // Volvemos a escuchar la carga de plugins para refrescar el estado 'Activo'
        // Pero ahora con persistencia de scroll para que no sea brusco.
        ctx.events.on('plugin:loaded', () => refreshUI());
    },
    deactivate: () => {}
};
