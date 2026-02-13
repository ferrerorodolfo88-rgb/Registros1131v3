# 📱 Inspección 1131 - Sistema de Registro Documental

Sistema web progresivo (PWA) para gestión de registros documentales con integración Firebase Realtime Database y Analytics.

## 🚀 Características

- ✅ **Autenticación de usuarios** con Firebase
- 📝 **Registro de documentos** (Notas, Informes, Expedientes, Actas, Circulares, CAPs)
- 📎 **Adjuntar archivos** (PDF, JPG, DOCX, XLSX)
- 🔍 **Búsqueda y filtros** en tiempo real
- 📊 **Estadísticas** y análisis de datos
- 📄 **Exportación** a CSV y PDF
- 📱 **PWA** - Funciona como app nativa en móviles
- 🔄 **Sincronización en tiempo real** con Firebase
- 📈 **Analytics** para seguimiento de uso

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase Realtime Database
- **Analytics**: Firebase Analytics
- **PWA**: Service Worker, Manifest
- **Librerías**: jsPDF para generación de PDFs

## 📋 Requisitos previos

- Cuenta de Firebase (gratuita)
- Navegador web moderno
- Conexión a internet

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/zona1131-2026.git
cd zona1131-2026
```

### 2. Configuración de Firebase

Los archivos ya incluyen la configuración de Firebase con las credenciales proporcionadas:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAefpQnJMmNvhuzToRjlqQ85DidDK8D4sU",
  authDomain: "zona1131-2026.firebaseapp.com",
  databaseURL: "https://zona1131-2026-default-rtdb.firebaseio.com",
  projectId: "zona1131-2026",
  storageBucket: "zona1131-2026.firebasestorage.app",
  messagingSenderId: "801746519817",
  appId: "1:801746519817:web:3cc09690afd0174601f5d8",
  measurementId: "G-ZN2HM53KNY"
};
```

⚠️ **Importante**: Para producción, se recomienda:
1. Configurar reglas de seguridad en Firebase
2. Habilitar dominios autorizados en Firebase Console
3. Considerar usar Firebase Authentication para mayor seguridad

### 3. Configurar Firebase Database Rules

Ve a **Firebase Console > Realtime Database > Rules** y configura:

```json
{
  "rules": {
    "usuarios": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$uid": {
        ".validate": "newData.hasChildren(['username', 'name', 'email', 'role'])"
      }
    },
    "registros": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$registroId": {
        ".validate": "newData.hasChildren(['id', 'regNumber', 'date', 'docType', 'deliveryPerson', 'registeringUser'])"
      }
    }
  }
}
```

**Nota**: Las reglas actuales permiten lectura/escritura sin autenticación para desarrollo. Para producción, debes implementar Firebase Authentication.

### 4. Estructura de archivos

```
zona1131-2026/
├── index.html          # Página principal
├── app.js              # Lógica de la aplicación
├── sw.js               # Service Worker para PWA
├── manifest.json       # Manifest de la PWA
└── README.md           # Este archivo
```

### 5. Despliegue

#### Opción A: GitHub Pages (Recomendado)

1. Sube los archivos a tu repositorio de GitHub
2. Ve a **Settings > Pages**
3. Selecciona la rama `main` y carpeta `/ (root)`
4. Guarda y espera unos minutos
5. Tu app estará en: `https://TU_USUARIO.github.io/zona1131-2026/`

#### Opción B: Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Iniciar sesión
firebase login

# Inicializar proyecto
firebase init hosting

# Desplegar
firebase deploy
```

#### Opción C: Servidor local

```bash
# Con Python 3
python -m http.server 8000

# Con Node.js
npx http-server

# Con PHP
php -S localhost:8000
```

Luego abre: `http://localhost:8000`

## 👥 Usuarios de prueba

La aplicación crea automáticamente dos usuarios de prueba:

### Administrador
- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Permisos**: Ver y gestionar todos los registros

### Supervisor
- **Usuario**: `supervisor`
- **Contraseña**: `super123`
- **Permisos**: Ver solo sus propios registros

## 📖 Uso

### Iniciar sesión
1. Abre la aplicación
2. Ingresa usuario y contraseña
3. Haz clic en "Ingresar"

