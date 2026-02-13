// Firebase imports - usando el CDN modular
import { ref, set, get, update, remove, onValue, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { logEvent } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

(function() {
    'use strict';

    // ========================================
    // CONFIGURACIÓN Y DATOS
    // ========================================
    
    const APP_VERSION = '5.0-Firebase';
    const STORAGE_KEYS = {
        currentUser: 'currentUser_firebase_v5'
    };

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'];

    // Datos de muestra
    const sampleUsers = [
        {
            username: 'admin',
            password: 'admin123',
            name: 'Administrador',
            email: 'admin@insp1131.edu.ar',
            role: 'admin',
            createdAt: new Date().toISOString()
        },
        {
            username: 'supervisor',
            password: 'super123',
            name: 'Supervisor',
            email: 'supervisor@insp1131.edu.ar',
            role: 'supervisor',
            createdAt: new Date().toISOString()
        }
    ];

    const sampleData = [
        {
            id: '1',
            regNumber: 'REG-001-2026',
            date: '2026-02-12',
            time: '10:30',
            docType: 'nota',
            deliveryPerson: 'María González',
            originArea: 'Dirección General',
            userId: '12345678',
            observations: 'Nota urgente',
            registeringUser: 'admin',
            createdAt: new Date().toISOString(),
            attachments: []
        }
    ];

    // ========================================
    // ESTADO DE LA APLICACIÓN
    // ========================================
    
    let currentUser = null;
    let usuarios = [];
    let registros = [];
    let currentFilter = 'all';
    let searchTerm = '';
    let selectedFiles = [];
    let db = null;
    let analytics = null;

    // ========================================
    // INICIALIZACIÓN
    // ========================================
    
    function init() {
        console.log(`📱 Sistema de Registro Documental v${APP_VERSION}`);
        
        // Esperar a que Firebase esté disponible
        if (typeof window.firebaseDatabase === 'undefined') {
            setTimeout(init, 100);
            return;
        }
        
        db = window.firebaseDatabase;
        analytics = window.firebaseAnalytics;
        
        console.log('✅ Firebase conectado');
        
        initializeFirebaseData();
        setupEventListeners();
        checkAuth();
    }

    async function initializeFirebaseData() {
        try {
            // Verificar si existen usuarios en Firebase
            const usuariosRef = ref(db, 'usuarios');
            const snapshot = await get(usuariosRef);
            
            if (!snapshot.exists()) {
                // Si no hay usuarios, crear los usuarios de muestra
                console.log('🔧 Inicializando datos de muestra en Firebase...');
                
                for (const user of sampleUsers) {
                    const userRef = ref(db, `usuarios/${user.username}`);
                    await set(userRef, user);
                }
                
                // Crear un registro de muestra
                const registroRef = ref(db, 'registros/1');
                await set(registroRef, sampleData[0]);
                
                console.log('✅ Datos de muestra creados');
            }
            
            // Cargar usuarios y registros
            loadDataFromFirebase();
            
        } catch (error) {
            console.error('❌ Error inicializando Firebase:', error);
            showMessage('Error conectando con Firebase', 'error');
        }
    }

    function loadDataFromFirebase() {
        // Escuchar cambios en usuarios
        const usuariosRef = ref(db, 'usuarios');
        onValue(usuariosRef, (snapshot) => {
            const data = snapshot.val();
            usuarios = data ? Object.values(data) : [];
            console.log('📥 Usuarios cargados:', usuarios.length);
        });

        // Escuchar cambios en registros
        const registrosRef = ref(db, 'registros');
        onValue(registrosRef, (snapshot) => {
            const data = snapshot.val();
            registros = data ? Object.values(data) : [];
            console.log('📥 Registros cargados:', registros.length);
            
            if (currentUser) {
                renderRegistros();
                updateProfileStats();
            }
        });
    }

    async function saveUserToFirebase(user) {
        try {
            const userRef = ref(db, `usuarios/${user.username}`);
            await set(userRef, user);
            logEvent(analytics, 'user_created', { username: user.username });
            return true;
        } catch (error) {
            console.error('Error guardando usuario:', error);
            return false;
        }
    }

    async function saveRegistroToFirebase(registro) {
        try {
            const registroRef = ref(db, `registros/${registro.id}`);
            await set(registroRef, registro);
            logEvent(analytics, 'registro_created', { 
                docType: registro.docType,
                registeringUser: registro.registeringUser 
            });
            return true;
        } catch (error) {
            console.error('Error guardando registro:', error);
            return false;
        }
    }

    async function deleteRegistroFromFirebase(id) {
        try {
            const registroRef = ref(db, `registros/${id}`);
            await remove(registroRef);
            logEvent(analytics, 'registro_deleted', { registroId: id });
            return true;
        } catch (error) {
            console.error('Error eliminando registro:', error);
            return false;
        }
    }

    function checkAuth() {
        const stored = localStorage.getItem(STORAGE_KEYS.currentUser);
        if (stored) {
            currentUser = JSON.parse(stored);
            showScreen('main');
            updateUI();
            logEvent(analytics, 'session_start', { username: currentUser.username });
        } else {
            showScreen('login');
        }
    }

    // ========================================
    // EVENT LISTENERS
    // ========================================
    
    function setupEventListeners() {
        // Tabs de login
        document.getElementById('tab-login').addEventListener('click', () => {
            document.getElementById('tab-login').classList.add('active');
            document.getElementById('tab-register').classList.remove('active');
            document.getElementById('login-form').classList.remove('hidden');
            document.getElementById('register-form').classList.add('hidden');
        });

        document.getElementById('tab-register').addEventListener('click', () => {
            document.getElementById('tab-register').classList.add('active');
            document.getElementById('tab-login').classList.remove('active');
            document.getElementById('register-form').classList.remove('hidden');
            document.getElementById('login-form').classList.add('hidden');
        });

        // Formulario de login
        document.getElementById('login-form').addEventListener('submit', handleLogin);
        
        // Formulario de registro
        document.getElementById('register-form').addEventListener('submit', handleRegister);
        
        // Formulario de nuevo registro
        document.getElementById('new-registro-form').addEventListener('submit', handleNewRegistro);
        
        // FAB
        document.getElementById('fab-add').addEventListener('click', openNewRegistroModal);
        
        // Navegación inferior
        document.getElementById('nav-home').addEventListener('click', () => showScreen('main'));
        document.getElementById('nav-stats').addEventListener('click', showStats);
        document.getElementById('nav-export').addEventListener('click', openExportModal);
        document.getElementById('nav-profile').addEventListener('click', () => showScreen('profile'));
        
        // Búsqueda
        document.getElementById('search-input').addEventListener('input', handleSearch);
        
        // Filtros
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', handleFilter);
        });

        // File upload
        setupFileUpload();
    }

    // ========================================
    // FILE UPLOAD SETUP
    // ========================================
    
    function setupFileUpload() {
        const fileInput = document.getElementById('file-input');
        const uploadArea = document.getElementById('file-upload-area');
        const fileList = document.getElementById('file-list');

        // Click para seleccionar archivos
        uploadArea.addEventListener('click', () => fileInput.click());

        // Cambio de input
        fileInput.addEventListener('change', handleFileSelect);

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });
    }

    function handleFileSelect(e) {
        handleFiles(e.target.files);
    }

    function handleFiles(files) {
        Array.from(files).forEach(file => {
            // Validar extensión
            const extension = file.name.split('.').pop().toLowerCase();
            if (!ALLOWED_EXTENSIONS.includes(extension)) {
                showMessage(`Formato no permitido: ${extension}`, 'error');
                return;
            }

            // Validar tamaño
            if (file.size > MAX_FILE_SIZE) {
                showMessage(`${file.name} supera el tamaño máximo (5MB)`, 'error');
                return;
            }

            // Leer archivo como base64
            const reader = new FileReader();
            reader.onload = (e) => {
                selectedFiles.push({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    extension: extension,
                    data: e.target.result
                });
                renderFileList();
            };
            reader.readAsDataURL(file);
        });
    }

    function renderFileList() {
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = '';
        
        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
                <button type="button" class="file-remove" onclick="removeFile(${index})">Eliminar</button>
            `;
            fileList.appendChild(fileItem);
        });
    }

    function removeFile(index) {
        selectedFiles.splice(index, 1);
        renderFileList();
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // ========================================
    // AUTENTICACIÓN
    // ========================================
    
    async function handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        
        showLoading('Iniciando sesión...');
        
        try {
            // Obtener usuario de Firebase
            const userRef = ref(db, `usuarios/${username}`);
            const snapshot = await get(userRef);
            
            if (snapshot.exists()) {
                const user = snapshot.val();
                if (user.password === password) {
                    currentUser = user;
                    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
                    
                    hideLoading();
                    showMessage('Inicio de sesión exitoso', 'success');
                    showScreen('main');
                    updateUI();
                    
                    logEvent(analytics, 'login', { 
                        method: 'username_password',
                        username: username 
                    });
                } else {
                    hideLoading();
                    showMessage('Contraseña incorrecta', 'error');
                }
            } else {
                hideLoading();
                showMessage('Usuario no encontrado', 'error');
            }
        } catch (error) {
            hideLoading();
            showMessage('Error al iniciar sesión', 'error');
            console.error(error);
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const role = document.getElementById('reg-role').value;
        
        if (!name || !email || !username || !password || !role) {
            showMessage('Todos los campos son obligatorios', 'error');
            return;
        }
        
        showLoading('Creando cuenta...');
        
        try {
            // Verificar si el usuario ya existe
            const userRef = ref(db, `usuarios/${username}`);
            const snapshot = await get(userRef);
            
            if (snapshot.exists()) {
                hideLoading();
                showMessage('El usuario ya existe', 'error');
                return;
            }
            
            // Crear nuevo usuario
            const newUser = {
                username,
                password,
                name,
                email,
                role,
                createdAt: new Date().toISOString()
            };
            
            const success = await saveUserToFirebase(newUser);
            
            if (success) {
                hideLoading();
                showMessage('Cuenta creada exitosamente', 'success');
                
                // Cambiar a tab de login
                document.getElementById('tab-login').click();
                document.getElementById('register-form').reset();
            } else {
                hideLoading();
                showMessage('Error al crear la cuenta', 'error');
            }
        } catch (error) {
            hideLoading();
            showMessage('Error al crear la cuenta', 'error');
            console.error(error);
        }
    }

    function logout() {
        logEvent(analytics, 'logout', { username: currentUser.username });
        currentUser = null;
        localStorage.removeItem(STORAGE_KEYS.currentUser);
        showScreen('login');
        showMessage('Sesión cerrada', 'success');
    }

    // ========================================
    // REGISTROS
    // ========================================
    
    async function handleNewRegistro(e) {
        e.preventDefault();
        
        const docType = document.getElementById('new-docType').value;
        const deliveryPerson = document.getElementById('new-deliveryPerson').value.trim();
        const originArea = document.getElementById('new-originArea').value.trim();
        const userId = document.getElementById('new-userId').value.trim();
        const observations = document.getElementById('new-observations').value.trim();
        
        if (!docType || !deliveryPerson) {
            showMessage('Complete los campos obligatorios', 'error');
            return;
        }
        
        showLoading('Guardando registro...');
        
        try {
            const now = new Date();
            const year = now.getFullYear();
            const registrosDelAnio = registros.filter(r => {
                const regYear = new Date(r.date).getFullYear();
                return regYear === year;
            });
            
            const nextNumber = (registrosDelAnio.length + 1).toString().padStart(3, '0');
            const regNumber = `REG-${nextNumber}-${year}`;
            
            const newRegistro = {
                id: Date.now().toString(),
                regNumber,
                date: now.toISOString().split('T')[0],
                time: now.toTimeString().split(' ')[0].substring(0, 5),
                docType,
                deliveryPerson,
                originArea,
                userId,
                observations,
                registeringUser: currentUser.username,
                createdAt: now.toISOString(),
                attachments: selectedFiles.map(f => ({
                    name: f.name,
                    size: f.size,
                    type: f.type,
                    extension: f.extension,
                    data: f.data
                }))
            };
            
            const success = await saveRegistroToFirebase(newRegistro);
            
            if (success) {
                hideLoading();
                showMessage('Registro guardado exitosamente', 'success');
                closeNewRegistroModal();
                document.getElementById('new-registro-form').reset();
                selectedFiles = [];
                renderFileList();
            } else {
                hideLoading();
                showMessage('Error al guardar el registro', 'error');
            }
        } catch (error) {
            hideLoading();
            showMessage('Error al guardar el registro', 'error');
            console.error(error);
        }
    }

    function renderRegistros() {
        const container = document.getElementById('registros-list');
        
        if (!currentUser) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px 20px;">Inicie sesión para ver los registros</p>';
            return;
        }
        
        let filtered = registros;
        
        // Filtrar por usuario si no es admin
        if (currentUser.role !== 'admin') {
            filtered = filtered.filter(r => r.registeringUser === currentUser.username);
        }
        
        // Aplicar filtro de tipo
        if (currentFilter !== 'all') {
            filtered = filtered.filter(r => r.docType === currentFilter);
        }
        
        // Aplicar búsqueda
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(r => 
                r.regNumber.toLowerCase().includes(term) ||
                r.deliveryPerson.toLowerCase().includes(term) ||
                r.originArea?.toLowerCase().includes(term) ||
                r.userId?.toLowerCase().includes(term) ||
                r.observations?.toLowerCase().includes(term)
            );
        }
        
        // Ordenar por fecha (más recientes primero)
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (filtered.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px 20px;">No hay registros para mostrar</p>';
            return;
        }
        
        container.innerHTML = filtered.map(registro => `
            <div class="registro-card" onclick="showDetail('${registro.id}')" style="border-left-color: ${getDocTypeColor(registro.docType)}">
                <div class="registro-header">
                    <div class="registro-number">${registro.regNumber}</div>
                    <div class="registro-badge" style="background: ${getDocTypeColor(registro.docType)}">
                        ${getDocTypeShort(registro.docType)}
                    </div>
                </div>
                <div class="registro-info">
                    <div class="registro-info-row">
                        <span>📅 ${formatDate(registro.date)}</span>
                        <span>🕐 ${registro.time}</span>
                    </div>
                    ${registro.originArea ? `<div>🏢 ${registro.originArea}</div>` : ''}
                    ${registro.userId ? `<div>👤 ID: ${registro.userId}</div>` : ''}
                    ${registro.attachments && registro.attachments.length > 0 ? `<div>📎 ${registro.attachments.length} archivo(s)</div>` : ''}
                </div>
                <div class="registro-person">👤 ${registro.deliveryPerson}</div>
            </div>
        `).join('');
    }

    function handleSearch(e) {
        searchTerm = e.target.value.trim();
        renderRegistros();
    }

    function handleFilter(e) {
        currentFilter = e.target.dataset.filter;
        
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.classList.remove('active');
        });
        e.target.classList.add('active');
        
        renderRegistros();
        logEvent(analytics, 'filter_applied', { filter: currentFilter });
    }

    function showDetail(id) {
        const registro = registros.find(r => r.id === id);
        if (!registro) return;
        
        const content = document.getElementById('detail-content');
        
        content.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div class="registro-badge" style="background: ${getDocTypeColor(registro.docType)}; display: inline-block;">
                    ${getDocTypeName(registro.docType)}
                </div>
                <h2 style="margin-top: 10px; color: var(--azul);">${registro.regNumber}</h2>
            </div>
            
            <div class="info-item">
                <div class="info-label">Fecha y hora</div>
                <div class="info-value">📅 ${formatDate(registro.date)} 🕐 ${registro.time}</div>
            </div>
            
            <div class="info-item">
                <div class="info-label">Personal</div>
                <div class="info-value">👤 ${registro.deliveryPerson}</div>
            </div>
            
            ${registro.originArea ? `
                <div class="info-item">
                    <div class="info-label">Área de origen</div>
                    <div class="info-value">🏢 ${registro.originArea}</div>
                </div>
            ` : ''}
            
            ${registro.userId ? `
                <div class="info-item">
                    <div class="info-label">ID Usuario/Alumno</div>
                    <div class="info-value">🆔 ${registro.userId}</div>
                </div>
            ` : ''}
            
            ${registro.observations ? `
                <div class="info-item">
                    <div class="info-label">Observaciones</div>
                    <div class="info-value">${registro.observations}</div>
                </div>
            ` : ''}
            
            <div class="info-item">
                <div class="info-label">Registrado por</div>
                <div class="info-value">👤 ${registro.registeringUser}</div>
            </div>
            
            <div class="info-item">
                <div class="info-label">Fecha de creación</div>
                <div class="info-value">📅 ${formatDateTime(registro.createdAt)}</div>
            </div>
            
            ${registro.attachments && registro.attachments.length > 0 ? `
                <div class="info-item">
                    <div class="info-label">Archivos adjuntos (${registro.attachments.length})</div>
                    ${registro.attachments.map((file, index) => `
                        <div class="file-item" style="margin-top: 8px;">
                            <div class="file-info">
                                <div class="file-name">📎 ${file.name}</div>
                                <div class="file-size">${formatFileSize(file.size)}</div>
                            </div>
                            <button class="btn btn-primary" style="width: auto; padding: 8px 16px;" onclick="downloadAttachment('${registro.id}', ${index})">
                                Descargar
                            </button>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn btn-warning" onclick="exportRegistroPDF('${registro.id}')" style="flex: 1;">
                    📄 Exportar PDF
                </button>
                ${currentUser.role === 'admin' ? `
                    <button class="btn btn-danger" onclick="deleteRegistro('${registro.id}')" style="flex: 1;">
                        🗑️ Eliminar
                    </button>
                ` : ''}
            </div>
        `;
        
        document.getElementById('detail-modal').classList.add('active');
        logEvent(analytics, 'view_registro_detail', { registroId: id });
    }

    async function deleteRegistro(id) {
        if (!confirm('¿Está seguro de eliminar este registro?')) return;
        
        showLoading('Eliminando...');
        
        const success = await deleteRegistroFromFirebase(id);
        
        if (success) {
            hideLoading();
            closeDetailModal();
            showMessage('Registro eliminado', 'success');
        } else {
            hideLoading();
            showMessage('Error al eliminar', 'error');
        }
    }

    function downloadAttachment(registroId, attachmentIndex) {
        const registro = registros.find(r => r.id === registroId);
        if (!registro || !registro.attachments[attachmentIndex]) return;
        
        const file = registro.attachments[attachmentIndex];
        const link = document.createElement('a');
        link.href = file.data;
        link.download = file.name;
        link.click();
        
        logEvent(analytics, 'download_attachment', { 
            registroId,
            fileName: file.name 
        });
    }

    // ========================================
    // EXPORTACIÓN
    // ========================================
    
    function exportToCSV() {
        let data = registros;
        
        if (currentUser.role !== 'admin') {
            data = data.filter(r => r.registeringUser === currentUser.username);
        }
        
        if (data.length === 0) {
            showMessage('No hay registros para exportar', 'warning');
            return;
        }
        
        const headers = ['Número', 'Fecha', 'Hora', 'Tipo', 'Personal', 'Área', 'ID Usuario', 'Observaciones', 'Registrado por', 'Archivos'];
        const rows = data.map(r => [
            r.regNumber,
            r.date,
            r.time,
            getDocTypeName(r.docType),
            r.deliveryPerson,
            r.originArea || '',
            r.userId || '',
            r.observations || '',
            r.registeringUser,
            r.attachments ? r.attachments.length : 0
        ]);
        
        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `registros_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        closeExportModal();
        showMessage('CSV exportado exitosamente', 'success');
        logEvent(analytics, 'export_csv', { recordCount: data.length });
    }

    function exportToPDF() {
        if (typeof jspdf === 'undefined') {
            showMessage('Error: jsPDF no está disponible', 'error');
            return;
        }
        
        let data = registros;
        
        if (currentUser.role !== 'admin') {
            data = data.filter(r => r.registeringUser === currentUser.username);
        }
        
        if (data.length === 0) {
            showMessage('No hay registros para exportar', 'warning');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text('Registros Documentales', 105, 15, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 105, 22, { align: 'center' });
        
        let y = 35;
        const pageHeight = doc.internal.pageSize.height;
        
        data.forEach((r, index) => {
            if (y > pageHeight - 40) {
                doc.addPage();
                y = 20;
            }
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(`${r.regNumber} - ${getDocTypeName(r.docType)}`, 15, y);
            
            y += 7;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Fecha: ${formatDate(r.date)} ${r.time}`, 15, y);
            
            y += 5;
            doc.text(`Personal: ${r.deliveryPerson}`, 15, y);
            
            if (r.originArea) {
                y += 5;
                doc.text(`Área: ${r.originArea}`, 15, y);
            }
            
            if (r.userId) {
                y += 5;
                doc.text(`ID Usuario: ${r.userId}`, 15, y);
            }
            
            if (r.observations) {
                y += 5;
                const lines = doc.splitTextToSize(`Observaciones: ${r.observations}`, 180);
                doc.text(lines, 15, y);
                y += (lines.length * 5);
            }
            
            y += 5;
            doc.text(`Registrado por: ${r.registeringUser}`, 15, y);
            
            y += 10;
            doc.setDrawColor(200);
            doc.line(15, y, 195, y);
            y += 10;
        });
        
        doc.save(`registros_${new Date().toISOString().split('T')[0]}.pdf`);
        closeExportModal();
        showMessage('PDF exportado exitosamente', 'success');
        logEvent(analytics, 'export_pdf', { recordCount: data.length });
    }

    function exportRegistroPDF(id) {
        const registro = registros.find(r => r.id === id);
        if (!registro) return;
        
        if (typeof jspdf === 'undefined') {
            showMessage('Error: jsPDF no está disponible', 'error');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Título
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('REGISTRO DOCUMENTAL', 105, 20, { align: 'center' });
        
        // Información del registro
        let y = 40;
        
        doc.setFontSize(14);
        doc.text(registro.regNumber, 105, y, { align: 'center' });
        
        y += 15;
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        
        const info = [
            `Tipo de documento: ${getDocTypeName(registro.docType)}`,
            `Fecha: ${formatDate(registro.date)}`,
            `Hora: ${registro.time}`,
            `Personal: ${registro.deliveryPerson}`,
        ];
        
        if (registro.originArea) info.push(`Área de origen: ${registro.originArea}`);
        if (registro.userId) info.push(`ID Usuario/Alumno: ${registro.userId}`);
        if (registro.observations) {
            info.push('Observaciones:');
            const obsLines = doc.splitTextToSize(registro.observations, 170);
            info.push(...obsLines);
        }
        
        info.push('');
        info.push(`Registrado por: ${registro.registeringUser}`);
        info.push(`Fecha de creación: ${formatDateTime(registro.createdAt)}`);
        
        if (registro.attachments && registro.attachments.length > 0) {
            info.push('');
            info.push(`Archivos adjuntos: ${registro.attachments.length}`);
            registro.attachments.forEach(file => {
                info.push(`  - ${file.name} (${formatFileSize(file.size)})`);
            });
        }
        
        info.forEach(line => {
            doc.text(line, 20, y);
            y += 7;
        });
        
        doc.save(`${registro.regNumber}.pdf`);
        showMessage('PDF generado exitosamente', 'success');
        logEvent(analytics, 'export_registro_pdf', { registroId: id });
    }

    // ========================================
    // PERFIL Y ESTADÍSTICAS
    // ========================================
    
    function updateProfileStats() {
        if (!currentUser) return;
        
        const userRegistros = currentUser.role === 'admin' 
            ? registros 
            : registros.filter(r => r.registeringUser === currentUser.username);
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const registrosEsteMes = userRegistros.filter(r => {
            const date = new Date(r.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
        
        const registrosEstaSemana = userRegistros.filter(r => {
            const registroDate = new Date(r.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return registroDate >= weekAgo;
        });
        
        const registrosCAP = userRegistros.filter(r => r.docType === 'cap').length;
        
        document.getElementById('stat-total').textContent = userRegistros.length;
        document.getElementById('stat-month').textContent = registrosEsteMes.length;
        document.getElementById('stat-week').textContent = registrosEstaSemana.length;
        document.getElementById('stat-cap').textContent = registrosCAP;
    }

    function showStats() {
        let message = '';
        
        if (currentUser.role === 'admin') {
            const totalRegistros = registros.length;
            const porTipo = {};
            registros.forEach(r => {
                porTipo[r.docType] = (porTipo[r.docType] || 0) + 1;
            });
            
            const totalAdjuntos = registros.reduce((sum, r) => sum + (r.attachments ? r.attachments.length : 0), 0);
            
            message = `Total de registros: ${totalRegistros}\n`;
            message += `Total de archivos adjuntos: ${totalAdjuntos}\n\n`;
            message += 'Por tipo:\n';
            Object.entries(porTipo).forEach(([tipo, count]) => {
                message += `- ${getDocTypeName(tipo)}: ${count}\n`;
            });
        } else {
            const userRegistros = registros.filter(r => r.registeringUser === currentUser.username);
            const totalAdjuntos = userRegistros.reduce((sum, r) => sum + (r.attachments ? r.attachments.length : 0), 0);
            message = `Tus registros: ${userRegistros.length}\n`;
            message += `Archivos adjuntos: ${totalAdjuntos}`;
        }
        
        alert(message);
        logEvent(analytics, 'view_stats');
    }

    // ========================================
    // UTILIDADES
    // ========================================
    
    function showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`${screenName}-screen`).classList.add('active');
        
        if (screenName === 'main') {
            renderRegistros();
            updateActiveNav('nav-home');
        } else if (screenName === 'profile') {
            updateProfileInfo();
            updateProfileStats();
            updateActiveNav('nav-profile');
        }
        
        logEvent(analytics, 'screen_view', { screen_name: screenName });
    }

    function updateActiveNav(activeId) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeItem = document.getElementById(activeId);
        if (activeItem) activeItem.classList.add('active');
    }

    function updateUI() {
        if (!currentUser) return;
        
        document.getElementById('user-name-header').textContent = currentUser.name;
        renderRegistros();
    }

    function updateProfileInfo() {
        if (!currentUser) return;
        
        document.getElementById('profile-username').textContent = currentUser.username;
        document.getElementById('profile-name').textContent = currentUser.name;
        document.getElementById('profile-email').textContent = currentUser.email;
        document.getElementById('profile-role').textContent = getRoleName(currentUser.role);
    }

    function openNewRegistroModal() {
        document.getElementById('new-registro-modal').classList.add('active');
        logEvent(analytics, 'open_new_registro_modal');
    }

    function closeNewRegistroModal() {
        document.getElementById('new-registro-modal').classList.remove('active');
    }

    function closeDetailModal() {
        document.getElementById('detail-modal').classList.remove('active');
    }

    function openExportModal() {
        document.getElementById('export-modal').classList.add('active');
        logEvent(analytics, 'open_export_modal');
    }

    function closeExportModal() {
        document.getElementById('export-modal').classList.remove('active');
    }

    function showLoading(text = 'Cargando...') {
        document.getElementById('loading-text').textContent = text;
        document.getElementById('loading-screen').classList.add('active');
    }

    function hideLoading() {
        document.getElementById('loading-screen').classList.remove('active');
    }

    function showMessage(text, type = 'success') {
        const msg = document.getElementById(`message-${type}`);
        msg.textContent = text;
        msg.style.display = 'block';
        setTimeout(() => {
            msg.style.display = 'none';
        }, 3000);
    }

    // Funciones auxiliares
    function getDocTypeName(type) {
        const names = {
            'nota': 'Nota',
            'informe': 'Informe',
            'expediente': 'Expediente',
            'acta': 'Acta',
            'circular': 'Circular',
            'cap': 'CAP',
            'otro': 'Otro'
        };
        return names[type] || type;
    }

    function getDocTypeShort(type) {
        const names = {
            'nota': 'NTA',
            'informe': 'INF',
            'expediente': 'EXP',
            'acta': 'ACT',
            'circular': 'CIR',
            'cap': 'CAP',
            'otro': 'OTR'
        };
        return names[type] || type;
    }

    function getDocTypeColor(type) {
        const colors = {
            'nota': '#009ADA',
            'informe': '#AF4178',
            'expediente': '#E2464C',
            'acta': '#EB7F27',
            'circular': '#F7BE2B',
            'cap': '#32A430',
            'otro': '#757575'
        };
        return colors[type] || '#757575';
    }

    function getRoleName(role) {
        const names = {
            'admin': 'Administrador',
            'supervisor': 'Supervisor',
            'user': 'Usuario'
        };
        return names[role] || role;
    }

    function formatDate(dateStr) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    function formatDateTime(dateTimeStr) {
        try {
            const date = new Date(dateTimeStr);
            return date.toLocaleDateString('es-AR') + ' ' + date.toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'});
        } catch (e) {
            return dateTimeStr;
        }
    }

    // Exponer funciones globalmente
    window.closeNewRegistroModal = closeNewRegistroModal;
    window.closeDetailModal = closeDetailModal;
    window.closeExportModal = closeExportModal;
    window.showDetail = showDetail;
    window.deleteRegistro = deleteRegistro;
    window.downloadAttachment = downloadAttachment;
    window.exportRegistroPDF = exportRegistroPDF;
    window.logout = logout;
    window.showScreen = showScreen;
    window.showStats = showStats;
    window.exportToCSV = exportToCSV;
    window.exportToPDF = exportToPDF;
    window.openExportModal = openExportModal;
    window.removeFile = removeFile;

    // ========================================
    // INICIAR APLICACIÓN
    // ========================================
    
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Service Worker para PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(() => console.log('✅ Service Worker registrado'))
                .catch(err => console.log('❌ SW Error:', err));
        });
    }

    console.log(`✅ Sistema cargado correctamente - v${APP_VERSION}`);

})();
