/**
 * SmolVLM Vision - Real-time Webcam Analysis
 * Uses llama.cpp server with SmolVLM model
 */

// Translations
const translations = {
    tr: {
        ready: 'Hazır',
        stopped: 'Durduruldu',
        analyzing: 'Analiz ediliyor...',
        active: 'Analiz aktif',
        cameraStarting: 'Kamera başlatılıyor...',
        cameraError: 'Kamera hatası',
        connectionError: 'Bağlantı hatası',
        analysisError: 'Analiz hatası',
        settings: 'Ayarlar',
        promptLabel: 'Soru / Prompt',
        intervalLabel: 'Analiz Aralığı',
        aiComment: 'AI Yorumu',
        placeholder: 'Analiz başladığında AI yorumu burada görünecek...',
        start: 'Başlat',
        stop: 'Durdur',
        cameraHint: 'Kamerayı başlatmak için "Başlat" butonuna tıklayın',
        defaultPrompt: 'Bu görselde ne görüyorsun? Kısaca açıkla.',
        promptPlaceholder: 'Ne görmek istiyorsun?',
        apiError: '⚠️ API bağlantısı kurulamadı. llama-server çalıştığından emin olun.',
        errorPrefix: 'Hata:',
        cameraAccessError: 'Kamera erişimi hatası:'
    },
    en: {
        ready: 'Ready',
        stopped: 'Stopped',
        analyzing: 'Analyzing...',
        active: 'Analysis active',
        cameraStarting: 'Starting camera...',
        cameraError: 'Camera error',
        connectionError: 'Connection error',
        analysisError: 'Analysis error',
        settings: 'Settings',
        promptLabel: 'Question / Prompt',
        intervalLabel: 'Analysis Interval',
        aiComment: 'AI Comment',
        placeholder: 'AI analysis will appear here when started...',
        start: 'Start',
        stop: 'Stop',
        cameraHint: 'Click "Start" button to start the camera',
        defaultPrompt: 'What do you see in this image? Describe briefly.',
        promptPlaceholder: 'What do you want to see?',
        apiError: '⚠️ Could not connect to API. Make sure llama-server is running.',
        errorPrefix: 'Error:',
        cameraAccessError: 'Camera access error:'
    }
};

