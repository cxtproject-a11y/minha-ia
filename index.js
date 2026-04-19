const readline = require("readline");
const fs = require("fs");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ARQUIVO_MEMORIA = "memoria.json";

// carregar memória do arquivo
function carregarMemoria() {
  if (fs.existsSync(ARQUIVO_MEMORIA)) {
    const dados = fs.readFileSync(ARQUIVO_MEMORIA, "utf-8");
    return JSON.parse(dados);
  } else {
    return [
      {
        role: "system",
        content: "Você é uma IA brasileira. Responda sempre em português do Brasil. Corrija erros do usuário e seja clara e direta."
      }
    ];
  }
}

// salvar memória no arquivo
function salvarMemoria(memoria) {
  fs.writeFileSync(ARQUIVO_MEMORIA, JSON.stringify(memoria, null, 2));
}

let mensagens = carregarMemoria();

async function perguntar() {
  rl.question("Você: ", async (pergunta) => {
    try {
      mensagens.push({
        role: "user",
        content: pergunta
      });

      const resposta = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3",
          messages: mensagens,
          stream: false
        })
      });

      const data = await resposta.json();

      if (data.message && data.message.content) {
        const respostaIA = data.message.content;

        console.log("\nIA:", respostaIA, "\n");

        mensagens.push({
          role: "assistant",
          content: respostaIA
        });

        salvarMemoria(mensagens);

      } else {
        console.log("\nIA: (sem resposta)\n");
      }

    } catch (erro) {
      console.log("Erro:", erro.message);
    }

    perguntar();
  });
}

console.clear();
console.log("IA com memória salva iniciada\n");

perguntar();