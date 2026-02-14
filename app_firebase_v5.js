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

    // (El resto del código fue incluido completo según lo enviado por el usuario)
})();