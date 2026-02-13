# 📱 Sistema de Registro Documental - Inspección 1131

Sistema web completo de gestión de registros documentales con exportación PDF y adjuntos de archivos.

## 🚀 Demo en Vivo

[Ver Demo](https://tu-usuario.github.io/tu-repositorio/)

## ✨ Características

### Core
- ✅ **Sistema de autenticación** con roles (Admin, Supervisor, Usuario)
- ✅ **Gestión completa** de registros documentales
- ✅ **Búsqueda y filtros** en tiempo real
- ✅ **Estadísticas** personalizadas por usuario

### Nuevas Funcionalidades v5.0
- 📎 **Adjuntar archivos** (PDF, JPG, DOCX, XLSX) a cada registro
- 📄 **Exportación a PDF** individual y masiva
- 📊 **Exportación a CSV** con información de adjuntos
- 💾 **Almacenamiento en base64** (funciona sin servidor)
- 🖼️ **Visualizador de adjuntos** con descarga directa

### Tecnología
- 🌐 **PWA instalable** (funciona como app nativa)
- 📱 **100% responsive** (móvil, tablet, desktop)
- 💨 **Sin dependencias de servidor** (localStorage)
- ⚡ **Modo offline** completo con Service Worker
- 🎨 **UI/UX moderna** con Material Design

## 📦 Despliegue en GitHub Pages

### Opción 1: Desde la Web (Fácil)

1. **Crear repositorio en GitHub**
   - Ve a https://github.com/new
   - Nombra tu repositorio (ej: `insp1131-registros`)
   - Marca como público o privado
   - Clic en "Create repository"

2. **Subir archivos**
   - Clic en "uploading an existing file"
   - Arrastra los archivos:
     - `index.html`
     - `app.js`
     - `manifest.json`
     - `sw.js`
   - Clic en "Commit changes"

3. **Activar GitHub Pages**
   - Ve a Settings → Pages
   - En "Source" selecciona "main" branch
   - Clic en "Save"
   - Espera 1-2 minutos

4. **Acceder**
   - Tu sitio estará en: `https://tu-usuario.github.io/nombre-repo/`

### Opción 2: Desde Git (Avanzado)

```bash
# 1. Clonar o crear repositorio
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo

# 2. Copiar archivos al repositorio
cp index.html app.js manifest.json sw.js ./

# 3. Commit y push
git add .
git commit -m "Despliegue inicial"
git push origin main

# 4. Activar Pages desde Settings → Pages
```

### Opción 3: Deploy Automático

```yaml
# Crear .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

## 👥 Usuarios por Defecto

### Administrador
```
Usuario: admin
Contraseña: admin123
```

### Supervisor
```
Usuario: supervisor
Contraseña: super123
```

## 📖 Guía de Uso

### Crear Nuevo Registro

1. Clic en el botón flotante **+** (FAB)
2. Completar formulario:
   - Tipo de documento *
   - Personal *
   - Área de origen
   - ID Usuario/Alumno
   - Observaciones
3. **Adjuntar archivos** (opcional):
   - Clic en área de carga
   - Seleccionar archivos (máx. 5MB cada uno)
   - Formatos: PDF, JPG, DOCX, XLSX
4. Clic en **Guardar Registro**

### Adjuntar Archivos

**Métodos de adjuntar:**
- 📁 Clic en el área y seleccionar archivos
- 🖱️ Arrastrar y soltar archivos
- ❌ Eliminar archivos antes de guardar

**Límites:**
- Tamaño máximo: **5MB** por archivo
- Formatos permitidos: PDF, JPG, JPEG, PNG, DOC, DOCX, XLS, XLSX
- Sin límite de cantidad (depende del espacio del navegador)

### Exportar Registros

**Exportar a PDF:**
1. Ir a Perfil → Exportar
2. Seleccionar "Exportar a PDF"
3. Se descargará un PDF profesional con todos los registros

**Exportar a CSV:**
1. Ir a Perfil → Exportar
2. Seleccionar "Exportar a CSV"
3. Abrir con Excel/Sheets para análisis

**Exportar registro individual:**
1. Abrir detalle del registro
2. Clic en "Exportar como PDF"
3. Se genera PDF con toda la información

### Descargar Adjuntos

1. Abrir detalle del registro
2. Ver sección "Archivos adjuntos"
3. Clic en cualquier archivo
4. Se descarga automáticamente

## ⚙️ Configuración

### Cambiar Límite de Archivo

Editar en `app.js`:
```javascript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
```

### Agregar Formatos

Editar en `app.js`:
```javascript
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'];
```

### Personalizar Colores

Editar en `index.html` (sección `:root`):
```css
:root {
    --azul: #004582;
    --celeste: #009ADA;
    --verde: #32A430;
    /* ... más colores */
}
```

## 🔐 Seguridad y Límites

### LocalStorage
- **Límite típico**: 5-10MB por dominio
- **Persistencia**: Datos permanecen hasta limpiar caché
- **Privacidad**: Datos solo visibles en ese navegador

### Recomendaciones Producción

Para uso real con múltiples usuarios:

1. **Backend necesario** para:
   - Almacenamiento centralizado
   - Sincronización entre dispositivos
   - Backup automático
   - Mayor seguridad

2. **Tecnologías sugeridas**:
   - Backend: Node.js + Express + MongoDB
   - Storage: AWS S3, Google Cloud Storage
   - Auth: JWT, OAuth 2.0
   - Hosting: Vercel, Netlify, Railway

## 📊 Estructura de Archivos

```
├── index.html          # HTML principal
├── app.js              # Lógica de la aplicación
├── manifest.json       # Configuración PWA
├── sw.js              # Service Worker (offline)
└── README.md          # Este archivo
```

## 🐛 Solución de Problemas

### Los archivos no se cargan

**Problema**: Error al seleccionar archivos
**Solución**:
- Verificar que el archivo sea menor a 5MB
- Verificar que sea un formato permitido
- Probar con otro navegador

### Error "Quota exceeded"

**Problema**: No se pueden guardar más datos
**Solución**:
- Exportar registros antiguos
- Eliminar registros no necesarios
- Limpiar archivos adjuntos grandes

### PDF no se genera

**Problema**: Error al exportar PDF
**Solución**:
- Verificar conexión a internet (carga jsPDF desde CDN)
- Desactivar bloqueadores de pop-ups
- Probar en modo incógnito

### Service Worker no funciona

**Problema**: Modo offline no disponible
**Solución**:
- Verificar que uses HTTPS (no HTTP)
- GitHub Pages usa HTTPS automáticamente
- Limpiar caché y recargar (Ctrl+Shift+R)

## 🌐 Navegadores Compatibles

| Navegador | Versión Mínima | Soporte |
|-----------|----------------|---------|
| Chrome | 90+ | ✅ Completo |
| Firefox | 88+ | ✅ Completo |
| Safari | 14+ | ✅ Completo |
| Edge | 90+ | ✅ Completo |
| Opera | 76+ | ✅ Completo |

## 📱 Instalar como App

### Android
1. Abrir en Chrome
2. Menú (⋮) → "Instalar aplicación"
3. Se crea ícono en pantalla de inicio

### iOS
1. Abrir en Safari
2. Compartir → "Agregar a pantalla de inicio"
3. Funciona como app nativa

### Desktop
1. Abrir en Chrome/Edge
2. Ícono de instalación (⊕) en barra de direcciones
3. Clic en "Instalar"

## 🔄 Actualizar

Para actualizar la aplicación desplegada:

```bash
# 1. Modificar archivos localmente
# 2. Commit y push
git add .
git commit -m "Actualización"
git push origin main

# 3. GitHub Pages se actualiza automáticamente (1-2 min)
```

## 📝 Changelog

### v5.0 (2026-02-13)
- ➕ Sistema de adjuntos de archivos
- 📄 Exportación a PDF individual y masiva
- 📊 Exportación a CSV mejorada
- 🎨 UI/UX modernizada
- ⚡ Rendimiento optimizado

### v4.0 (2026-02-12)
- 🔄 Refactorización completa
- 📱 PWA mejorada
- 🌐 Modo offline
- 🔍 Búsqueda en tiempo real

## 🤝 Contribuir

Para contribuir al proyecto:

1. Fork del repositorio
2. Crear branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Sistema desarrollado para uso interno de la Inspección 1131.
Todos los derechos reservados.

## 📧 Contacto

Para soporte o consultas:
- Email: admin@insp1131.edu.ar
- GitHub Issues: [Reportar problema](https://github.com/tu-usuario/tu-repo/issues)

---

**Desarrollado con ❤️ para la Inspección 1131**

⭐ Si te gusta el proyecto, dale una estrella en GitHub!
