let ws;
const exams = new Set();

document.addEventListener('DOMContentLoaded', async () => {
    await initializeUserDetails();
    initializeWebSocket();
    await fetchImageFromBackend()
    await fetchUserExams();
    await fetchUserSubbedExams()
});

// ==================== USER FETCH ====================
async function initializeUserDetails() {
    try {
        const [usernameResponse, matricolaResponse] = await Promise.all([
            fetch('/dashboard/username'),
            fetch('/dashboard/matricola'),
        ]);


        const { username } = await usernameResponse.json();
        const { matricola } = await matricolaResponse.json();

        document.getElementById("username").textContent = username;
        document.getElementById("matId").textContent = matricola;
    } catch (err) {
        console.error('Errore nel recupero dei dettagli utente:', err);
    }
}
async function fetchUserSubbedExams() {
    try {
        const response = await fetch('/exams/subbed');
        const data = await response.json();  

        if(Array.isArray(data)) {
            data.forEach(e => {
                updateExamButton(e.exam_name, true)
                exams.add(e.exam_name)
            })
        }
        updateAreaIscrizioni()

    } catch (err) {
        console.error('Errore nel recupero degli esami iscritti:', err);
    }
}
async function fetchImageFromBackend() {
    try {
        const response = await fetch('/dashboard/image', {
            method: 'GET',
            headers: {
                'Accept': 'image/*',
            }
        });

        if (!response.ok) {
            throw new Error(`Errore nella richiesta dell'immagine: ${response.status}`);
        }

        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error('La risposta dal backend non è un\'immagine valida.');
        }

        const imageBlob = await response.blob();
        const imageUrl = URL.createObjectURL(imageBlob);

        const imgElement = document.getElementById('propic');
        imgElement.src = imageUrl;

    } catch (err) {
        console.error('Errore nel recupero dell\'immagine:', err);
    }
}
// ==================== ESAMI ====================
async function fetchUserExams() {
    try {
        const response = await fetch('/exams');
        const data = await response.json();  


        if (Array.isArray(data)) {
            for (const exam of data) {
                await appendExam(exam.name, exam.anno); 
                updateExamButton(exam, true); 
            }
        } else {
            console.error('I dati ricevuti non sono un array:', data);
        }

    } catch (err) {
        console.error('Errore nel recupero degli esami iscritti:', err);
    }
}


async function appendExam(examName, examYear) {
    const yearContainer = document.getElementById(`anno${examYear}`);
    
    if (yearContainer === null) {
        await generateExamContainer(examYear);
    }
    
    const row = document.getElementById(`anno${examYear}`).getElementsByClassName("row")[0];
    
    if (row) {
        const examItem = document.createElement("div");
        examItem.classList.add("col-12", "col-md-6", "col-lg-4", "mb-4");
        examItem.innerHTML = `
            <div class="card">
                <div class="card-body text-center">
                    <h4>${examName}</h4>
                    <button id="btn-${examName}" class="btn btn-primary mt-2" onclick="toggleSubscription('${examName}')">Iscriviti</button>
                </div>
            </div>
        `;
        row.appendChild(examItem); 
    } else {
        console.error('Impossibile trovare la riga per l\'anno di esame', examYear);
    }
}

function generateExamContainer(examYear) {
    if (document.getElementById(`anno${examYear}`)) return;

    const container = document.getElementById("main-container");
    container.innerHTML += `
    <div id="anno${examYear}" class="card shadow mb-4">
        <div class="card-header bg-primary text-white">
            <h5 class="mb-0">Attività Didattiche - Anno di Corso ${examYear}</h5>
        </div>
        <div class="card-body">
            <div class="row">
            </div>
        </div>
    </div>
    `;
}

function updateAreaIscrizioni() {
    const area = document.getElementById("exam-list");
    if (!area) {
        console.error("Elemento .exam-list non trovato nel DOM.");
        return;
    }
    area.innerHTML = [...exams].map(exam => `
        <div class="exam-item d-flex justify-content-between align-items-center">
            <h4>${exam}</h4>
            <button onclick="viewStudents('${exam}')" class="btn btn-primary">Visualizza Iscritti</button>
        </div>
    `).join('');
}


