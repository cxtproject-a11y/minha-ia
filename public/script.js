const chat = document.getElementById("chat");
const input = document.getElementById("input");

function adicionarMensagem(texto, classe) {
  const div = document.createElement("div");
  div.className = "msg " + classe;
  div.innerText = texto;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function enviar() {
  const pergunta = input.value;
  if (!pergunta) return;

  adicionarMensagem(pergunta, "user");
  input.value = "";

  const typing = document.createElement("div");
  typing.className = "msg bot typing";
  typing.innerText = "IA está digitando...";
  chat.appendChild(typing);

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
}