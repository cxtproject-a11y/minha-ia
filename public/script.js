const chat = document.getElementById("chat");

function adicionarMensagem(texto, classe) {
  const div = document.createElement("div");
  div.className = "msg " + classe;
  div.innerText = texto;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function enviar() {
  const input = document.getElementById("input");
  const pergunta = input.value;

  if (!pergunta) return;

  adicionarMensagem("Você: " + pergunta, "user");
  input.value = "";

  const res = await fetch("/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ pergunta })
  });

  const data = await res.json();

  adicionarMensagem("IA: " + data.resposta, "ia");
}