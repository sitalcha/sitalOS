import "../styles/kagajAi.css";
import { BaseApp, os, StorageKeys, ServiceKeys, APP_MANIFESTS, $, $$, bindEvent, toggleClass, setText, setHTML, createElement } from "../framework.js";
import { getLibraryUrl } from "../shared/cdnConfig.js";

if (typeof os?.window?.create === "function") {
  const originalCreateWindow = os.window.create.bind(os.window);
  os.window.create = function(targetIdOrOptions, ...remainingArgs) {
    if (typeof targetIdOrOptions === "object" && targetIdOrOptions !== null && !(targetIdOrOptions instanceof HTMLElement)) {
      const targetId = targetIdOrOptions.id;
      const targetTitle = targetIdOrOptions.title;
      const targetWidth = typeof targetIdOrOptions.width === "number" ? `${targetIdOrOptions.width}px` : (targetIdOrOptions.width || "80vw");
      const targetHeight = typeof targetIdOrOptions.height === "number" ? `${targetIdOrOptions.height}px` : (targetIdOrOptions.height || "80vh");
      return originalCreateWindow(targetId, targetTitle, targetWidth, targetHeight, {
        ...targetIdOrOptions,
        id: targetId,
        title: targetTitle,
        width: targetWidth,
        height: targetHeight
      });
    }
    return originalCreateWindow(targetIdOrOptions, ...remainingArgs);
  };
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function loadPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  const scriptUrl = getLibraryUrl("pdfjs", "js");
  if (!scriptUrl) return null;
  await new Promise((resolve, reject) => {
    const existing = $(`script[src="${scriptUrl}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = createElement("script", {
      attributes: { src: scriptUrl }
    });
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load PDF library"));
    document.head.appendChild(script);
  });
  if (window.pdfjsLib) {
    const workerUrl = getLibraryUrl("pdfjs", "worker");
    if (workerUrl && window.pdfjsLib.GlobalWorkerOptions) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    }
  }
  return window.pdfjsLib;
}

const DEFAULT_GEMINI_API_KEY = import.meta.env?.VITE_GEMINI_API_KEY || (typeof atob === "function" ? atob("QVEuQWI4Uk42S2t6aWQ3blVxb3RZV2VYM0Y0X2dCM2ZHRXA1ZUVzZ3B0Y3VPbEVCakY3NGc=") : "");
const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

export class KagajAiApp extends BaseApp {
  constructor(services) {
    super(services);
    this.openWindows = new Set();
  }

  open() {
    const win = os.window.create({
      id: "kagaj-ai-" + Date.now(),
      title: "Kagaj-AI",
      icon: "papirus:apps/brainstorm",
      width: Math.min(1080, window.innerWidth - 40),
      height: Math.min(760, window.innerHeight - 50),
      appId: ServiceKeys.KAGAJ_AI || "kagajAiApp"
    });

    this.openWindows.add(win);
    bindEvent(win, "remove", () => {
      this.openWindows.delete(win);
    });

    this.renderUI(win);
    this.setupEvents(win);
    return win;
  }

  renderUI(win) {
    let contentRoot = win.content || $(".window-content", win);
    if (!contentRoot) {
      contentRoot = createElement("div", { className: "window-content kagaj-ai-container" });
      win.appendChild(contentRoot);
    } else {
      contentRoot.classList.add("kagaj-ai-container");
    }
    win.content = contentRoot;

    const initialModel = os.storage.get(StorageKeys.kagajModel) || DEFAULT_GEMINI_MODEL;
    const initialApiKey = os.storage.get(StorageKeys.kagajApiKey) || DEFAULT_GEMINI_API_KEY;

    setHTML(
      contentRoot,
      `
      <header class="kagaj-header">
        <h1 class="kagaj-title">📋 Kagaj-AI</h1>
        <p class="kagaj-subtitle">Upload a PDF or Photo. AI will read everything for you.</p>
        <div class="kagaj-model-badge" title="Click to change Gemini model">
          <span class="dot"></span>
          <span class="kagaj-model-label">● Model: ${initialModel} ▾</span>
        </div>
        <button class="kagaj-key-btn" type="button" title="View or change Gemini API Key">🔑 API Key</button>
      </header>

      <div class="kagaj-main-container">
        <div class="left-column">
          <div class="kagaj-card kagaj-config-card">
            <div class="kagaj-card-title"><span class="icon">⚙️</span> AI Configuration</div>
            <div class="kagaj-config-grid">
              <div class="kagaj-config-group">
                <label class="kagaj-config-label">🤖 Model Name</label>
                <div class="kagaj-input-wrap">
                  <input type="text" class="kagaj-config-input kagaj-model-input" value="${initialModel}" placeholder="e.g. gemini-2.0-flash" list="kagaj-model-options" />
                  <datalist id="kagaj-model-options">
                    <option value="gemini-2.0-flash">
                    <option value="gemini-1.5-flash">
                    <option value="gemini-2.5-flash">
                    <option value="gemini-1.5-pro">
                  </datalist>
                </div>
              </div>
              <div class="kagaj-config-group">
                <label class="kagaj-config-label">🔑 Gemini API Key</label>
                <div class="kagaj-input-wrap">
                  <input type="password" class="kagaj-config-input kagaj-api-key-input" value="${initialApiKey}" placeholder="Enter Gemini API key" />
                  <button class="kagaj-key-toggle-btn" type="button" title="Toggle visibility">👁️</button>
                </div>
              </div>
            </div>
            <button class="kagaj-save-config-btn" type="button">💾 Save Settings</button>
          </div>

          <div class="kagaj-card upload-card">
            <div class="kagaj-card-title"><span class="icon">📤</span> Upload Document</div>
            <div class="kagaj-upload-zone">
              <div class="kagaj-upload-icon">📄</div>
              <div class="kagaj-upload-text">Drag and Drop your file here</div>
              <div class="kagaj-upload-hint">or click to browse. PDF, JPG, PNG supported</div>
              <input type="file" class="kagaj-file-input" accept=".pdf,.jpg,.jpeg,.png,.bmp,.tiff,.webp" />
            </div>
            <div class="kagaj-file-info">
              <span class="file-icon">📎</span>
              <span class="file-name"></span>
              <span class="file-size"></span>
              <button class="remove-btn" type="button" title="Remove file">✕</button>
            </div>
            <div class="kagaj-prompt-section">
              <label class="kagaj-prompt-label">✏️ Custom Prompt (optional)</label>
              <textarea class="kagaj-prompt-textarea" placeholder="Leave empty for auto-extract, or type a custom instruction like:&#10;&#10;• Extract the name and ward number&#10;• Read the handwritten text&#10;• Extract all tables exactly as they appear"></textarea>
            </div>
            <button class="kagaj-extract-btn" type="button" disabled>
              <span class="kagaj-spinner"></span>
              <span class="btn-text">🚀 Extract with AI</span>
            </button>
            <div class="kagaj-error-box"></div>
          </div>

          <div class="kagaj-card preview-card">
            <div class="kagaj-card-title"><span class="icon">🔍</span> Document Preview</div>
            <div class="kagaj-preview-placeholder">
              <div style="font-size: 3rem; margin-bottom: 0.5rem; opacity: 0.3;">🖼️</div>
              Upload a file to see preview here
            </div>
            <div class="kagaj-preview-section">
              <img class="kagaj-preview-img" alt="Document Preview" />
            </div>
          </div>
        </div>

        <div class="right-column">
          <div class="kagaj-card kagaj-results-card">
            <div class="kagaj-card-title"><span class="icon">✅</span> Extracted Data. Click any value to copy</div>
            <div class="kagaj-result-fields"></div>
            <div class="kagaj-raw-text-box">
              <div class="kagaj-raw-label">📝 Formatted Output (Word Copy Ready)</div>
              <div class="kagaj-btn-bar">
                <button class="kagaj-download-btn" type="button">⬇️ Download as Word</button>
                <button class="kagaj-save-txt-btn" type="button">💾 Save Text (.txt)</button>
                <button class="kagaj-save-os-btn" type="button">📁 Save to sitalOS</button>
                <button class="kagaj-copy-all-btn" type="button">Copy for Word</button>
              </div>
              <div class="kagaj-formatted-output markdown-body"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="kagaj-toast">✓ Copied to clipboard!</div>
      <footer class="kagaj-footer">
        Kagaj-AI • Powered by Google Gemini AI • Made with love in Nepal
      </footer>
    `
    );
  }

  setupEvents(win) {
    const dropZone = $(".kagaj-upload-zone", win);
    const fileInput = $(".kagaj-file-input", win);
    const fileInfo = $(".kagaj-file-info", win);
    const removeBtn = $(".remove-btn", win);
    const extractBtn = $(".kagaj-extract-btn", win);
    const previewPlaceholder = $(".kagaj-preview-placeholder", win);
    const previewSection = $(".kagaj-preview-section", win);
    const resultsCard = $(".kagaj-results-card", win);
    const formattedOutput = $(".kagaj-formatted-output", win);
    const downloadBtn = $(".kagaj-download-btn", win);
    const saveTxtBtn = $(".kagaj-save-txt-btn", win);
    const saveOsBtn = $(".kagaj-save-os-btn", win);
    const copyAllBtn = $(".kagaj-copy-all-btn", win);
    const apiKeyBtn = $(".kagaj-key-btn", win);
    const errorBox = $(".kagaj-error-box", win);

    const state = {
      selectedFile: null,
      lastExtractedText: "",
      lastFileName: ""
    };

    bindEvent(dropZone, "click", () => fileInput.click());

    bindEvent(dropZone, "dragover", (event) => {
      event.preventDefault();
      toggleClass(dropZone, "dragover", true);
    });

    bindEvent(dropZone, "dragleave", () => {
      toggleClass(dropZone, "dragover", false);
    });

    bindEvent(dropZone, "drop", (event) => {
      event.preventDefault();
      toggleClass(dropZone, "dragover", false);
      if (event.dataTransfer?.files?.length > 0) {
        this.handleFile(win, event.dataTransfer.files[0], state);
      }
    });

    bindEvent(fileInput, "change", () => {
      if (fileInput.files?.length > 0) {
        this.handleFile(win, fileInput.files[0], state);
      }
    });

    bindEvent(removeBtn, "click", () => {
      state.selectedFile = null;
      state.lastExtractedText = "";
      state.lastFileName = "";
      fileInput.value = "";
      toggleClass(fileInfo, "visible", false);
      dropZone.style.display = "";
      extractBtn.disabled = true;
      toggleClass(previewSection, "visible", false);
      previewPlaceholder.style.display = "";
      setHTML(
        previewPlaceholder,
        '<div style="font-size: 3rem; margin-bottom: 0.5rem; opacity: 0.3;">🖼️</div>Upload a file to see preview here'
      );
      toggleClass(resultsCard, "visible", false);
      toggleClass(errorBox, "visible", false);
    });

    bindEvent(extractBtn, "click", () => {
      this.extractWithAi(win, state);
    });

    bindEvent(downloadBtn, "click", () => {
      this.downloadWord(formattedOutput, state.lastFileName);
    });

    bindEvent(saveTxtBtn, "click", () => {
      this.downloadText(state.lastExtractedText, state.lastFileName, win);
    });

    bindEvent(saveOsBtn, "click", async () => {
      await this.saveToSitalOs(state.lastFileName, state.lastExtractedText, win);
    });

    bindEvent(copyAllBtn, "click", () => {
      this.copyFormattedText(formattedOutput, copyAllBtn, win);
    });

    const modelInput = $(".kagaj-model-input", win);
    const apiKeyInput = $(".kagaj-api-key-input", win);
    const keyToggleBtn = $(".kagaj-key-toggle-btn", win);
    const saveConfigBtn = $(".kagaj-save-config-btn", win);
    const modelBadge = $(".kagaj-model-badge", win);
    const modelLabel = $(".kagaj-model-label", win);

    if (keyToggleBtn && apiKeyInput) {
      bindEvent(keyToggleBtn, "click", () => {
        const isPassword = apiKeyInput.getAttribute("type") === "password";
        apiKeyInput.setAttribute("type", isPassword ? "text" : "password");
      });
    }

    if (saveConfigBtn) {
      bindEvent(saveConfigBtn, "click", () => {
        const chosenModel = modelInput?.value?.trim() || "gemini-2.0-flash";
        const enteredKey = apiKeyInput?.value?.trim() || "";
        os.storage.set(StorageKeys.kagajModel, chosenModel);
        if (enteredKey) {
          os.storage.set(StorageKeys.kagajApiKey, enteredKey);
        }
        if (modelLabel) {
          setText(modelLabel, `● Model: ${chosenModel} ▾`);
        }
        setText(saveConfigBtn, "✓ Settings Saved!");
        toggleClass(saveConfigBtn, "saved", true);
        this.showToast(win, "✓ Settings saved!");
        setTimeout(() => {
          setText(saveConfigBtn, "💾 Save Settings");
          toggleClass(saveConfigBtn, "saved", false);
        }, 2000);
      });
    }

    bindEvent(apiKeyBtn, "click", async () => {
      const currentKey = apiKeyInput?.value?.trim() || os.storage.get(StorageKeys.kagajApiKey) || "";
      const newKey = await os.dialog.prompt(
        "Gemini API Key",
        "Please enter your Google Gemini API Key:",
        currentKey
      );
      if (newKey !== null && newKey !== undefined) {
        const trimmed = newKey.trim();
        if (trimmed) {
          os.storage.set(StorageKeys.kagajApiKey, trimmed);
          if (apiKeyInput) {
            apiKeyInput.value = trimmed;
          }
          this.showToast(win, "API Key saved!");
        }
      }
    });

    if (modelBadge) {
      bindEvent(modelBadge, "click", async () => {
        const activeModel = modelInput?.value?.trim() || os.storage.get(StorageKeys.kagajModel) || "gemini-2.0-flash";
        const chosen = await os.dialog.prompt(
          "Select Gemini Model",
          "Enter Gemini model name (e.g. gemini-2.0-flash, gemini-1.5-flash, gemini-2.5-flash, gemini-1.5-pro):",
          activeModel
        );
        if (chosen !== null && chosen !== undefined) {
          const clean = chosen.trim();
          if (clean) {
            os.storage.set(StorageKeys.kagajModel, clean);
            if (modelInput) {
              modelInput.value = clean;
            }
            if (modelLabel) {
              setText(modelLabel, `● Model: ${clean} ▾`);
            }
            this.showToast(win, `Model switched to ${clean}`);
          }
        }
      });
    }
  }

  handleFile(win, file, state) {
    if (!file) return;
    state.selectedFile = file;

    const dropZone = $(".kagaj-upload-zone", win);
    const fileInfo = $(".kagaj-file-info", win);
    const fileName = $(".file-name", win);
    const fileSize = $(".file-size", win);
    const extractBtn = $(".kagaj-extract-btn", win);
    const errorBox = $(".kagaj-error-box", win);
    const previewPlaceholder = $(".kagaj-preview-placeholder", win);
    const previewSection = $(".kagaj-preview-section", win);
    const previewImg = $(".kagaj-preview-img", win);

    setText(fileName, file.name);
    setText(fileSize, formatFileSize(file.size));
    toggleClass(fileInfo, "visible", true);
    dropZone.style.display = "none";
    extractBtn.disabled = false;
    toggleClass(errorBox, "visible", false);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        previewImg.src = event.target.result;
        toggleClass(previewSection, "visible", true);
        previewPlaceholder.style.display = "none";
      };
      reader.readAsDataURL(file);
    } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      previewPlaceholder.style.display = "block";
      setHTML(
        previewPlaceholder,
        '<div style="font-size: 3rem; margin-bottom: 0.5rem; opacity: 0.5;">📄</div><div>Rendering PDF preview...</div>'
      );
      toggleClass(previewSection, "visible", false);

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const pdfjs = await loadPdfJs();
          if (pdfjs) {
            const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
            const pdfDoc = await loadingTask.promise;
            const page = await pdfDoc.getPage(1);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const renderContext = {
              canvasContext: canvas.getContext("2d"),
              viewport: viewport
            };
            await page.render(renderContext).promise;
            previewImg.src = canvas.toDataURL("image/png");
            toggleClass(previewSection, "visible", true);
            previewPlaceholder.style.display = "none";
          }
        } catch {
          previewPlaceholder.style.display = "block";
          setHTML(
            previewPlaceholder,
            '<div style="font-size: 3rem; margin-bottom: 0.5rem; opacity: 0.5;">📄</div><div>PDF preview unavailable. Ready to extract.</div>'
          );
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }

  async extractWithAi(win, state) {
    if (!state.selectedFile) return;

    const extractBtn = $(".kagaj-extract-btn", win);
    const errorBox = $(".kagaj-error-box", win);
    const resultsCard = $(".kagaj-results-card", win);
    const resultFields = $(".kagaj-result-fields", win);
    const formattedOutput = $(".kagaj-formatted-output", win);
    const promptInput = $(".kagaj-prompt-textarea", win);
    const btnText = $(".btn-text", extractBtn);
    const apiKeyInput = $(".kagaj-api-key-input", win);
    const modelInput = $(".kagaj-model-input", win);

    let apiKey = apiKeyInput?.value?.trim() || os.storage.get(StorageKeys.kagajApiKey) || DEFAULT_GEMINI_API_KEY;
    if (!apiKey) {
      apiKey = await os.dialog.prompt("Gemini API Key", "Please enter your Google Gemini API Key:");
      if (!apiKey || !apiKey.trim()) {
        setText(errorBox, "Google Gemini API Key is required to extract text.");
        toggleClass(errorBox, "visible", true);
        return;
      }
      apiKey = apiKey.trim();
      os.storage.set(StorageKeys.kagajApiKey, apiKey);
      if (apiKeyInput) {
        apiKeyInput.value = apiKey;
      }
    }

    extractBtn.disabled = true;
    toggleClass(extractBtn, "loading", true);
    setText(btnText, "AI is reading...");
    toggleClass(errorBox, "visible", false);
    toggleClass(resultsCard, "visible", false);

    try {
      const base64String = await this.readFileAsBase64(state.selectedFile);
      let mimeType = state.selectedFile.type;
      const lowerName = state.selectedFile.name.toLowerCase();
      if (!mimeType || lowerName.endsWith(".pdf")) {
        mimeType = "application/pdf";
      } else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
        mimeType = "image/jpeg";
      } else if (lowerName.endsWith(".png")) {
        mimeType = "image/png";
      } else if (lowerName.endsWith(".webp")) {
        mimeType = "image/webp";
      } else if (lowerName.endsWith(".bmp")) {
        mimeType = "image/bmp";
      } else if (lowerName.endsWith(".tiff")) {
        mimeType = "image/tiff";
      }

      const defaultPrompt = "Extract ALL text visible in this document exactly as it is formatted.\nIf the document contains any tables, extract them using Markdown table format.\nPreserve paragraphs, headers, and list formatting using Markdown.\nReturn the extracted content in the original language (Nepali/English).";
      const customPrompt = promptInput.value.trim();
      const promptText = customPrompt ? customPrompt : defaultPrompt;

      const chosenModel = modelInput?.value?.trim() || os.storage.get(StorageKeys.kagajModel) || DEFAULT_GEMINI_MODEL;
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(chosenModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const payload = {
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64String
                }
              }
            ]
          }
        ]
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || `Request failed with status ${response.status}`);
      }

      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!rawText) {
        throw new Error("No text was returned by the AI model.");
      }

      let parsedJson = null;
      try {
        let cleanJson = rawText.trim();
        if (cleanJson.startsWith("```json")) {
          cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
        } else if (cleanJson.startsWith("```")) {
          cleanJson = cleanJson.replace(/^```\s*/, "").replace(/```\s*$/, "");
        }
        parsedJson = JSON.parse(cleanJson.trim());
      } catch {
        parsedJson = null;
      }

      setHTML(resultFields, "");
      if (parsedJson && typeof parsedJson === "object" && !Array.isArray(parsedJson)) {
        Object.entries(parsedJson).forEach(([key, value]) => {
          const fieldCard = createElement("div", { className: "kagaj-result-field" });
          const labelEl = createElement("div", { className: "kagaj-field-label", text: String(key) });
          const textVal = typeof value === "object" ? JSON.stringify(value) : String(value);
          const valEl = createElement("div", { className: "kagaj-field-value", text: textVal });
          const copyBtn = createElement("button", {
            className: "kagaj-copy-btn",
            attributes: { type: "button" },
            text: "Copy"
          });
          bindEvent(copyBtn, "click", () => {
            this.copyFieldText(textVal, copyBtn, win);
          });
          fieldCard.appendChild(labelEl);
          fieldCard.appendChild(valEl);
          fieldCard.appendChild(copyBtn);
          resultFields.appendChild(fieldCard);
        });
      }

      const { marked } = await import("marked");
      const parsedMarkdown = marked.parse(rawText);
      setHTML(formattedOutput, parsedMarkdown);
      state.lastExtractedText = rawText;
      state.lastFileName = state.selectedFile?.name || "Kagaj_AI_Extracted";
      toggleClass(resultsCard, "visible", true);
    } catch (err) {
      setText(errorBox, `❌ ${err.message}`);
      toggleClass(errorBox, "visible", true);
    } finally {
      extractBtn.disabled = false;
      toggleClass(extractBtn, "loading", false);
      setText(btnText, "🚀 Extract with AI");
    }
  }

  copyFieldText(text, btn, win) {
    navigator.clipboard.writeText(text).then(() => {
      setText(btn, "✓ Copied");
      toggleClass(btn, "copied", true);
      this.showToast(win, "✓ Copied to clipboard!");
      setTimeout(() => {
        setText(btn, "Copy");
        toggleClass(btn, "copied", false);
      }, 2000);
    }).catch(() => {});
  }

  copyFormattedText(formattedOutputEl, copyBtn, win) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(formattedOutputEl);
    selection.removeAllRanges();
    selection.addRange(range);
    try {
      document.execCommand("copy");
      setText(copyBtn, "✓ Copied!");
      toggleClass(copyBtn, "copied", true);
      this.showToast(win, "✓ Copied to clipboard!");
      setTimeout(() => {
        setText(copyBtn, "Copy for Word");
        toggleClass(copyBtn, "copied", false);
      }, 2000);
    } catch {
      navigator.clipboard.writeText(formattedOutputEl.innerText || "").then(() => {
        this.showToast(win, "✓ Copied to clipboard!");
      }).catch(() => {});
    }
    selection.removeAllRanges();
  }

  downloadWord(formattedOutputEl, baseFileName) {
    const content = formattedOutputEl.innerHTML;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
    const footer = "</body></html>";
    const sourceHtml = header + content + footer;
    const blob = new Blob([sourceHtml], { type: "application/msword;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const cleanBaseName = (baseFileName || "Kagaj_AI_Extracted").replace(/\.[^/.]+$/, "");
    const downloadAnchor = createElement("a", {
      attributes: {
        href: downloadUrl,
        download: `${cleanBaseName}.doc`
      }
    });
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(downloadUrl);
  }

  downloadText(rawText, baseFileName, win) {
    if (!rawText) {
      this.showToast(win, "No extracted text to save!");
      return;
    }
    const cleanBaseName = (baseFileName || "Kagaj_AI_Extracted").replace(/\.[^/.]+$/, "");
    const blob = new Blob([rawText], { type: "text/plain;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadAnchor = createElement("a", {
      attributes: {
        href: downloadUrl,
        download: `${cleanBaseName}.txt`
      }
    });
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(downloadUrl);
    this.showToast(win, "✓ Text file downloaded!");
  }

  async saveToSitalOs(baseFileName, content, win) {
    if (!content) {
      this.showToast(win, "No extracted text to save!");
      return;
    }
    try {
      const cleanBaseName = (baseFileName || "Kagaj_AI_Extracted").replace(/\.[^/.]+$/, "");
      const fileName = `${cleanBaseName}.txt`;
      const dirPath = ["home", "Documents"];
      const dirExists = await os.fs.exists(dirPath);
      if (!dirExists) {
        await os.fs.mkdir(dirPath).catch(() => {});
      }
      const fullPath = [...dirPath, fileName];
      await os.fs.write(fullPath, content, { kind: "text", icon: "static/icons/notepad.webp" });
      this.showToast(win, `✓ Saved to Documents/${fileName}`);
    } catch (err) {
      this.showToast(win, `Save failed: ${err.message}`);
    }
  }

  showToast(win, message = "✓ Copied to clipboard!") {
    const toastEl = $(".kagaj-toast", win);
    if (!toastEl) return;
    setText(toastEl, message);
    toggleClass(toastEl, "show", true);
    setTimeout(() => {
      toggleClass(toastEl, "show", false);
    }, 2000);
  }

  readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          const parts = result.split(",");
          resolve(parts[1] || "");
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(new Error("File reading error"));
      reader.readAsDataURL(file);
    });
  }

  onClose(winId) {
    for (const win of this.openWindows) {
      if (win.id === winId) {
        this.openWindows.delete(win);
        break;
      }
    }
  }
}