class SmolVLMVision {
    constructor() {
        // DOM Elements
        this.webcam = document.getElementById('webcam');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.videoOverlay = document.getElementById('videoOverlay');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = this.statusIndicator.querySelector('.status-text');
        this.responseContent = document.getElementById('responseContent');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.apiEndpoint = document.getElementById('apiEndpoint');
        this.instruction = document.getElementById('instruction');
        this.intervalSelect = document.getElementById('interval');
        this.languageToggle = document.getElementById('languageToggle');

        // State
        this.stream = null;
        this.analysisInterval = null;
        this.isAnalyzing = false;
        this.isProcessing = false;
        this.currentLang = localStorage.getItem('visionai-lang') || 'tr';

        // Bind methods
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.captureAndAnalyze = this.captureAndAnalyze.bind(this);

        // Initialize
        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', this.start);
        this.stopBtn.addEventListener('click', this.stop);

        // Update interval on change
        this.intervalSelect.addEventListener('change', () => {
            if (this.isAnalyzing) {
                this.restartAnalysisLoop();
            }
        });

        // Language toggle
        this.languageToggle.addEventListener('click', (e) => {
            if (e.target.classList.contains('lang-btn')) {
                const lang = e.target.dataset.lang;
                this.setLanguage(lang);
            }
        });

        // Apply saved language
        this.applyLanguage();
    }

    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('visionai-lang', lang);
        this.applyLanguage();
    }

    applyLanguage() {
        const t = translations[this.currentLang];

        // Update language toggle buttons
        this.languageToggle.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === this.currentLang);
        });

        // Update all i18n elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (t[key]) {
                el.textContent = t[key];
            }
        });

        // Update placeholder and default prompt value
        this.instruction.placeholder = t.promptPlaceholder;

        // Update default prompt if it matches the other language's default
        const otherLang = this.currentLang === 'tr' ? 'en' : 'tr';
        if (this.instruction.value === translations[otherLang].defaultPrompt ||
            this.instruction.value === t.defaultPrompt ||
            this.instruction.value === '') {
            this.instruction.value = t.defaultPrompt;
        }
    }

    t(key) {
        return translations[this.currentLang][key] || key;
    }

    setStatus(status, text) {
        this.statusIndicator.className = 'status-indicator';
        if (status) {
            this.statusIndicator.classList.add(status);
        }
        this.statusText.textContent = text;
    }

    async start() {
        try {
            this.setStatus('processing', this.t('cameraStarting'));

            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });

            this.webcam.srcObject = this.stream;
            await this.webcam.play();

            // Set canvas size
            this.canvas.width = this.webcam.videoWidth;
            this.canvas.height = this.webcam.videoHeight;

            // Hide overlay
            this.videoOverlay.classList.add('hidden');

            // Update UI
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.setStatus('active', this.t('active'));

            // Start analysis loop
            this.isAnalyzing = true;
            this.startAnalysisLoop();

        } catch (error) {
            console.error('Camera error:', error);
            this.setStatus('error', this.t('cameraError'));
            this.showResponse(`${this.t('cameraAccessError')} ${error.message}`, true);
        }
    }

    stop() {
        // Stop analysis
        this.isAnalyzing = false;
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }

        // Stop camera
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        this.webcam.srcObject = null;

        // Show overlay
        this.videoOverlay.classList.remove('hidden');

        // Update UI
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.setStatus('', this.t('stopped'));
    }

    startAnalysisLoop() {
        const interval = parseInt(this.intervalSelect.value, 10);

        // Immediate first capture
        this.captureAndAnalyze();

        // Set up interval
        this.analysisInterval = setInterval(() => {
            if (!this.isProcessing && this.isAnalyzing) {
                this.captureAndAnalyze();
            }
        }, interval);
    }

    restartAnalysisLoop() {
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
        }
        this.startAnalysisLoop();
    }

    captureFrame() {
        // Draw video frame to canvas (flip horizontally to match video)
        this.ctx.save();
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(this.webcam, -this.canvas.width, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        // Get base64 image (JPEG for smaller size)
        return this.canvas.toDataURL('image/jpeg', 0.8);
    }

    async captureAndAnalyze() {
        if (this.isProcessing) return;

        this.isProcessing = true;
        this.setStatus('processing', this.t('analyzing'));

        try {
            // Capture frame
            const imageData = this.captureFrame();
            const base64Image = imageData.split(',')[1]; // Remove data:image/jpeg;base64, prefix

            // Prepare request
            const requestBody = {
                model: "SmolVLM",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`
                                }
                            },
                            {
                                type: "text",
                                text: this.instruction.value || "What do you see?"
                            }
                        ]
                    }
                ],
                max_tokens: 256,
                temperature: 0.7,
                stream: false
            };

            // Send to API
            const response = await fetch(this.apiEndpoint.value, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Extract response text
            const responseText = data.choices?.[0]?.message?.content || 'No response';
            this.showResponse(responseText);
            this.setStatus('active', this.t('active'));

        } catch (error) {
            console.error('Analysis error:', error);

            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.showResponse(this.t('apiError'), true);
                this.setStatus('error', this.t('connectionError'));
            } else {
                this.showResponse(`${this.t('errorPrefix')} ${error.message}`, true);
                this.setStatus('error', this.t('analysisError'));
            }
        } finally {
            this.isProcessing = false;
        }
    }

    showResponse(text, isError = false) {
        this.responseContent.innerHTML = `<p class="response-text ${isError ? 'error' : ''}">${text}</p>`;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SmolVLMVision();
});
