const chat = document.getElementById("chat");
const input = document.getElementById("input");

function adicionarMensagem(texto, classe) {
  const div = document.createElement("div");
  div.className = "msg " + classe;
  div.innerText = texto;

  chat.appendChild(div);

  // animação
  setTimeout(() => {
    div.style.transition = "all 0.3s ease";
    div.style.opacity = "1";
    div.style.transform = "translateY(0)";
  }, 10);

  chat.scrollTop = chat.scrollHeight;
}

async function enviar() {
  const pergunta = input.value.trim();
  if (!pergunta) return;

  adicionarMensagem(pergunta, "user");
  input.value = "";
  input.focus();

  const typing = document.createElement("div");
  typing.className = "msg bot typing";
  typing.innerText = "Digitando...";
  chat.appendChild(typing);

  chat.scrollTop = chat.scrollHeight;

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ pergunta })
    });

    const data = await res.json();
    typing.remove();

    adicionarMensagem(data.resposta, "bot");

  } catch (err) {
    typing.innerText = "Erro ao responder.";
  }
}

// ENTER ENVIA (PC + CELULAR)
input.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    enviar();
  }
});

// foco automático
window.onload = () => input.focus();