### Crear un nuevo registro
1. Haz clic en el botón **+** (FAB)
2. Completa el formulario
3. Opcionalmente adjunta archivos
4. Haz clic en "Guardar Registro"

### Buscar registros
- Usa la barra de búsqueda en la parte superior
- Aplica filtros por tipo de documento

### Exportar datos
1. Ve a la pestaña "Exportar"
2. Selecciona formato (CSV o PDF)
3. El archivo se descargará automáticamente

## 🔐 Seguridad

### Recomendaciones para producción:

1. **Implementar Firebase Authentication**
   ```javascript
   import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
   ```

2. **Actualizar reglas de Firebase**
   - Requiere autenticación para todas las operaciones
   - Validar estructura de datos
   - Limitar tamaño de archivos adjuntos

3. **Variables de entorno**
   - No commitear credenciales en el código
   - Usar variables de entorno para configuración

4. **HTTPS obligatorio**
   - Asegúrate de que tu dominio use HTTPS
   - Firebase Hosting incluye SSL gratuito

## 📊 Estructura de datos en Firebase

### Usuarios (`/usuarios/{username}`)
```json
{
  "username": "admin",
  "password": "hash_aqui",
  "name": "Administrador",
  "email": "admin@example.com",
  "role": "admin",
  "createdAt": "2026-02-13T12:00:00.000Z"
}
```

### Registros (`/registros/{id}`)
```json
{
  "id": "1708012800000",
  "regNumber": "REG-001-2026",
  "date": "2026-02-13",
  "time": "12:00",
  "docType": "nota",
  "deliveryPerson": "Juan Pérez",
  "originArea": "Dirección General",
  "userId": "12345678",
  "observations": "Observaciones del documento",
  "registeringUser": "admin",
  "createdAt": "2026-02-13T12:00:00.000Z",
  "attachments": [
    {
      "name": "documento.pdf",
      "size": 1024000,
      "type": "application/pdf",
      "extension": "pdf",
      "data": "data:application/pdf;base64,..."
    }
  ]
}
```

## 🎨 Personalización

### Colores
Los colores están definidos en variables CSS en `index.html`:
```css
:root {
  --azul: #004582;
  --celeste: #009ADA;
  --magenta: #AF4178;
  /* ... */
}
```

### Tipos de documentos
Puedes agregar más tipos en `app.js`:
```javascript
const docTypes = {
  'nota': 'Nota',
  'informe': 'Informe',
  // Agregar aquí nuevos tipos
};
```

## 🐛 Troubleshooting

### Error: "Firebase no está disponible"
- Verifica tu conexión a internet
- Asegúrate de que los scripts de Firebase se carguen correctamente
- Revisa la consola del navegador para errores

### Los cambios no se sincronizan
- Verifica las reglas de Firebase Database
- Asegúrate de estar autenticado correctamente
- Revisa la consola de Firebase para ver actividad

### La PWA no se instala
- Usa HTTPS (requerido para PWA)
- Verifica que `manifest.json` y `sw.js` sean accesibles
- Revisa la consola de DevTools > Application

## 📱 Instalación como PWA

### Android
1. Abre la app en Chrome
2. Toca el menú (⋮)
3. Selecciona "Agregar a la pantalla de inicio"

### iOS
1. Abre la app en Safari
2. Toca el botón de compartir
3. Selecciona "Agregar a pantalla de inicio"

### Desktop (Chrome/Edge)
1. Busca el ícono de instalación en la barra de direcciones
2. Haz clic en "Instalar"

## 📈 Analytics

La aplicación registra automáticamente estos eventos en Firebase Analytics:
- `session_start` - Inicio de sesión
- `login` - Login exitoso
- `user_created` - Nuevo usuario registrado
- `registro_created` - Nuevo registro creado
- `registro_deleted` - Registro eliminado
- `view_registro_detail` - Ver detalles de registro
- `export_csv` - Exportación a CSV
- `export_pdf` - Exportación a PDF
- `screen_view` - Cambio de pantalla

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👤 Autor

Desarrollado para la Inspección 1131

## 📞 Soporte

Para reportar problemas o sugerencias, abre un [issue](https://github.com/TU_USUARIO/zona1131-2026/issues) en GitHub.

---

**Versión**: 5.0-Firebase  
**Última actualización**: Febrero 2026