async function toggleSubscription(examName) {
    const isSubscribed = exams.has(examName);
    const endpoint = isSubscribed ? '/api/unsubscribe' : '/api/subscribe';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exam_name: examName })
        });

        const data = await response.json();

        if (data.success) {
            if (isSubscribed) {
                exams.delete(examName);
            } else {
                exams.add(examName);
            }

            updateExamButton(examName, !isSubscribed);
            updateAreaIscrizioni()

        } else {
            alert(data.message || 'Errore durante l\'operazione');
        }
    } catch (err) {
        console.error('Errore nella gestione iscrizione:', err);
    }
}


function updateExamButton(examName, isSubscribed) {
    const button = document.getElementById(`btn-${examName}`);
    
    if (!button) {
        console.error(`Il pulsante per l'esame ${examName} non esiste.`);
        return;
    }

    button.textContent = isSubscribed ? "Iscritto" : "Iscriviti";
    button.classList.toggle("iscritto", isSubscribed);
    button.classList.toggle("iscrizione", !isSubscribed);
}


function formatId(name) {
    return name.replace(/ /g, '-');
}

// ==================== STUDENTI ====================
async function viewStudents(examName) {
    const container = document.getElementById('students-container') || createStudentContainer(examName);
    container.querySelector('.students-list').innerHTML = '<p>Caricamento iscritti...</p>';
    await loadStudents(examName);
}

function createStudentContainer(examName) {
    const container = document.createElement('div');
    container.id = 'students-container';
    container.innerHTML = `
        <div class="students-header">
            <h4>Iscritti - ${examName}</h4>
            <button class="close-container btn btn-danger" onclick="this.parentElement.parentElement.remove()">✖</button>
        </div>
        <div class="students-list"></div>
        `
    ;
    document.body.appendChild(container);
    return container;
}

async function loadStudents(examName) {
    try {
        const response = await fetch(`/api/get_subscribed_users?${new URLSearchParams({ examName })}`);
        const students = await response.json();
        const currentUser = document.getElementById("username").textContent;

        const studentsList = document.querySelector('.students-list');
        studentsList.innerHTML = students
            .filter(student => student.username !== currentUser)
            .map(student => `
                <div class="student-item">
                    <span>${student.username}</span>
                    <button onclick="openChat('${student.username}')" class="btn btn-info">Chat</button>
                </div>
            `).join('');
    } catch (err) {
        console.error('Errore nel caricamento studenti:', err);
    }
}

// ==================== CHAT ====================
async function openChat(studentName) {
    let chatContainer = document.getElementById('chat-container');
    let username = document.getElementById('username').textContent
    if (chatContainer) chatContainer.remove();

    chatContainer = document.createElement('div');
    chatContainer.id = 'chat-container';
    chatContainer.innerHTML = `
        <div class="chat-header">
            <h4>Chat con ${studentName}</h4>
            <button onclick="this.parentElement.parentElement.remove()" class="btn btn-danger">✖</button>
        </div>
        <div id="chat-messages" class="chat-messages"></div>
        <div class="chat-input">
            <input type="text" placeholder="Scrivi un messaggio..." onkeypress="handleChatKeyPress(event, '${studentName}')"/>
            <button onclick="sendMessage('${studentName}')" class="btn btn-primary">Invia</button>
        </div>
        `
    ;
    document.body.appendChild(chatContainer);

    ws.send(JSON.stringify({ type: 'loadChatHistory', chatName: studentName, username: username }));
}

function sendMessage(chatName) {
    const input = document.querySelector('#chat-container input');
    const message = input.value.trim();
    const username = document.getElementById("username").textContent;

    if (!message) return;

    ws.send(JSON.stringify({ type: 'sendMessage', chatName, username, text: message }));
    appendMessage(username, message, 'outgoing');
    input.value = '';
}

function appendMessage(user, text, type) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;

    messages.innerHTML += `
        <div class="message ${type}">
            <strong>${user}:</strong> ${text}
            <span>${new Date().toLocaleTimeString()}</span>
        </div>
    `;
    messages.scrollTop = messages.scrollHeight;
}

function handleChatKeyPress(event, chatName) {
    if (event.key === 'Enter') sendMessage(chatName);
}

// ==================== WEBSOCKET ====================
function initializeWebSocket() {
    ws = new WebSocket("ws://127.0.0.1:8080");

    ws.onopen = () => console.log("Connesso al WebSocket");

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
      
        if (data.type === 'chatHistory') {
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages && data.chatName) {
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
