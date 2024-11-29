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


let ws;
let username = '';
const MAX_MESSAGES = 50; // Limit message history
const chatHistories = {}; // Store chat histories for different users

function initializeWebSocket() {
    ws = new WebSocket("ws://127.0.0.1:3001");

    ws.onopen = () => {
        console.log("Connected to WebSocket Server");
        console.log("Sending username:", username);
        ws.send(username);
    };

    ws.onmessage = event => {
        console.log("Received WebSocket message:", event.data);
        const data = JSON.parse(event.data);
        
        console.log("Parsed message data:", data);
        
        if (data.type === "request_username") {
            console.log("Received username request");
            ws.send(username);
            return;
        }

        if (data.type === "message") {
            console.log("Handling incoming message:", data);
            handleIncomingMessage(data.from, data.message);
        }
    };

    ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
    };

    ws.onclose = (event) => {
        console.log("WebSocket disconnected. Reconnecting...");
        console.log("Close event details:", event);
        setTimeout(initializeWebSocket, 3000);
    };
}

function updateAreaIscrizioni() {
    const area = document.querySelector(".exam-list");
    
    // Clear existing content
    area.innerHTML = '';
    
    // Use a Set to ensure unique exams
    const uniqueExams = new Set(exams);
    
    // Populate the area with unique exams
    uniqueExams.forEach(exam => {
        const examItem = document.createElement('div');
        examItem.className = 'exam-item';
        examItem.innerHTML = `
            <h4>${exam}</h4>
            <button onclick="viewStudents('${exam}')" class="view-students-button">Visualizza Iscritti</button>
            <button onclick="openChat('${exam}')" class="chat-button">Chat</button>
        `;
        area.appendChild(examItem);
    });
}

function openChat(examName) {
    // Placeholder for exam-wide chat functionality
    // You can implement a group chat or modify as needed
    alert(`Chat for exam: ${examName}`);
}

function handleIncomingMessage(sender, message) {
    // Check if chat is open with this sender
    const chatContainer = document.getElementById('chat-container');
    const currentChatUser = chatContainer ? 
        chatContainer.querySelector('.chat-header h4').textContent.replace('Chat con ', '') 
        : null;

    if (currentChatUser === sender) {
        displayMessage(sender, message, true);
    } else {
        // Notification for new message
        showMessageNotification(sender, message);
    }

    // Save to local storage (both sent and received)
    saveMessageToLocalStorage(sender, message, true);
}
function showMessageNotification(sender, message) {
    // Create a toast-like notification
    const notification = document.createElement('div');
    notification.className = 'message-notification';
    notification.innerHTML = `
        <strong>${sender}:</strong> ${message}
        <button onclick="openChatWithStudent('${sender}')">Open</button>
    `;
    document.body.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 5000);
}

function openChatWithStudent(studentName) {
    let chatContainer = document.getElementById('chat-container');
    if (chatContainer) chatContainer.remove();

    chatContainer = document.createElement('div');
    chatContainer.id = 'chat-container';
    chatContainer.innerHTML = `
        <div class="chat-header">
            <h4>Chat con ${studentName}</h4>
            <button class="close-chat" onclick="closeChat()">✖</button>
        </div>
        <div class="chat-messages">
            ${loadChatHistory(studentName)}
        </div>
        <div class="chat-input">
            <input type="text" id="chat-message" placeholder="Scrivi un messaggio..." 
                   onkeypress="handleChatInputKeyPress(event, '${studentName}')" />
            <button onclick="sendMessageToStudent('${studentName}')">Invia</button>
        </div>
    `;
    document.body.appendChild(chatContainer);

    // Focus on input
    document.getElementById('chat-message').focus();
}

function handleChatInputKeyPress(event, studentName) {
    if (event.key === 'Enter') {
        sendMessageToStudent(studentName);
    }
}

function sendMessageToStudent(studentName) {
    const messageInput = document.getElementById('chat-message');
    const message = messageInput.value.trim();
    
    if (message) {
        // Display sent message
        displayMessage(username, message, false);
        
        // Send via WebSocket
        ws.send(JSON.stringify({ to: studentName, message }));
        
        // Save to local storage (both sent and received)
        saveMessageToLocalStorage(studentName, message, false);
        
        // Clear input
        messageInput.value = '';
    }
}
function displayMessage(sender, message, isIncoming) {
    const messagesContainer = document.querySelector('.chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isIncoming ? 'incoming' : 'outgoing'}`;
    messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function saveMessageToLocalStorage(correspondent, message, isIncoming) {
    const key = `chat_${correspondent}`;
    
    // Retrieve existing chat history or initialize
    let chatHistory = JSON.parse(localStorage.getItem(key) || '[]');

    // Add new message
    chatHistory.push({
        sender: isIncoming ? correspondent : username,
        message,
        timestamp: new Date().toISOString(),
        type: isIncoming ? 'incoming' : 'outgoing'
    });

    // Limit message history
    if (chatHistory.length > MAX_MESSAGES) {
        chatHistory = chatHistory.slice(-MAX_MESSAGES);
    }

    // Save to localStorage
    localStorage.setItem(key, JSON.stringify(chatHistory));
}

function loadChatHistory(correspondent) {
    const key = `chat_${correspondent}`;
    
    // Retrieve chat history
    const chatHistory = JSON.parse(localStorage.getItem(key) || '[]');

    // Generate HTML for chat history
    return chatHistory.map(msg => 
        `<div class="message ${msg.type}">
            <strong>${msg.sender}:</strong> ${msg.message}
        </div>`
    ).join('');
}

async function test() {
    try {
        const response = await fetch('/api/get_username');
        username = await response.text();
        initializeWebSocket();
    } catch (err) {
        console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    test();
    fetchUserExams();
});