require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());
app.use(express.static("public"));

console.log("OPENROUTER:", process.env.OPENROUTER_API_KEY);
console.log("WEATHER:", process.env.OPENWEATHER_API_KEY);

let mensagens = [];
let ultimaCidade = "";

// 🔥 IA extrai cidade
async function extrairCidade(pergunta) {
  const resposta = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Minha IA",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openrouter/auto",
      messages: [
        {
          role: "system",
          content: "Extraia apenas o nome de uma cidade da frase. Responda somente com o nome da cidade."
        },
        {
          role: "user",
          content: pergunta
        }
      ]
    })
  });

  const data = await resposta.json();
  return data.choices?.[0]?.message?.content?.trim();
}

app.post("/chat", async (req, res) => {
  const pergunta = req.body.pergunta;
  const perguntaLower = pergunta.toLowerCase();

  console.log("Pergunta:", pergunta);

  // 🌦️ DETECÇÃO CORRETA (SEM BUG)
  if (
    perguntaLower.includes("clima") ||
    perguntaLower.includes("tempo") ||
    perguntaLower.includes("temperatura") ||
    perguntaLower.startsWith("e em") ||
    perguntaLower.startsWith("em ")
  ) {
    try {
      let cidade = await extrairCidade(pergunta);

      if (!cidade && ultimaCidade) {
        cidade = ultimaCidade;
      }

      if (!cidade) {
        return res.json({
          resposta: "Não consegui identificar a cidade."
        });
      }

      ultimaCidade = cidade;

      console.log("Cidade detectada:", cidade);

      // 🔍 GEOCODING
      const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cidade)}&limit=3&appid=${process.env.OPENWEATHER_API_KEY}`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (!geoData.length) {
        return res.json({
          resposta: "Cidade não encontrada."
        });
      }

      // 🔥 prioriza Brasil se existir
      let cidadeEscolhida = geoData.find(c => c.country === "BR") || geoData[0];

      const { lat, lon, name, country } = cidadeEscolhida;

      // 🌦️ CLIMA
      const climaUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&lang=pt_br`;
      const climaRes = await fetch(climaUrl);
      const climaData = await climaRes.json();

      const respostaClima = `
Clima em ${name}, ${country}:
Temperatura: ${climaData.main.temp}°C
Descrição: ${climaData.weather[0].description}
Umidade: ${climaData.main.humidity}%
`;

      return res.json({ resposta: respostaClima });

    } catch (erro) {
      console.log("Erro clima:", erro.message);
      return res.json({
        resposta: "Erro ao buscar clima."
      });
    }
  }

  // 🧠 IA NORMAL
  mensagens.push({ role: "user", content: pergunta });

  try {
    const resposta = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Minha IA",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        messages: mensagens
      })
    });

    const data = await resposta.json();

    let respostaIA;

    if (data.error) {
      respostaIA = "Erro na API: " + data.error.message;
    } else if (data.choices && data.choices.length > 0) {
      respostaIA = data.choices[0].message.content;
    } else {
      respostaIA = "Resposta inesperada.";
    }

    respostaIA = respostaIA.replace(/\(.*?\)/g, "").trim();

    mensagens.push({ role: "assistant", content: respostaIA });

    res.json({ resposta: respostaIA });

  } catch (erro) {
    res.json({ resposta: "Erro ao conectar com a IA." });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});