(function() {
    'use strict';

    // ========================================
    // CONFIGURACIÓN Y DATOS
    // ========================================
    
    const APP_VERSION = '5.0';
    const STORAGE_KEYS = {
        registros: 'registrosDocumentales_v5',
        usuarios: 'usuariosDocumentales_v5',
        currentUser: 'currentUser_v5'
    };

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'];

    // Datos de muestra
    const sampleUsers = [
        {
            username: 'Admin',
            password: 'Admin123',
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

    // ========================================
    // INICIALIZACIÓN
    // ========================================
    
    function init() {
        console.log(`📱 Sistema de Registro Documental v${APP_VERSION}`);
        
        loadData();
        setupEventListeners();
        checkAuth();
    }

    function loadData() {
        // Cargar usuarios
        const storedUsers = localStorage.getItem(STORAGE_KEYS.usuarios);
        usuarios = storedUsers ? JSON.parse(storedUsers) : sampleUsers;
        
        // Cargar registros
        const storedRegistros = localStorage.getItem(STORAGE_KEYS.registros);
        registros = storedRegistros ? JSON.parse(storedRegistros) : sampleData;
        
        // Guardar datos si es primera vez
        if (!storedUsers) saveUsers();
        if (!storedRegistros) saveRegistros();
    }

    function saveUsers() {
        try {
            localStorage.setItem(STORAGE_KEYS.usuarios, JSON.stringify(usuarios));
        } catch (e) {
            showMessage('Error al guardar usuarios', 'error');
            console.error(e);
        }
    }

    function saveRegistros() {
        try {
            localStorage.setItem(STORAGE_KEYS.registros, JSON.stringify(registros));
        } catch (e) {
            showMessage('Error al guardar registros', 'error');
            console.error(e);
        }
    }

    function checkAuth() {
        const stored = localStorage.getItem(STORAGE_KEYS.currentUser);
        if (stored) {
            currentUser = JSON.parse(stored);
            showScreen('main');
            updateUI();
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

        // Limpiar input
        document.getElementById('file-input').value = '';
    }

    function renderFileList() {
        const fileList = document.getElementById('file-list');
        
        if (selectedFiles.length === 0) {
            fileList.innerHTML = '';
            return;
        }

        fileList.innerHTML = selectedFiles.map((file, index) => `
            <div class="file-item">
                <div class="file-info">
                    <div>
                        <div class="file-name">${getFileIcon(file.extension)} ${file.name}</div>
                        <div class="file-size">${formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button type="button" class="file-remove" onclick="removeFile(${index})">×</button>
            </div>
        `).join('');
    }

    function removeFile(index) {
        selectedFiles.splice(index, 1);
        renderFileList();
    }

    function getFileIcon(extension) {
        const icons = {
            'pdf': '📄',
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'png': '🖼️',
            'doc': '📝',
            'docx': '📝',
            'xls': '📊',
            'xlsx': '📊'
        };
        return icons[extension] || '📎';
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // ========================================
    // AUTENTICACIÓN
    // ========================================
    
    function handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!username || !password) {
            showMessage('Complete todos los campos', 'warning');
            return;
        }
        
        const user = usuarios.find(u => u.username === username && u.password === password);
        
        if (user) {
            currentUser = user;
            localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
            showMessage(`Bienvenido, ${user.name}!`, 'success');
            showScreen('main');
            updateUI();
            
            // Limpiar formulario
            document.getElementById('login-form').reset();
        } else {
            showMessage('Usuario o contraseña incorrectos', 'error');
        }
    }

    function handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        
        // Validaciones
        if (!username || !password || !name || !email) {
            showMessage('Complete todos los campos', 'warning');
            return;
        }
        
        if (password.length < 6) {
            showMessage('La contraseña debe tener al menos 6 caracteres', 'warning');
            return;
        }
        
        if (usuarios.find(u => u.username === username)) {
            showMessage('El nombre de usuario ya existe', 'warning');
            return;
        }
        
        // Crear nuevo usuario
        const newUser = {
            username,
            password,
            name,
            email,
            role: 'user',
            createdAt: new Date().toISOString()
        };
        
        usuarios.push(newUser);
        saveUsers();
        
        showMessage('Cuenta creada exitosamente', 'success');
        
        // Cambiar a tab de login
        document.getElementById('tab-login').click();
        document.getElementById('register-form').reset();
    }

    function logout() {
        if (confirm('¿Cerrar sesión?')) {
            currentUser = null;
            localStorage.removeItem(STORAGE_KEYS.currentUser);
            showScreen('login');
            showMessage('Sesión cerrada', 'success');
        }
    }

    // ========================================
    // GESTIÓN DE REGISTROS
    // ========================================
    
    function handleNewRegistro(e) {
        e.preventDefault();
        
        const docType = document.getElementById('new-docType').value;
        const deliveryPerson = document.getElementById('new-deliveryPerson').value.trim();
        const originArea = document.getElementById('new-originArea').value.trim();
        const userId = document.getElementById('new-userId').value.trim();
        const observations = document.getElementById('new-observations').value.trim();
        
        if (!docType || !deliveryPerson) {
            showMessage('Complete los campos obligatorios', 'warning');
            return;
        }
        
        // Generar número de registro
        const regNumber = generateRegNumber(docType);
        
        // Crear registro
        const newRegistro = {
            id: Date.now().toString(),
            regNumber,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            docType,
            deliveryPerson,
            originArea: originArea || '',
            userId: userId || '',
            observations: observations || '',
            registeringUser: currentUser.username,
            createdAt: new Date().toISOString(),
            attachments: [...selectedFiles] // Guardar archivos adjuntos
        };
        
        registros.unshift(newRegistro);
        saveRegistros();
        
        showMessage(`Registro ${regNumber} creado exitosamente`, 'success');
        closeNewRegistroModal();
        renderRegistros();
        updateProfileStats();
        
        // Limpiar formulario y archivos
        document.getElementById('new-registro-form').reset();
        selectedFiles = [];
        renderFileList();
    }

    function generateRegNumber(docType) {
        const prefix = getDocTypeShort(docType);
        const year = new Date().getFullYear();
        const count = registros.filter(r => r.regNumber.startsWith(`${prefix}-`)).length + 1;
        return `${prefix}-${String(count).padStart(3, '0')}-${year}`;
    }

    function renderRegistros() {
        const container = document.getElementById('registros-list');
        
        // Filtrar registros
        let filtered = registros.filter(r => {
            if (currentUser.role !== 'admin') {
                if (r.registeringUser !== currentUser.username) return false;
            }
            if (currentFilter !== 'all' && r.docType !== currentFilter) return false;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return r.regNumber.toLowerCase().includes(term) ||
                       r.deliveryPerson.toLowerCase().includes(term) ||
                       (r.originArea && r.originArea.toLowerCase().includes(term)) ||
                       (r.userId && r.userId.toLowerCase().includes(term));
            }
            return true;
        });
        
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <div class="empty-text">No hay registros para mostrar</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filtered.map(r => `
            <div class="registro-card" onclick="showDetail('${r.id}')">
                <div class="registro-header">
                    <div class="registro-number">${r.regNumber}</div>
                    <div class="registro-badge" style="background: ${getDocTypeColor(r.docType)}">
                        ${getDocTypeName(r.docType)}
                    </div>
                </div>
                <div class="registro-info">
                    <div class="info-item">
                        <div class="info-label">Fecha</div>
                        <div class="info-value">${formatDate(r.date)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Hora</div>
                        <div class="info-value">${r.time}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Personal</div>
                        <div class="info-value">${r.deliveryPerson}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Área</div>
                        <div class="info-value">${r.originArea || 'No especificada'}</div>
                    </div>
                </div>
                ${r.attachments && r.attachments.length > 0 ? `
                    <div class="attachments-badge">
                        📎 ${r.attachments.length} archivo${r.attachments.length > 1 ? 's' : ''}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    function showDetail(id) {
        const registro = registros.find(r => r.id === id);
        if (!registro) return;
        
        let attachmentsHTML = '';
        if (registro.attachments && registro.attachments.length > 0) {
            attachmentsHTML = `
                <div class="mt-3">
                    <h4 class="mb-1">Archivos adjuntos (${registro.attachments.length})</h4>
                    <div class="attachment-grid">
                        ${registro.attachments.map((file, index) => `
                            <div class="attachment-card" onclick="downloadAttachment('${id}', ${index})">
                                <div class="attachment-icon">${getFileIcon(file.extension)}</div>
                                <div class="attachment-name">${file.name}</div>
                                <div class="attachment-size">${formatFileSize(file.size)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        document.getElementById('detail-content').innerHTML = `
            <div class="mb-2">
                <h4>${registro.regNumber}</h4>
                <div class="registro-badge mt-1" style="background: ${getDocTypeColor(registro.docType)}; display: inline-block;">
                    ${getDocTypeName(registro.docType)}
                </div>
            </div>
            
            <div class="info-item mb-2">
                <div class="info-label">Fecha y hora</div>
                <div class="info-value">${formatDate(registro.date)} ${registro.time}</div>
            </div>
            
            <div class="info-item mb-2">
                <div class="info-label">Personal</div>
                <div class="info-value">${registro.deliveryPerson}</div>
            </div>
            
            <div class="info-item mb-2">
                <div class="info-label">Área de origen</div>
                <div class="info-value">${registro.originArea || 'No especificada'}</div>
            </div>
            
            <div class="info-item mb-2">
                <div class="info-label">ID Usuario/Alumno</div>
                <div class="info-value">${registro.userId || 'No especificado'}</div>
            </div>
            
            <div class="info-item mb-2">
                <div class="info-label">Observaciones</div>
                <div class="info-value">${registro.observations || 'Sin observaciones'}</div>
            </div>
            
            <div class="info-item mb-2">
                <div class="info-label">Registrado por</div>
                <div class="info-value">${registro.registeringUser}</div>
            </div>
            
            <div class="info-item mb-3">
                <div class="info-label">Fecha de creación</div>
                <div class="info-value">${formatDateTime(registro.createdAt)}</div>
            </div>
            
            ${attachmentsHTML}
            
            <button class="btn btn-warning" onclick="exportRegistroPDF('${id}')">
                📄 Exportar como PDF
            </button>
            
            ${currentUser.role === 'admin' || registro.registeringUser === currentUser.username ? `
                <button class="btn btn-danger" onclick="deleteRegistro('${id}')">
                    🗑️ Eliminar Registro
                </button>
            ` : ''}
        `;
        
        document.getElementById('detail-modal').classList.add('active');
    }

    function downloadAttachment(registroId, attachmentIndex) {
        const registro = registros.find(r => r.id === registroId);
        if (!registro || !registro.attachments || !registro.attachments[attachmentIndex]) return;
        
        const file = registro.attachments[attachmentIndex];
        const link = document.createElement('a');
        link.href = file.data;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showMessage('Descargando archivo...', 'success');
    }

    function deleteRegistro(id) {
        if (!confirm('¿Eliminar este registro?')) return;
        
        registros = registros.filter(r => r.id !== id);
        saveRegistros();
        closeDetailModal();
        renderRegistros();
        updateProfileStats();
        showMessage('Registro eliminado', 'success');
    }

    // ========================================
    // EXPORTACIÓN
    // ========================================
    
    function exportToCSV() {
        showLoading('Exportando a CSV...');
        
        setTimeout(() => {
            let registrosMostrar = registros;
            if (currentUser.role !== 'admin') {
                registrosMostrar = registros.filter(r => r.registeringUser === currentUser.username);
            }
            
            if (registrosMostrar.length === 0) {
                showMessage('No hay registros para exportar', 'warning');
                hideLoading();
                return;
            }
            
            // Crear contenido CSV
            let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
            
            // Encabezados
            const headers = ["N° Registro", "Fecha", "Hora", "Tipo", "Personal", "Área", "ID Usuario", "Observaciones", "Adjuntos", "Usuario", "Fecha Creación"];
            csvContent += headers.join(";") + "\n";
            
            // Datos
            registrosMostrar.forEach(registro => {
                const attachmentsCount = registro.attachments ? registro.attachments.length : 0;
                const row = [
                    `"${registro.regNumber}"`,
                    `"${registro.date}"`,
                    `"${registro.time}"`,
                    `"${getDocTypeName(registro.docType)}"`,
                    `"${registro.deliveryPerson}"`,
                    `"${registro.originArea || ''}"`,
                    `"${registro.userId || ''}"`,
                    `"${(registro.observations || '').replace(/"/g, '""')}"`,
                    `"${attachmentsCount}"`,
                    `"${registro.registeringUser}"`,
                    `"${registro.createdAt}"`
                ];
                csvContent += row.join(";") + "\n";
            });
            
            // Crear enlace de descarga
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `registros_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showMessage('CSV exportado exitosamente', 'success');
            hideLoading();
            closeExportModal();
        }, 500);
    }

    function exportToPDF() {
        showLoading('Generando PDF...');
        
        setTimeout(() => {
            let registrosMostrar = registros;
            if (currentUser.role !== 'admin') {
                registrosMostrar = registros.filter(r => r.registeringUser === currentUser.username);
            }
            
            if (registrosMostrar.length === 0) {
                showMessage('No hay registros para exportar', 'warning');
                hideLoading();
                return;
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Título
            doc.setFontSize(18);
            doc.setTextColor(0, 69, 130);
            doc.text('Inspección 1131', 105, 20, { align: 'center' });
            
            doc.setFontSize(14);
            doc.text('Registro Documental', 105, 28, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}`, 105, 35, { align: 'center' });
            doc.text(`Usuario: ${currentUser.name}`, 105, 40, { align: 'center' });
            
            // Línea separadora
            doc.setDrawColor(0, 69, 130);
            doc.line(20, 45, 190, 45);
            
            let yPosition = 55;
            const pageHeight = doc.internal.pageSize.height;
            
            registrosMostrar.forEach((registro, index) => {
                // Verificar si necesitamos nueva página
                if (yPosition > pageHeight - 60) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                // Número de registro
                doc.setFontSize(12);
                doc.setTextColor(0, 69, 130);
                doc.setFont(undefined, 'bold');
                doc.text(`${index + 1}. ${registro.regNumber}`, 20, yPosition);
                
                // Tipo
                doc.setFontSize(9);
                doc.setTextColor(255, 140, 66);
                doc.setFont(undefined, 'bold');
                doc.text(getDocTypeName(registro.docType), 100, yPosition);
                
                yPosition += 7;
                
                // Detalles
                doc.setFontSize(9);
                doc.setTextColor(0);
                doc.setFont(undefined, 'normal');
                
                const details = [
                    `Fecha: ${formatDate(registro.date)} ${registro.time}`,
                    `Personal: ${registro.deliveryPerson}`,
                    `Área: ${registro.originArea || 'No especificada'}`,
                    `ID: ${registro.userId || 'No especificado'}`,
                    registro.observations ? `Obs: ${registro.observations}` : null,
                    registro.attachments && registro.attachments.length > 0 ? `Adjuntos: ${registro.attachments.length} archivo(s)` : null
                ].filter(Boolean);
                
                details.forEach(detail => {
                    if (yPosition > pageHeight - 30) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    doc.text(detail, 25, yPosition);
                    yPosition += 5;
                });
                
                // Línea separadora
                yPosition += 3;
                doc.setDrawColor(200);
                doc.line(20, yPosition, 190, yPosition);
                yPosition += 8;
            });
            
            // Pie de página en última página
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Página ${i} de ${totalPages}`, 105, pageHeight - 10, { align: 'center' });
            }
            
            // Guardar PDF
            doc.save(`Registros_Insp1131_${new Date().toISOString().split('T')[0]}.pdf`);
            
            showMessage('PDF generado exitosamente', 'success');
            hideLoading();
            closeExportModal();
        }, 500);
    }

    function exportRegistroPDF(id) {
        const registro = registros.find(r => r.id === id);
        if (!registro) return;
        
        showLoading('Generando PDF...');
        
        setTimeout(() => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Cabecera
            doc.setFontSize(16);
            doc.setTextColor(0, 69, 130);
            doc.text('Inspección 1131', 105, 20, { align: 'center' });
            
            doc.setFontSize(12);
            doc.text('Registro Documental', 105, 28, { align: 'center' });
            
            // Línea
            doc.setDrawColor(0, 69, 130);
            doc.line(20, 35, 190, 35);
            
            let y = 45;
            
            // Número de registro
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(registro.regNumber, 20, y);
            
            // Tipo
            y += 8;
            doc.setFontSize(10);
            doc.setTextColor(255, 140, 66);
            doc.text(`Tipo: ${getDocTypeName(registro.docType)}`, 20, y);
            
            // Datos
            y += 10;
            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.setFont(undefined, 'normal');
            
            const datos = [
                ['Fecha:', `${formatDate(registro.date)}`],
                ['Hora:', registro.time],
                ['Personal:', registro.deliveryPerson],
                ['Área de origen:', registro.originArea || 'No especificada'],
                ['ID Usuario/Alumno:', registro.userId || 'No especificado'],
                ['Registrado por:', registro.registeringUser],
                ['Fecha de creación:', formatDateTime(registro.createdAt)]
            ];
            
            datos.forEach(([label, value]) => {
                doc.setFont(undefined, 'bold');
                doc.text(label, 20, y);
                doc.setFont(undefined, 'normal');
                doc.text(value, 70, y);
                y += 7;
            });
            
            // Observaciones
            if (registro.observations) {
                y += 5;
                doc.setFont(undefined, 'bold');
                doc.text('Observaciones:', 20, y);
                y += 7;
                doc.setFont(undefined, 'normal');
                const splitObs = doc.splitTextToSize(registro.observations, 170);
                doc.text(splitObs, 20, y);
                y += splitObs.length * 7;
            }
            
            // Adjuntos
            if (registro.attachments && registro.attachments.length > 0) {
                y += 10;
                doc.setFont(undefined, 'bold');
                doc.text(`Archivos adjuntos: ${registro.attachments.length}`, 20, y);
                y += 7;
                
                doc.setFont(undefined, 'normal');
                registro.attachments.forEach(file => {
                    doc.text(`${getFileIcon(file.extension)} ${file.name} (${formatFileSize(file.size)})`, 25, y);
                    y += 6;
                });
            }
            
            // Pie
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 105, 280, { align: 'center' });
            
            doc.save(`Registro_${registro.regNumber}.pdf`);
            
            showMessage('PDF generado exitosamente', 'success');
            hideLoading();
        }, 500);
    }

    // ========================================
    // BÚSQUEDA Y FILTROS
    // ========================================
    
    function handleSearch(e) {
        searchTerm = e.target.value.trim();
        renderRegistros();
    }

    function handleFilter(e) {
        const filter = e.target.dataset.filter;
        currentFilter = filter;
        
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.classList.remove('active');
        });
        e.target.classList.add('active');
        
        renderRegistros();
    }

    // ========================================
    // ESTADÍSTICAS
    // ========================================
    
    function updateProfileStats() {
        if (!currentUser) return;
        
        const userRegistros = registros.filter(r => r.registeringUser === currentUser.username);
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
    }

    function closeNewRegistroModal() {
        document.getElementById('new-registro-modal').classList.remove('active');
    }

    function closeDetailModal() {
        document.getElementById('detail-modal').classList.remove('active');
    }

    function openExportModal() {
        document.getElementById('export-modal').classList.add('active');
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
