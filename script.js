
/* =====================================
   MINHA IA - SISTEMA PRINCIPAL
===================================== */

// Elementos do site
const newCharacterBtn = document.getElementById("newCharacter");
const characterModal = document.getElementById("characterModal");
const closeModalBtn = document.getElementById("closeModal");
const saveCharacterBtn = document.getElementById("saveCharacter");

const characterList = document.getElementById("characterList");
const characterName = document.getElementById("characterName");
const characterAvatar = document.getElementById("characterAvatar");
const characterStatus = document.getElementById("characterStatus");

const messages = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

const uploadButton = document.getElementById("uploadButton");
const imageInput = document.getElementById("imageInput");


// Dados salvos
let characters = JSON.parse(
    localStorage.getItem("myAI_characters") || "[]"
);

let activeCharacterId = localStorage.getItem("myAI_active") || null;


// =====================================
// SALVAR DADOS
// =====================================

function saveData() {
    localStorage.setItem(
        "myAI_characters",
        JSON.stringify(characters)
    );

    if (activeCharacterId) {
        localStorage.setItem("myAI_active", activeCharacterId);
    } else {
        localStorage.removeItem("myAI_active");
    }
}


// =====================================
// PERSONAGEM ATUAL
// =====================================

function getActiveCharacter() {
    return characters.find(
        character => character.id === activeCharacterId
    );
}


// =====================================
// CRIAR PERSONAGEM
// =====================================

newCharacterBtn.addEventListener("click", () => {
    characterModal.hidden = false;
});

closeModalBtn.addEventListener("click", () => {
    characterModal.hidden = true;
});


// =====================================
// PREPARAR FOTO
// =====================================

function prepareImage(file) {
    return new Promise((resolve, reject) => {

        if (!file || !file.type.startsWith("image/")) {
            reject(new Error("Selecione uma imagem válida."));
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement("canvas");

                const maxSize = 512;

                let width = img.width;
                let height = img.height;

                if (width > height && width > maxSize) {
                    height = Math.round(height * maxSize / width);
                    width = maxSize;
                } else if (height > maxSize) {
                    width = Math.round(width * maxSize / height);
                    height = maxSize;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");

                ctx.drawImage(img, 0, 0, width, height);

                resolve(
                    canvas.toDataURL("image/jpeg", 0.75)
                );
            };

            img.onerror = () => {
                reject(new Error("Não foi possível abrir a imagem."));
            };

            img.src = reader.result;
        };

        reader.onerror = () => {
            reject(new Error("Erro ao carregar a imagem."));
        };

        reader.readAsDataURL(file);
    });
}


// =====================================
// SALVAR NOVA PERSONAGEM
// =====================================

saveCharacterBtn.addEventListener("click", async () => {

    const name = document.getElementById("newName").value.trim();

    const age = Number(document.getElementById("newAge").value);

    const personality = document
        .getElementById("newPersonality")
        .value.trim();

    const photoFile = document.getElementById("newPhoto").files[0];

    if (!name) {
        alert("Digite o nome da personagem!");
        return;
    }

    if (!Number.isInteger(age) || age < 18) {
        alert("A personagem precisa ter pelo menos 18 anos.");
        return;
    }

    if (!personality) {
        alert("Descreva a personalidade da personagem!");
        return;
    }

    saveCharacterBtn.disabled = true;

    try {

        let photo = "";

        if (photoFile) {
            photo = await prepareImage(photoFile);
        }

        const character = {
            id: crypto.randomUUID(),
            name: name,
            age: age,
            personality: personality,
            photo: photo,
            messages: [],
            createdAt: new Date().toISOString()
        };

        characters.push(character);

        activeCharacterId = character.id;

        saveData();

        renderCharacters();
        selectCharacter(character.id);

        // Limpar formulário
        document.getElementById("newName").value = "";
        document.getElementById("newAge").value = "";
        document.getElementById("newPersonality").value = "";
        document.getElementById("newPhoto").value = "";

        characterModal.hidden = true;

    } catch (error) {

        alert(error.message || "Não foi possível salvar a personagem.");

    } finally {

        saveCharacterBtn.disabled = false;

    }

});


// =====================================
// LISTAR PERSONAGENS
// =====================================

