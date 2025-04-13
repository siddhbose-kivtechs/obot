// obot - script.js 
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
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault(); // Prevent default to avoid new line
        SendMsgUser();
    }
});

// Add copy functionality
document.addEventListener('click', function(e) {
    const copyBtn = e.target.closest('.copy-btn');
    if (copyBtn) {
        const messageDiv = copyBtn.closest('.bot-response, .user-response');
        let textToCopy = messageDiv.textContent;
        
        // Remove the "Copy" text from the copied content
        textToCopy = textToCopy.replace('Copy', '').trim();
        
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                // Show "Copied!" text briefly
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
                copyBtn.title = "Copied!";
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                    copyBtn.title = "Copy to clipboard";
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    }
});

// Function to add copy button to a message
function addCopyButton(element) {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.title = "Copy to clipboard";
    copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
    element.appendChild(copyBtn);
}

// Bot Status (0 = ready, 1 = busy)
let status_func_SendMsgBot = 0;

// Send Initial Greeting
setTimeout(() => {
    const greetingElement = document.createElement("div");
    greetingElement.classList.add("massage");
    greetingElement.innerHTML = `
    <div class="bot-response text" text-first="true">Hi 👋 ! It's good to see you!</div>
    <div class="bot-response text" text-last="true">How can I help you?</div>`;
    
    // Add copy buttons to greeting messages
    const responses = greetingElement.querySelectorAll('.bot-response');
    responses.forEach(response => addCopyButton(response));
    
    ContentChat.appendChild(greetingElement);
    ContentChat.scrollTop = ContentChat.scrollHeight;
}, 2000);

// Function to send user message
function SendMsgUser() {
    if (input.value.trim() !== "" && status_func_SendMsgBot === 0) {
        const userMessage = input.value.trim();
        const timeNow = new Date().toLocaleTimeString();

        const userMsgElement = document.createElement("div");
        userMsgElement.classList.add("massage", "msgCaption");
        userMsgElement.setAttribute("data-user", "true");

        const userResponseDiv = document.createElement("div");
        userResponseDiv.className = "user-response";
        userResponseDiv.textContent = `🧑 You\n\n${userMessage}\n\n${timeNow}`;
        
        userMsgElement.appendChild(userResponseDiv);
        
        // Add copy button to user message
        addCopyButton(userResponseDiv);
        
        ContentChat.appendChild(userMsgElement);
        ContentChat.scrollTop = ContentChat.scrollHeight;

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
      <div class="typing-indicator-container">
        <span class="typing-indicator"></span>
        <span class="typing-indicator"></span>
        <span class="typing-indicator"></span>
      </div>
    </div>`;
    ContentChat.appendChild(loadingElement);
    ContentChat.scrollTop = ContentChat.scrollHeight;

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
            
            // Add copy button to bot response
            addCopyButton(botElement);
            
            loadingElement.innerHTML = ""; // Clear spinner
            loadingElement.appendChild(botElement);

            // Read and render streamed chunks
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;
                
                // Parse markdown and set content
                contentWrapper.innerHTML = marked.parse(fullText);

                // Ensure code blocks are properly formatted
                const codeBlocks = contentWrapper.querySelectorAll('pre code');
                if (codeBlocks.length > 0) {
                    codeBlocks.forEach(codeBlock => {
                        // Ensure proper wrapping
                        codeBlock.parentElement.style.maxWidth = '100%';
                        codeBlock.parentElement.style.overflowX = 'auto';
                    });
                }

                // Autoscroll to bottom smoothly
                ContentChat.scrollTop = ContentChat.scrollHeight;
            }

            // Final timestamp
            const timeNow = new Date().toLocaleTimeString();
            const timeStamp = document.createElement("div");
            timeStamp.className = "time-stamp";
            timeStamp.textContent = timeNow;
            botElement.appendChild(timeStamp);
            
            // Final scroll to ensure all content is visible
            ContentChat.scrollTop = ContentChat.scrollHeight;
        })
        .catch((error) => {
            console.error("Streaming error:", error);
            let errorMessage = "😵‍💫 Oops! Something went wrong.";

            if (error.name === "AbortError") {
                errorMessage = "⏰ Request timed out.";
            } else if (error.message.includes("fetch")) {
                errorMessage = "🌐 Network error.";
            }

            const errorElement = document.createElement("div");
            errorElement.className = "bot-response text";
            errorElement.setAttribute("text-first", "true");
            errorElement.textContent = errorMessage;
            
            // Add copy button to error message
            addCopyButton(errorElement);
            
            loadingElement.innerHTML = "";
            loadingElement.appendChild(errorElement);
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

// Make input element auto-resize as user types
input.addEventListener('input', function() {
    // Reset height to auto to get the right scrollHeight
    this.style.height = 'auto';
    
    // Set new height based on scrollHeight (with a max height)
    const newHeight = Math.min(this.scrollHeight, 150);
    this.style.height = newHeight + 'px';
    
    // Update container layout if needed
    if (this.scrollHeight > 50) {
        document.querySelector('.BoxSentMSG').style.height = newHeight + 'px';
    } else {
        document.querySelector('.BoxSentMSG').style.height = '50px';
    }
});



// // Inside your streaming response handler:
// contentWrapper.innerHTML = marked.parse(fullText);

// // Add this code after setting the innerHTML:
// const orderedLists = contentWrapper.querySelectorAll('ol');
// if (orderedLists.length > 0) {
//     orderedLists.forEach(list => {
//         list.style.marginLeft = '24px';
//         list.style.paddingLeft = '16px';
        
//         const listItems = list.querySelectorAll('li');
//         listItems.forEach(item => {
//             item.style.marginBottom = '10px';
//             item.style.paddingLeft = '8px';
//         });
//     });
// }