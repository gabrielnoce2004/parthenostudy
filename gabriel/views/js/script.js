// Seleziona il pulsante per mostrare/nascondere la password e l'input della password
const togglePasswordButton = document.querySelector('.toggle-password');
const passwordInput = document.querySelector('#password');

// Aggiungi un event listener per il clic sul pulsante
togglePasswordButton.addEventListener('click', () => {
    // Controlla il tipo di input
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text'; // Cambia il tipo in 'text' per mostrare la password
        togglePasswordButton.textContent = '🙈'; // Cambia l'icona
    } else {
        passwordInput.type = 'password'; // Cambia il tipo in 'password' per nascondere la password
        togglePasswordButton.textContent = '👁️'; // Cambia l'icona
    }
});

