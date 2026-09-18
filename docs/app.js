const workerUrlInput = document.getElementById("workerUrl");
const accessCodeInput = document.getElementById("accessCode");
const modelSelect = document.getElementById("model");
const voiceSelect = document.getElementById("voice");
const textArea = document.getElementById("text");
const promptArea = document.getElementById("prompt");
const playBtn = document.getElementById("playBtn");
const saveBtn = document.getElementById("saveBtn");
const statusEl = document.getElementById("status");
const player = document.getElementById("player");

workerUrlInput.value = localStorage.getItem("va_worker_url") || "";
accessCodeInput.value = localStorage.getItem("va_access_code") || "";

let lastBlobUrl = null;

function setStatus(msg) {
  statusEl.textContent = msg;
}

async function requestSpeech() {
  const workerUrl = workerUrlInput.value.trim();
  const accessCode = accessCodeInput.value;
  const input = textArea.value.trim();

  if (!workerUrl) {
    setStatus("Вкажіть адресу бекенду (Worker URL).");
    return null;
  }
  if (!input) {
    setStatus("Введіть текст для озвучки.");
    return null;
  }

  localStorage.setItem("va_worker_url", workerUrl);
  localStorage.setItem("va_access_code", accessCode);

  setStatus("Генерую аудіо...");
  playBtn.disabled = true;
  saveBtn.disabled = true;

  try {
    const res = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessCode,
        model: modelSelect.value,
        voice: voiceSelect.value,
        input,
        instructions: promptArea.value.trim(),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      setStatus(`Помилка (${res.status}): ${text}`);
      return null;
    }

    const blob = await res.blob();
    setStatus("Готово.");
    return blob;
  } catch (err) {
    setStatus(`Помилка запиту: ${err.message}`);
    return null;
  } finally {
    playBtn.disabled = false;
  }
}

playBtn.addEventListener("click", async () => {
  const blob = await requestSpeech();
  if (!blob) return;

  if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
  lastBlobUrl = URL.createObjectURL(blob);

  player.src = lastBlobUrl;
  player.play();
  saveBtn.disabled = false;
});

saveBtn.addEventListener("click", () => {
  if (!lastBlobUrl) return;
  const a = document.createElement("a");
  a.href = lastBlobUrl;
  a.download = `voice_${voiceSelect.value}_${Date.now()}.mp3`;
  document.body.appendChild(a);
  a.click();
  a.remove();
});
