let ws;
var exams = new Set()
async function fetchUserExams() {
    try {
        const response = await fetch('/api/user-exams');
        const data = await response.json();
        data.forEach(exam => {
            exams.add(exam.nome);
            updateExamButton(exam.nome, true);
        });
        updateAreaIscrizioni();
    } catch (err) {
        console.error('Errore nel recupero degli esami iscritti:', err);
    }
}

function updateExamButton(examName, isSubscribed) {
    const button = document.getElementById(`btn-${examName.replace(/ /g, '-')}`);
    if (button) {
        button.innerText = isSubscribed ? "Iscritto" : "Iscriviti";
        button.classList.toggle("iscritto", isSubscribed);
    }
}



async function toggleSubscription(examName) {
    const isSubscribed = exams.has(examName);
    const url = isSubscribed ? '/api/unsubscribe' : '/api/subscribe';
    const method = 'POST';
    const body = JSON.stringify({ exam_name: examName });

    try {
        const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body });
        const data = await response.json();
        if (data.success) {
            isSubscribed ? exams.delete(examName) : exams.add(examName);
            updateExamButton(examName, !isSubscribed);
            updateAreaIscrizioni();
        } else {
            alert(data.message || `Errore durante l'${isSubscribed ? 'disiscrizione' : 'iscrizione'}`);
        }
    } catch (err) {
        console.error(err);
    }
}

function updateAreaIscrizioni() {
    const area = document.getElementById("exam-list");
    if (!area) {
        console.error("Elemento .exam-list non trovato nel DOM.");
        return;
    }
    area.innerHTML = [...exams].map(exam => `
        <div class="exam-item">
            <h4>${exam}</h4>
            <button onclick="viewStudents('${exam}')" class="btn btn-primary">Visualizza Iscritti</button>
        </div>
    `).join('');
}

async function viewStudents(examName) {
    let container = document.getElementById('students-container');
    if (container) return container.remove();

    container = document.createElement('div');
    container.id = 'students-container';
    container.innerHTML = `
        <div class="students-header">
            <h4>Iscritti - ${examName}</h4>
            <button class="close-container btn btn-danger" onclick="closeContainer()">✖</button>
        </div>
        <div class="students-list">
            <p>Caricamento iscritti...</p>
        </div>
    `;
    document.body.appendChild(container);
    await loadStudents(examName);
}

function closeContainer() {
    const container = document.getElementById('students-container');
    if (container) container.remove();
}

async function loadStudents(examName) {
    try {
        const response = await fetch(`/api/get_subscribed_users?${new URLSearchParams({ examName })}`);
        const students = (await response.json()).filter(student => student.username !== document.getElementById("username").textContent);
        const studentsList = document.querySelector('.students-list');
        studentsList.innerHTML = students.map(student => `
            <div class="student-item">
                <span>${student.username}</span>
                <button onclick="openChatWithStudent('${student.username}')" class="btn btn-info">Chat</button>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

async function openChatWithStudent(studentName) {
    let chatContainer = document.getElementById('chat-container');
    if (chatContainer) chatContainer.remove();
  
    const chatName = `${studentName}`;
  
    if (!chatName) {
      console.error("Chat name is undefined!");
      return;
    }
  
    chatContainer = document.createElement('div');
    chatContainer.id = 'chat-container';
    chatContainer.innerHTML = `
      <div class="chat-header">
        <h4>Chat con ${studentName}</h4>
        <button class="close-chat btn btn-danger" onclick="closeChat()">✖</button>
      </div>
      <div class="chat-messages" id="chat-messages"></div>
      <div class="chat-input">
        <input type="text" id="chat-message" placeholder="Scrivi un messaggio..." onkeypress="handleChatInputKeyPress(event, '${chatName}')"/>
        <button onclick="sendMessageToChat('${chatName}')" class="btn btn-primary">Invia</button>
      </div>
    `;
    document.body.appendChild(chatContainer);
    document.getElementById('chat-message').focus();
  
    ws.send(JSON.stringify({
      type: 'loadChatHistory',
      chatName: chatName,
      username: document.getElementById("username").textContent
    }));
    console.log("sent request")
  }
  
function closeChat() {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) chatContainer.remove();
}

function sendMessageToChat(chatName) {
    const messageInput = document.getElementById('chat-message');
    const message = messageInput.value.trim();
    const username = document.getElementById("username").textContent;

    if (!message || !username) {
        console.error('Username or message is undefined');
        return; // Impedisce l'invio del messaggio se `username` o `message` non sono definiti
    }

    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'outgoing');
        messageElement.innerHTML = `
            <strong>${username}:</strong> ${message}
            <span class="timestamp">${new Date().toLocaleTimeString()}</span>
        `;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    const payload = {
        type: 'sendMessage',
        chatName: chatName,
        username: username,
        text: message
    };

    console.log(payload); 
    ws.send(JSON.stringify(payload));

    messageInput.value = ''; 
}


function handleChatInputKeyPress(event, chatName) {
    if (event.key === "Enter") {
        sendMessageToChat(chatName);
        event.preventDefault();
    }
}

function initializeWebSocket() {
    ws = new WebSocket("ws://127.0.0.1:8080");

    ws.onopen = () => console.log("Connesso al WebSocket");

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
      
        if (data.type === 'chatHistory') {
            console.log("a")
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages && data.chatName) {
                console.log(data.chatName)
                console.log(data.chatHistory)
                chatMessages.innerHTML = data.chatHistory.map((msg) => `
                <div class="message ${msg.username === document.getElementById('username').textContent ? 'outgoing' : 'incoming'}">
                    <strong>${msg.username}:</strong> ${msg.message}
                    <span class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                `).join('');
                chatMessages.scrollTop = chatMessages.scrollHeight; 
            }
        }
      
        if (data.type === 'newMessage') {
          const chatMessages = document.getElementById('chat-messages');
          console.log("kekko napoli")
          
          if (chatMessages && data.username != document.getElementById('username').textContent) {
            chatMessages.innerHTML += `
              <div class="message ${data.username === document.getElementById('username').textContent ? 'outgoing' : 'incoming'}">
                <strong>${data.username}:</strong> ${data.message}
                <span class="timestamp">${new Date().toLocaleTimeString()}</span>
              </div>
            `;
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }
        }
      };
      
    ws.onclose = () => console.log("Connessione WebSocket chiusa");
    ws.onerror = (error) => console.error("Errore WebSocket:", error);
}

async function fetchUsername() {
    try {
        const response = await fetch('/dashboard/username');
        const mat = await fetch('/dashboard/matricola');
        const data = await response.json();
        const pippo = await mat.json();
        document.getElementById("username").textContent = data.username;
        document.getElementById("matId").textContent = pippo.matricola;
    } catch (err) {
        console.error('Errore nel recupero del nome utente:', err);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await fetchUsername();
    initializeWebSocket();
    await fetchUserExams();
});
