#!/bin/bash

# SmolVLM Server Start Script
# Uses llama.cpp server with Qwen2.5-VL model (better multilingual/Turkish support)

echo "🚀 Qwen2.5-VL Vision Server başlatılıyor..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if llama-server is installed
if ! command -v llama-server &> /dev/null; then
    echo "❌ llama-server bulunamadı!"
    echo ""
    echo "Kurulum için:"
    echo "  brew install llama.cpp"
    echo ""
    exit 1
fi

echo "✓ llama-server bulundu"
echo ""

# Model configuration - Qwen2.5-VL with better multilingual support
MODEL_REPO="ggml-org/Qwen2.5-VL-3B-Instruct-GGUF"
MODEL_FILE="Qwen2.5-VL-3B-Instruct-Q8_0.gguf"
MMPROJ_URL="https://huggingface.co/ggml-org/Qwen2.5-VL-3B-Instruct-GGUF/resolve/main/mmproj-Qwen2.5-VL-3B-Instruct-f16.gguf"
PORT=8080
HOST="127.0.0.1"

echo "📦 Model: Qwen2.5-VL-3B-Instruct (Çok dilli, Türkçe destekli)"
echo "🔌 Port: $PORT"
echo ""
echo "⏳ İlk çalıştırmada model indirilecek (~2GB), lütfen bekleyin..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start llama-server with Qwen2.5-VL model
llama-server \
    --hf-repo "$MODEL_REPO" \
    --hf-file "$MODEL_FILE" \
    --mmproj-url "$MMPROJ_URL" \
    --host "$HOST" \
    --port "$PORT" \
    -ngl 99 \
    --ctx-size 4096
