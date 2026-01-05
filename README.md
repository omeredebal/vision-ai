# 🎥 VisionAI

Real-time webcam analysis with local AI vision models.

<div align="center">
  <img src="assets/screenshot_v2.png" alt="VisionAI Interface" width="800">
  <p><em>Modern dark-themed interface with real-time AI analysis</em></p>
</div>

## Quick Start

```bash
# 1. Install llama.cpp
brew install llama.cpp

# 2. Start the AI server
./scripts/start-server.sh

# 3. Open in browser
open src/index.html
```

## Features

- **Real-time Analysis** — Continuous webcam frame analysis
- **Local AI** — No cloud API, 100% privacy
- **Multilingual** — One-click TR/EN switching with auto-translated prompts
- **Zero Cost** — Free, unlimited usage

## Requirements

- macOS with Apple Silicon
- llama.cpp (`brew install llama.cpp`)
- Modern browser (Chrome, Safari, Firefox)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Model | Qwen2.5-VL-3B-Instruct |
| Backend | llama.cpp server |
| Frontend | Vanilla JS + CSS |

## How it Works

The application runs entirely on your local machine, ensuring privacy and speed.

```mermaid
graph TD
    A[Webcam] -->|Capture Frame| B(Frontend / app.js)
    B -->|Base64 Image + Prompt| C{Local AI Server}
    C -->|Vision Encoder| D[Qwen2.5-VL Model]
    D -->|Text Generation| C
    C -->|Response JSON| B
    B -->|Display| E[User Interface]
    
    style C fill:#f9f,stroke:#333,stroke-width:2px,color:#000
    style D fill:#bbf,stroke:#333,stroke-width:2px,color:#000
```

## Project Structure

```
vision-ai/
├── assets/
│   └── screenshot.png
├── src/
│   ├── index.html    # Main UI
│   ├── styles.css    # Dark theme
│   └── app.js        # Webcam & API logic
├── scripts/
│   └── start-server.sh
└── README.md
```

## License

MIT
