// DOM Elements
const send_icon = document.getElementsByClassName("send-icon")[0];
const input = document.getElementsByClassName("InputMSG")[0];
const ContentChat = document.getElementsByClassName("ContentChat")[0];
const send1 = document.getElementById("send1");
const send2 = document.getElementById("send2");


const moka = "aHR0cHM6Ly9vYm90LWJhY2tuZC52ZXJjZWwuYXBw";


// Event Listeners
send_icon.addEventListener("click", SendMsgUser);
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        SendMsgUser();
    }
});

// Bot Status (0 = ready, 1 = busy)
let status_func_SendMsgBot = 0;

// Send Initial Greeting
setTimeout(() => {
    const greetingElement = document.createElement("div");
    greetingElement.classList.add("massage");
    greetingElement.innerHTML = `
    <div class="bot-response text" text-first="true">Hi 👋 ! It's good to see you!</div>
    <div class="bot-response text" text-last="true">How can I help you?</div>`;
    ContentChat.appendChild(greetingElement);
    greetingElement.scrollIntoView();
}, 2000);


// Function to send user message
function SendMsgUser() {
    if (input.value.trim() !== "" && status_func_SendMsgBot === 0) {
        const userMessage = input.value.trim();
        const timeNow = new Date().toLocaleTimeString();

        const userMsgElement = document.createElement("div");
        userMsgElement.classList.add("massage", "msgCaption");
        userMsgElement.setAttribute("data-user", "true");

        const formattedUserText = `🧑 You\n\n${userMessage}\n\n${timeNow}`;
        userMsgElement.innerHTML = `<div class="user-response">${formattedUserText}</div>`;
        ContentChat.appendChild(userMsgElement);
        userMsgElement.scrollIntoView();

        input.value = "";
        SendMsgToServer(userMessage);
    }
}
const doba = "L2FwaS9jaGF0";
// Function to send message to server with streaming
function SendMsgToServer(message) {
    if (status_func_SendMsgBot === 1) return;
    status_func_SendMsgBot = 1;
    send1.classList.add("none");
    send2.classList.remove("none");

    // Add loader first
    const loadingElement = document.createElement("div");
    loadingElement.classList.add("massage");
    loadingElement.innerHTML = `
    <div class="bot-response text" text-first="true">
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000">
        <circle cx="20" cy="20" r="16" stroke-width="4" stroke-dasharray="30 50" stroke-linecap="round" style="animation: rot 1.5s linear infinite"></circle>
      </svg>
    </div>`;
    ContentChat.appendChild(loadingElement);
    loadingElement.scrollIntoView();

    const controller = new AbortController();

    fetch(SERVER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: [{ "role": "system", "content": "You are a helpful assistant " }, { role: "user", content: message }] }),
            signal: controller.signal,
        })
        .then(async (response) => {
            if (!response.ok) throw new Error("Server Error");

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            let fullText = "";
            const botElement = document.createElement("div");
            botElement.classList.add("bot-response", "text");
            botElement.setAttribute("text-first", "true");

            const caption = `
        <div class="captionBot">
          <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" alt="chatgpt" />
          <span>GPT-4O</span>
        </div>`;

            const contentWrapper = document.createElement("div");
            contentWrapper.className = "markdown-content";

            botElement.innerHTML = caption;
            botElement.appendChild(contentWrapper);
            loadingElement.innerHTML = ""; // Clear spinner
            loadingElement.appendChild(botElement);

            // Read and render streamed chunks
            // while (true) {
            //   const { done, value } = await reader.read();
            //   if (done) break;

            //   const chunk = decoder.decode(value);
            //   fullText += chunk;
            //   contentWrapper.innerHTML = marked.parse(fullText);
            //   loadingElement.scrollIntoView();
            // }
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;
                contentWrapper.innerHTML = marked.parse(fullText);

                // ✨ Autoscroll to bottom smoothly
                ContentChat.scrollTop = ContentChat.scrollHeight;
            }


            // Final timestamp
            const timeNow = new Date().toLocaleTimeString();
            const timeStamp = document.createElement("div");
            timeStamp.className = "time-stamp";
            timeStamp.textContent = timeNow;
            botElement.appendChild(timeStamp);
        })
        .catch((error) => {
            console.error("Streaming error:", error);
            let errorMessage = "😵‍💫 Oops! Something went wrong.";

            if (error.name === "AbortError") {
                errorMessage = "⏰ Request timed out.";
            } else if (error.message.includes("fetch")) {
                errorMessage = "🌐 Network error.";
            }

            loadingElement.innerHTML = `<div class="bot-response text" text-first="true">${errorMessage}</div>`;
        })
        .finally(() => {
            status_func_SendMsgBot = 0;
            send2.classList.add("none");
            send1.classList.remove("none");
        });
}

const SERVER_URL = atob(moka) + atob(doba);
// Update footer branding
const bySpan = document.querySelector(".by");
if (bySpan) {
    bySpan.innerHTML = `
    <span style="color: #cfcfcf;">Powered by</span>
    <a target="_blank" href="#" style="color: #10a37f; font-weight: bold; text-decoration: none; margin-left: 4px;">OpenAI - ChatGPT</a>
  `;
}