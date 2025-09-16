/**
 * Sistema de Cambio de Tema - Versión Simplificada
 * Maneja el cambio entre tema claro y oscuro
 */

class ThemeSwitcher {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'light';
        this.init();
    }

    init() {
        console.log('🌙 ThemeSwitcher inicializando...');
        console.log('Tema actual:', this.currentTheme);
        
        // Aplicar tema guardado
        this.applyTheme(this.currentTheme);
        
        // Crear botón de cambio de tema
        this.createThemeToggle();
        
        console.log('✅ ThemeSwitcher inicializado correctamente');
    }

    getStoredTheme() {
        return localStorage.getItem('theme') || 'light';
    }

    setStoredTheme(theme) {
        localStorage.setItem('theme', theme);
        console.log('💾 Tema guardado en localStorage:', theme);
    }

    applyTheme(theme) {
        console.log('🎨 Aplicando tema:', theme);
        
        const root = document.documentElement;
        
        if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
            document.body.classList.add('dark-theme');
            console.log('🌙 Tema oscuro aplicado');
        } else {
            root.removeAttribute('data-theme');
            document.body.classList.remove('dark-theme');
            console.log('☀️ Tema claro aplicado');
        }
        
        this.currentTheme = theme;
        this.setStoredTheme(theme);
        
        // Actualizar icono del botón
        this.updateToggleIcon();
        
        // Disparar evento personalizado
        document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
        
        console.log('✅ Tema aplicado correctamente');
    }

    toggleTheme() {
        console.log('🔄 Cambiando tema...');
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        
        // Mostrar notificación
        this.showThemeNotification(newTheme);
    }

    createThemeToggle() {
        console.log('🔘 Creando botón de cambio de tema...');
        
        // Buscar si ya existe un botón de tema
        let themeToggle = document.getElementById('theme-toggle');
        
        if (!themeToggle) {
            console.log('❌ No se encontró botón de tema, creando uno nuevo...');
            
            // Crear botón de cambio de tema
            themeToggle = document.createElement('button');
            themeToggle.id = 'theme-toggle';
            themeToggle.className = 'btn btn-outline-secondary btn-sm theme-toggle-btn';
            themeToggle.innerHTML = this.getToggleIcon();
            themeToggle.title = 'Cambiar tema';
            themeToggle.addEventListener('click', () => this.toggleTheme());
            
            // Buscar lugar para insertar el botón
            const header = document.querySelector('.page-header, .navbar, .header, header');
            if (header) {
                const headerActions = header.querySelector('.d-flex.gap-2, .header-actions, .navbar-nav');
                if (headerActions) {
                    headerActions.appendChild(themeToggle);
                    console.log('✅ Botón de tema agregado al header actions');
                } else {
                    header.appendChild(themeToggle);
                    console.log('✅ Botón de tema agregado al header');
                }
            } else {
                // Si no hay header, insertar en el body
                document.body.insertBefore(themeToggle, document.body.firstChild);
                console.log('✅ Botón de tema agregado al body');
            }
        } else {
            console.log('✅ Botón de tema ya existe, configurando...');
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    getToggleIcon() {
        return this.currentTheme === 'light' 
            ? '<i class="bi bi-moon-stars"></i>' 
            : '<i class="bi bi-sun"></i>';
    }

    updateToggleIcon() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.innerHTML = this.getToggleIcon();
            console.log('🔄 Icono del botón actualizado');
        }
    }

    showThemeNotification(theme) {
        const themeName = theme === 'dark' ? 'Oscuro' : 'Claro';
        const icon = theme === 'dark' ? '🌙' : '☀️';
        
        console.log(`${icon} Tema cambiado a ${themeName}`);
        
        // Crear toast de notificación
        if (typeof mostrarToast === 'function') {
            mostrarToast(`${icon} Tema cambiado a ${themeName}`, 'success');
        } else {
            // Toast simple si no existe la función
            this.createSimpleToast(`${icon} Tema cambiado a ${themeName}`);
        }
    }

    createSimpleToast(message) {
        const toast = document.createElement('div');
        toast.className = 'theme-toast';
        toast.textContent = message;
        
        // Estilos del toast
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'var(--accent-primary)',
            color: 'var(--text-inverse)',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: '9999',
            fontSize: '14px',
            fontWeight: '500'
        });
        
        document.body.appendChild(toast);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    // Método para obtener el tema actual
    getCurrentTheme() {
        return this.currentTheme;
    }

    // Método para establecer tema específico
    setTheme(theme) {
        if (['light', 'dark'].includes(theme)) {
            this.applyTheme(theme);
        }
    }
}

// Función de inicialización global
function initThemeSwitcher() {
    console.log('🚀 Inicializando ThemeSwitcher...');
    
    try {
        window.themeSwitcher = new ThemeSwitcher();
        console.log('✅ ThemeSwitcher inicializado globalmente');
        
        // Agregar indicador visual de que está funcionando
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            top: 50px;
            left: 10px;
            background: #10b981;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 9999;
            opacity: 0.8;
        `;
        indicator.textContent = '✅ JS de temas cargado';
        document.body.appendChild(indicator);
        
        // Remover después de 5 segundos
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 5000);
        
    } catch (error) {
        console.error('❌ Error inicializando ThemeSwitcher:', error);
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeSwitcher);
} else {
    initThemeSwitcher();
}

// También inicializar si se carga después
document.addEventListener('DOMContentLoaded', function() {
    if (!window.themeSwitcher) {
        initThemeSwitcher();
    }
});

// Exportar para uso global
window.ThemeSwitcher = ThemeSwitcher;
window.initThemeSwitcher = initThemeSwitcher;
