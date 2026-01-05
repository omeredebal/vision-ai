/**
 * SmolVLM Vision - Real-time Webcam Analysis
 * Uses llama.cpp server with SmolVLM model
 */

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

        // State
        this.stream = null;
        this.analysisInterval = null;
        this.isAnalyzing = false;
        this.isProcessing = false;

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
            this.setStatus('processing', 'Kamera başlatılıyor...');

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
            this.setStatus('active', 'Analiz aktif');

            // Start analysis loop
            this.isAnalyzing = true;
            this.startAnalysisLoop();

        } catch (error) {
            console.error('Camera error:', error);
            this.setStatus('error', 'Kamera hatası');
            this.showResponse(`Kamera erişimi hatası: ${error.message}`, true);
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
        this.setStatus('', 'Durduruldu');
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
        this.setStatus('processing', 'Analiz ediliyor...');

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
            this.setStatus('active', 'Analiz aktif');

        } catch (error) {
            console.error('Analysis error:', error);

            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.showResponse('⚠️ API bağlantısı kurulamadı. llama-server çalıştığından emin olun.', true);
                this.setStatus('error', 'Bağlantı hatası');
            } else {
                this.showResponse(`Hata: ${error.message}`, true);
                this.setStatus('error', 'Analiz hatası');
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