function renderCharacters() {

    characterList.innerHTML = "";

    if (characters.length === 0) {

        const empty = document.createElement("p");
        empty.textContent = "Nenhuma personagem criada.";

        characterList.appendChild(empty);

        return;
    }

    characters.forEach(character => {

        const button = document.createElement("button");

        button.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 10px;
            background: ${character.id === activeCharacterId
                ? "#383047"
                : "#25252f"};
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            text-align: left;
        `;

        const avatar = document.createElement("img");

        avatar.src = character.photo ||
            "https://placehold.co/45x45/292933/ffffff?text=IA";

        avatar.alt = "";

        avatar.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
            flex-shrink: 0;
        `;

        const name = document.createElement("span");

        name.textContent = character.name;

        name.style.cssText = `
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;

        button.appendChild(avatar);
        button.appendChild(name);

        button.addEventListener("click", () => {
            selectCharacter(character.id);
        });

        characterList.appendChild(button);

    });
}


// =====================================
// SELECIONAR PERSONAGEM
// =====================================

function selectCharacter(id) {

    const character = characters.find(
        item => item.id === id
    );

    if (!character) return;

    activeCharacterId = id;

    saveData();

    characterName.textContent = character.name;

    characterStatus.textContent =
        "Personagem criada • " + character.age + " anos";

    if (character.photo) {

        characterAvatar.src = character.photo;
        characterAvatar.style.visibility = "visible";

    } else {

        characterAvatar.removeAttribute("src");
        characterAvatar.style.visibility = "hidden";

    }

    renderCharacters();
    renderMessages();
}


// =====================================
// MOSTRAR MENSAGENS
// =====================================

function renderMessages() {

    const character = getActiveCharacter();

    messages.innerHTML = "";

    if (!character) {

        const welcome = document.createElement("div");

        welcome.className = "welcome";

        const title = document.createElement("h2");
        title.textContent = "Bem-vindo!";

        const description = document.createElement("p");
        description.textContent =
            "Crie uma personagem para começar sua história.";

        welcome.append(title, description);
        messages.appendChild(welcome);

        return;
    }

    if (character.messages.length === 0) {

        const welcome = document.createElement("div");

        welcome.className = "welcome";

        const title = document.createElement("h2");
        title.textContent = "Sua história começa aqui!";

        const description = document.createElement("p");
        description.textContent =
            "Converse com " + character.name + ".";

        welcome.append(title, description);

        messages.appendChild(welcome);

        return;
    }

    character.messages.forEach(message => {

        const bubble = document.createElement("div");

        bubble.className = "message " + message.sender;

        const sender = document.createElement("span");

        sender.className = "sender";

        sender.textContent = message.sender === "user"
            ? "Você"
            : character.name;

        const content = document.createElement("div");

        content.textContent = message.text;

        bubble.append(sender, content);

        messages.appendChild(bubble);

    });

    messages.scrollTop = messages.scrollHeight;
}


// =====================================
// ENVIAR MENSAGEM
// =====================================

function sendMessage() {

    const character = getActiveCharacter();

    const text = messageInput.value.trim();

    if (!character) {
        alert("Primeiro crie uma personagem!");
        return;
    }

    if (!text) return;

    character.messages.push({
        sender: "user",
        text: text,
        date: new Date().toISOString()
    });

    messageInput.value = "";

    saveData();

    renderMessages();

    // A resposta da IA será conectada posteriormente.
    characterStatus.textContent =
        "Mensagem enviada • IA ainda não conectada";
}

sendButton.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        sendMessage();
    }

});


// =====================================
// TROCAR FOTO DA PERSONAGEM
// =====================================

uploadButton.addEventListener("click", () => {

    if (!getActiveCharacter()) {
        alert("Selecione ou crie uma personagem primeiro!");
        return;
    }

    imageInput.click();

});


imageInput.addEventListener("change", async () => {

    const file = imageInput.files[0];

    if (!file) return;

    const character = getActiveCharacter();

    if (!character) return;

    try {

        character.photo = await prepareImage(file);

        saveData();

        selectCharacter(character.id);

        alert("Foto da personagem atualizada!");

    } catch (error) {

        alert(error.message || "Erro ao trocar foto.");

    } finally {

        imageInput.value = "";

    }

});


// =====================================
// INICIAR APLICAÇÃO
// =====================================

renderCharacters();

if (characters.some(item => item.id === activeCharacterId)) {

    selectCharacter(activeCharacterId);

} else if (characters.length > 0) {

    selectCharacter(characters[0].id);

} else {

    renderMessages();

}
