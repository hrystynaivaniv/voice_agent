// Заповнити після деплою воркера (`npx wrangler deploy`) та встановлення секрету ACCESS_CODE.
const WORKER_URL = "https://voice-agent.your-subdomain.workers.dev";
const ACCESS_CODE = "PUT_YOUR_ACCESS_CODE_HERE";

const modelSelect = document.getElementById("model");
const voiceSelect = document.getElementById("voice");
const textArea = document.getElementById("text");
const promptArea = document.getElementById("prompt");
const playBtn = document.getElementById("playBtn");
const saveBtn = document.getElementById("saveBtn");
const statusEl = document.getElementById("status");
const player = document.getElementById("player");

let lastBlobUrl = null;

function setStatus(msg) {
  statusEl.textContent = msg;
}

async function requestSpeech() {
  const input = textArea.value.trim();

  if (!input) {
    setStatus("Введіть текст для озвучки.");
    return null;
  }

  setStatus("Генерую аудіо...");
  playBtn.disabled = true;
  saveBtn.disabled = true;

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessCode: ACCESS_CODE,
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
