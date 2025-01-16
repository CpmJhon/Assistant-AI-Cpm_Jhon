import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import MarkdownIt from 'markdown-it';
import { maybeShowApiKeyBanner } from './gemini-api-banner';
import './assets/style.css';

// 🔥🔥 FILL THIS OUT FIRST! 🔥🔥
// Get your Gemini API key by:
// - Selecting "Add Gemini API" in the "Project IDX" panel in the sidebar
// - Or by visiting https://g.co/ai/idxGetGeminiKey
let API_KEY = 'AIzaSyCYXZfOrbNETR5NAGRff06RNueZXp-1LtQ';

// Array untuk menyimpan riwayat percakapan
let conversationHistory = [];

let form = document.querySelector('form');
let promptInput = document.querySelector('input[name="prompt"]');
let output = document.querySelector('.output');

// Fungsi untuk menampilkan notifikasi sementara
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show'); // Tambahkan animasi
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3000); // Hilang setelah 3 detik
}

form.onsubmit = async (ev) => {
  ev.preventDefault();
  let userMessage = promptInput.value.trim();
  if (!userMessage) return;

  // Tambahkan pesan pengguna ke riwayat percakapan
  conversationHistory.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  // Tampilkan pesan pengguna di antarmuka
  output.innerHTML += `<div class="user-message"><strong>You:</strong> ${userMessage}</div>`;
  promptInput.value = '';
  output.scrollTop = output.scrollHeight; // Gulir ke bawah

  try {
    // Tampilkan notifikasi "Generating..."
    showToast("Generating AI response...");

    output.innerHTML += `<div class="assistant-message">Generating...</div>`;
    let lastOutputIndex = output.children.length - 1;

    // Call Gemini AI
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // or gemini-1.5-pro
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    const result = await model.generateContentStream({ contents: conversationHistory });

    // Proses respons dari Gemini AI
    let buffer = [];
    let md = new MarkdownIt();
    for await (let response of result.stream) {
      buffer.push(response.text());
      output.children[lastOutputIndex].innerHTML = `<strong>AI:</strong> ${md.render(buffer.join(''))}`;
    }

    // Tambahkan respons AI ke riwayat percakapan
    conversationHistory.push({
      role: 'assistant',
      parts: [{ text: buffer.join('') }]
    });

    // Tampilkan notifikasi selesai
    showToast("AI response generated successfully!");
  } catch (e) {
    output.innerHTML += `<div class="error-message">Error: ${e}</div>`;
    showToast("Error generating response.");
  }
};
