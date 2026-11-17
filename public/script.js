const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const sendBtn = document.getElementById("send-btn");

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

  // Tampilkan pesan pengguna
  appendMessage(message, "user");
  userInput.value = "";
  userInput.disabled = true;
  sendBtn.disabled = true;

  // Indikator mengetik
  const loadingMsg = appendMessage("Sedang mengetik...", "bot");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    loadingMsg.textContent = data.reply || "Tidak ada balasan dari server.";
  } catch (error) {
    console.error("Error:", error);
    loadingMsg.textContent = "Maaf, gagal terhubung ke server chatbot.";
  } finally {
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
});