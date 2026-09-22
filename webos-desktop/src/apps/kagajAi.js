import "../styles/kagajAi.css";
import { BaseApp, os, StorageKeys, ServiceKeys, $, $$, bindEvent, toggleClass, setText, setHTML, createElement } from "../framework.js";
import { getLibraryUrl } from "../shared/cdnConfig.js";

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
    const winId = "kagaj-ai-" + Date.now();
    const winWidth = Math.min(1120, window.innerWidth - 30) + "px";
    const winHeight = Math.min(800, window.innerHeight - 40) + "px";
    const win = os.window.create(
      winId,
      "Kagaj-AI",
      winWidth,
      winHeight,
      {
        icon: "papirus:apps/brainstorm",
        appId: ServiceKeys.KAGAJ_AI || "kagajAiApp"
      }
    );

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
      <header class="header">
        <h1>📋 Kagaj-AI</h1>
        <p class="subtitle">Upload a PDF or Photo. AI will read everything for you.</p>
        <div class="model-badge" id="modelBadge" title="Click to configure Gemini model or API key">
          <span class="dot"></span>
          <span class="model-badge-text">Model: ${initialModel} ⚙️</span>
        </div>
      </header>

      <div class="main-container">
        <div class="left-column">
          <div class="card" id="uploadCard" style="margin-bottom: 1.5rem;">
            <div class="card-title"><span class="icon">📤</span> Upload Document</div>

            <div class="upload-zone" id="dropZone">
              <div class="upload-icon">📄</div>
              <div class="upload-text">Drag & Drop your file here</div>
              <div class="upload-hint">or click to browse. PDF, JPG, PNG supported</div>
              <input type="file" class="file-input" id="fileInput" accept=".pdf,.jpg,.jpeg,.png,.bmp,.tiff,.webp" />
            </div>

            <div class="file-info" id="fileInfo">
              <span class="file-icon">📎</span>
              <span class="file-name" id="fileName"></span>
              <span class="file-size" id="fileSize"></span>
              <button class="remove-btn" id="removeBtn" type="button" title="Remove file">✕</button>
            </div>

            <div class="prompt-section">
              <div class="prompt-label">✏️ Custom Prompt (optional)</div>
              <textarea class="prompt-textarea" id="promptInput" placeholder="Leave empty for auto-extract, or type a custom instruction like:&#10;&#10;• Extract the name and ward number&#10;• Read the handwritten text&#10;• Extract all tables exactly as they appear"></textarea>
            </div>

            <button class="extract-btn" id="extractBtn" type="button" disabled>
              <span class="spinner"></span>
              <span class="btn-text">🚀 Extract with AI</span>
            </button>

            <div class="error-box" id="errorBox"></div>
          </div>

          <div class="card">
            <div class="card-title"><span class="icon">🔍</span> Document Preview</div>
            <div id="previewPlaceholder" style="text-align:center; padding: 3rem 1rem; color: var(--kagaj-text-muted); font-size: 0.85rem;">
              <div style="font-size: 3rem; margin-bottom: 0.5rem; opacity: 0.3;">🖼️</div>
              Upload a file to see preview here
            </div>
            <div class="preview-section" id="previewSection">
              <img class="preview-img" id="previewImg" alt="Document Preview" />
            </div>
          </div>
        </div>

        <div class="right-column">
          <div class="card results-card" id="resultsCard" style="height: 100%;">
            <div class="card-title"><span class="icon">✅</span> Extracted Data. Click any value to copy</div>

            <div class="result-fields" id="resultFields"></div>

            <div class="raw-text-box" id="rawTextBox">
              <div class="raw-label">📝 Formatted Output (Word Copy Ready)</div>
              <div style="display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">
                <button class="copy-all-btn" id="downloadWordBtn" type="button" style="background-color: #007bff; color: white;">⬇️ Download as Word</button>
                <button class="copy-all-btn" id="copyAllBtn" type="button">Copy for Word</button>
              </div>
              <div id="formattedOutput" class="markdown-body" style="background: white; color: black; padding: 20px; border-radius: 8px; margin-top: 10px; max-height: 400px; overflow-y: auto;"></div>
              <pre id="rawText" style="display:none;"></pre>
            </div>
          </div>
        </div>
      </div>

      <div class="toast" id="toast">✓ Copied to clipboard!</div>

      <footer class="footer">
        Kagaj-AI • Powered by Google Gemini AI • Made with ❤️ in Nepal 🇳🇵
      </footer>

      <div class="kagaj-settings-modal" id="settingsModal" style="display: none;">
        <div class="kagaj-settings-backdrop" id="settingsBackdrop"></div>
        <div class="kagaj-settings-card">
          <div class="kagaj-settings-header">
            <span>⚙️ Kagaj-AI Configuration</span>
            <button class="kagaj-settings-close-btn" id="settingsCloseBtn" type="button">✕</button>
          </div>
          <div style="margin-top: 16px;">
            <label class="kagaj-config-label">🤖 Gemini Model</label>
            <input type="text" class="kagaj-config-input" id="modelInput" value="${initialModel}" list="kagaj-model-list" placeholder="e.g. gemini-2.0-flash" />
            <datalist id="kagaj-model-list">
              <option value="gemini-2.0-flash">
              <option value="gemini-1.5-flash">
              <option value="gemini-2.5-flash">
              <option value="gemini-1.5-pro">
            </datalist>
          </div>
          <div style="margin-top: 14px;">
            <label class="kagaj-config-label">🔑 Gemini API Key</label>
            <div style="display: flex; gap: 8px;">
              <input type="password" class="kagaj-config-input" id="apiKeyInput" value="${initialApiKey}" placeholder="Enter Gemini API key" />
              <button type="button" id="keyToggleBtn" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; padding: 0 12px; cursor: pointer;">👁️</button>
            </div>
          </div>
          <button type="button" id="saveSettingsBtn" style="margin-top: 20px; width: 100%; padding: 10px; background: #6366f1; border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer;">💾 Save Settings</button>
        </div>
      </div>
    `
    );
  }

  setupEvents(win) {
    const dropZone = $("#dropZone", win);
    const fileInput = $("#fileInput", win);
    const fileInfo = $("#fileInfo", win);
    const fileName = $("#fileName", win);
    const fileSize = $("#fileSize", win);
    const removeBtn = $("#removeBtn", win);
    const extractBtn = $("#extractBtn", win);
    const promptInput = $("#promptInput", win);
    const errorBox = $("#errorBox", win);
    const previewPlaceholder = $("#previewPlaceholder", win);
    const previewSection = $("#previewSection", win);
    const previewImg = $("#previewImg", win);
    const resultsCard = $("#resultsCard", win);
    const resultFields = $("#resultFields", win);
    const rawText = $("#rawText", win);
    const formattedOutput = $("#formattedOutput", win);
    const downloadWordBtn = $("#downloadWordBtn", win);
    const copyAllBtn = $("#copyAllBtn", win);
    const modelBadge = $("#modelBadge", win);
    const modelBadgeText = $(".model-badge-text", win);
    const settingsModal = $("#settingsModal", win);
    const settingsBackdrop = $("#settingsBackdrop", win);
    const settingsCloseBtn = $("#settingsCloseBtn", win);
    const modelInput = $("#modelInput", win);
    const apiKeyInput = $("#apiKeyInput", win);
    const keyToggleBtn = $("#keyToggleBtn", win);
    const saveSettingsBtn = $("#saveSettingsBtn", win);

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

    bindEvent(downloadWordBtn, "click", () => {
      this.downloadWord(formattedOutput, state.lastFileName);
    });

    bindEvent(copyAllBtn, "click", () => {
      this.copyFormattedText(formattedOutput, copyAllBtn, win);
    });

    bindEvent(modelBadge, "click", () => {
      settingsModal.style.display = "flex";
    });

    bindEvent(settingsCloseBtn, "click", () => {
      settingsModal.style.display = "none";
    });

    bindEvent(settingsBackdrop, "click", () => {
      settingsModal.style.display = "none";
    });

    bindEvent(keyToggleBtn, "click", () => {
      const isPassword = apiKeyInput.getAttribute("type") === "password";
      apiKeyInput.setAttribute("type", isPassword ? "text" : "password");
    });

    bindEvent(saveSettingsBtn, "click", () => {
      const chosenModel = modelInput?.value?.trim() || DEFAULT_GEMINI_MODEL;
      const enteredKey = apiKeyInput?.value?.trim() || "";
      os.storage.set(StorageKeys.kagajModel, chosenModel);
      if (enteredKey) {
        os.storage.set(StorageKeys.kagajApiKey, enteredKey);
      }
      if (modelBadgeText) {
        setText(modelBadgeText, `Model: ${chosenModel} ⚙️`);
      }
      settingsModal.style.display = "none";
      this.showToast(win, "✓ Settings saved!");
    });
  }

  handleFile(win, file, state) {
    if (!file) return;
    state.selectedFile = file;

    const dropZone = $("#dropZone", win);
    const fileInfo = $("#fileInfo", win);
    const fileName = $("#fileName", win);
    const fileSize = $("#fileSize", win);
    const extractBtn = $("#extractBtn", win);
    const errorBox = $("#errorBox", win);
    const previewPlaceholder = $("#previewPlaceholder", win);
    const previewSection = $("#previewSection", win);
    const previewImg = $("#previewImg", win);

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
            '<div style="font-size: 3rem; margin-bottom: 0.5rem; opacity: 0.5;">📄</div><div>PDF preview will appear after extraction</div>'
          );
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      previewPlaceholder.style.display = "block";
      setHTML(
        previewPlaceholder,
        '<div style="font-size: 3rem; margin-bottom: 0.5rem; opacity: 0.5;">📄</div><div>Document ready to extract</div>'
      );
    }
  }

  async extractWithAi(win, state) {
    if (!state.selectedFile) return;

    const extractBtn = $("#extractBtn", win);
    const errorBox = $("#errorBox", win);
    const resultsCard = $("#resultsCard", win);
    const resultFields = $("#resultFields", win);
    const formattedOutput = $("#formattedOutput", win);
    const rawTextEl = $("#rawText", win);
    const promptInput = $("#promptInput", win);
    const btnText = $(".btn-text", extractBtn);
    const apiKeyInput = $("#apiKeyInput", win);
    const modelInput = $("#modelInput", win);
    const settingsModal = $("#settingsModal", win);

    let apiKey = apiKeyInput?.value?.trim() || os.storage.get(StorageKeys.kagajApiKey) || DEFAULT_GEMINI_API_KEY;
    if (!apiKey) {
      settingsModal.style.display = "flex";
      setText(errorBox, "Please provide your Google Gemini API Key to extract documents.");
      toggleClass(errorBox, "visible", true);
      return;
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
      const customPrompt = promptInput?.value?.trim();
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
          const fieldCard = createElement("div", { className: "result-field" });
          const labelEl = createElement("div", { className: "field-label", text: String(key) });
          const textVal = typeof value === "object" ? JSON.stringify(value) : String(value);
          const valEl = createElement("div", { className: "field-value", text: textVal });
          const copyBtn = createElement("button", {
            className: "copy-btn",
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
      if (rawTextEl) {
        setText(rawTextEl, rawText);
      }
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

  showToast(win, message = "✓ Copied to clipboard!") {
    const toastEl = $("#toast", win);
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
