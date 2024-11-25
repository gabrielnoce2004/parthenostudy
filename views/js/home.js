const exams = new Set();

async function fetchUserExams() {
    try {
        const response = await fetch('/api/user-exams');
        const data = await response.json();
        data.forEach(exam => {
            exams.add(exam.nome);
            const button = document.getElementById(`btn-${exam.nome.replace(/ /g, '-')}`);
            if (button) {
                button.innerText = "Iscritto";
                button.classList.add("iscritto");
            }
        });
        updateAreaIscrizioni();
    } catch (err) {
        console.error('Errore nel recupero degli esami iscritti:', err);
    }
}

async function toggleSubscription(examName) {
    const button = document.getElementById(`btn-${examName.replace(/ /g, '-')}`);
    const isSubscribed = exams.has(examName);
    const url = isSubscribed ? '/api/unsubscribe' : '/api/subscribe';
    const method = 'POST';
    const body = JSON.stringify({ exam_name: examName });

    try {
        const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body });
        const data = await response.json();
        if (data.success) {
            if (isSubscribed) exams.delete(examName);
            else exams.add(examName);
            button.innerText = isSubscribed ? "Iscriviti" : "Iscritto";
            button.classList.toggle("iscritto", !isSubscribed);
            updateAreaIscrizioni();
        } else {
            alert(data.message || `Errore durante l'${isSubscribed ? 'disiscrizione' : 'iscrizione'}`);
        }
    } catch (err) {
        console.error(err);
    }
}

function updateAreaIscrizioni() {
    const area = document.querySelector(".exam-list");
    area.innerHTML = [...exams].map(exam => `
        <div class="exam-item">
            <h4>${exam}</h4>
            <button onclick="viewStudents('${exam}')" class="view-students-button">Visualizza Iscritti</button>
            <button onclick="openChat('${exam}')" class="chat-button">Chat</button>
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
            <button class="close-container" onclick="closeContainer()">✖</button>
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
                <button onclick="openChatWithStudent('${student.username}')" class="chat-button">Chat</button>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

function openChatWithStudent(studentName) {
    let chatContainer = document.getElementById('chat-container');
    if (chatContainer) return chatContainer.remove();

    chatContainer = document.createElement('div');
    chatContainer.id = 'chat-container';
    chatContainer.innerHTML = `
        <div class="chat-header">
            <h4>Chat con ${studentName}</h4>
            <button class="close-chat" onclick="closeChat()">✖</button>
        </div>
        <div class="chat-messages">
            <p>Benvenuto nella chat con ${studentName}!</p>
        </div>
        <div class="chat-input">
            <input type="text" id="chat-message" placeholder="Scrivi un messaggio..." />
            <button onclick="sendMessageToStudent('${studentName}')">Invia</button>
        </div>
    `;
    document.body.appendChild(chatContainer);
    loadChatMessages(studentName);
}

function closeChat() {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) chatContainer.remove();
}

function loadChatMessages(studentName) {
    const messagesContainer = document.querySelector('.chat-messages');
    messagesContainer.innerHTML += `
        <div class="message"><strong>${studentName}:</strong> Ciao!</div>
    `;
}

function sendMessageToStudent(studentName) {
    const message = document.getElementById('chat-message').value.trim();
    if (message) {
        const messagesContainer = document.querySelector('.chat-messages');
        messagesContainer.innerHTML += `
            <div class="message"><strong>Io:</strong> ${message}</div>
        `;
        document.getElementById('chat-message').value = '';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        ws.send(JSON.stringify({ to: studentName, message }));
    }
}

let ws;
function initializeWebSocket() {
    ws = new WebSocket("ws://127.0.0.1:3001");
    const username = document.getElementById("username").textContent;
    ws.onopen = () => {
        console.log("Connesso al WebSocket Server");
        ws.send(username);
    };
    ws.onmessage = event => {
        const data = JSON.parse(event.data);
        if (data.type === "message") displayIncomingMessage(data.from, data.message);
    };
    ws.onclose = () => {
        console.log("WebSocket disconnesso. Riconnessione...");
        setTimeout(initializeWebSocket, 3000);
    };
}

function displayIncomingMessage(sender, message) {
    const messagesContainer = document.querySelector('.chat-messages');
    messagesContainer.innerHTML += `
        <div class="message"><strong>${sender}:</strong> ${message}</div>
    `;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function test() {
    try {
        const response = await fetch('/api/get_username');
        document.getElementById('username').textContent = await response.text();
    } catch (err) {
        console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    test();
    initializeWebSocket();
    fetchUserExams();
});
