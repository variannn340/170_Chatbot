const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const sendBtn = document.getElementById("send-btn");

// Menyimpan riwayat obrolan agar sesuai format array yang diminta backend
let conversationHistory = [];

function appendMessage(text, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender === "user" ? "user-message" : "bot-message");
  msgDiv.textContent = text;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msgDiv;
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  // Tampilkan pesan pengguna & simpan ke riwayat
  appendMessage(message, "user");
  conversationHistory.push({ role: "user", content: message });

  userInput.value = "";
  userInput.disabled = true;
  sendBtn.disabled = true;

  // Siapkan gelembung balasan bot
  const botMsgDiv = appendMessage("Sedang mengetik...", "bot");
  let fullReply = "";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationHistory }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Membaca aliran data (streaming) dari backend
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    botMsgDiv.textContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const dataStr = trimmed.slice(5).trim();
        if (dataStr === "[DONE]") break;

        try {
          const chunk = JSON.parse(dataStr);
          fullReply += chunk;
          botMsgDiv.textContent = fullReply;
          chatBox.scrollTop = chatBox.scrollHeight;
        } catch (err) {
          console.error("Gagal parsing chunk:", err);
        }
      }
    }

    // Simpan balasan lengkap AI ke riwayat percakapan
    if (fullReply) {
      conversationHistory.push({ role: "assistant", content: fullReply });
    } else {
      botMsgDiv.textContent = "Tidak ada balasan dari AI.";
    }
  } catch (error) {
    console.error("Error:", error);
    botMsgDiv.textContent = "Maaf, gagal terhubung ke server chatbot.";
  } finally {
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
});