const express = require("express");
const axios = require("axios");
require("dotenv").config();
const PORT = 8080;

const app = express();
app.use(express.json());

const pipeKey = process.env.pipeKey;
const APIauvoKey = process.env.APIauvoKey;
const APIauvoToken = process.env.APIauvoToken;

const AuvoBaseURL = "https://api.auvo.com.br/v2/";
const PipeBaseURL = "https://api.pipedrive.com/v1";

const placeholderId = 5838426;
const placeholderIdPipe = 94007;
const placeholderTarefa = "aterramento";
const placeholderLocal = "curitiba";
const placeholderOperador = "angelo";
const placeholderHorario = "meia noite";

app.get("/", (req, res) => {
  res.status(200).send(`
    <html>
    <head><title>Success!</title></head>
    <body>
        <h1>You did it!</h1>
        <img src="https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif" alt="Cool kid doing thumbs up" />
        <a href="/omieList">Chamar Lista</a>
    </body>
    </html>
  `);

  getClientAuvo(
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6WyJhZG1pbmlzdHJhdGl2byBvcGVyYWNpb25hbCIsImFkbWluaXN0cmF0aXZvIG9wZXJhY2lvbmFsIl0sImp0aSI6ImZmYWZiOGQwODNlNDRmNjk5MjY1ZWJjZGM1YjFiNmI0IiwiYXBpS2V5IjoiWUxEUVRqZUEyRWhnWGV4SXpjekhTNGFXS2FZbWVUIiwiYXBpVG9rZW4iOiJZTERRVGplQTJFaHpReVVHYWVqT1NwTXJBdmZkRGdMMSIsIm5iZiI6MTYzMjc3NDI0OCwiZXhwIjoxNjMyNzc2MDQ4LCJpYXQiOjE2MzI3NzQyNDgsImlzcyI6IkF1dm9fQXBpX1B1YmxpY2EiLCJhdWQiOiJVc3VhcmlvX0FwaSJ9.pYBLCCr0oDb8fsC9k_g6lMSQvmS1YScBdwZRWmBQjqcP_fjKKxBGBJrC5e6YB9_TiTTjRmAlKzIoXcKI9U2S0PjgGfPAqrBwsPghQsyOIpzMVtikODQRUxrd1ASZDheumiBfKWeh8gYzpVyd94i5Zxh3Hd9ISAhtUYtYkEqboBVyVpAA-nfKhLDrCUWvMB1c6OBzmbO6gXE8rjyvpkekcBXV0MdO_KX6r7QFfDI2cgLLObt9Ej22hAhUN2kLwsaMTPt5klOvLM-t9ALp6qdxW561sVQYpLN_AuYV1RvdXOGRretxxVfgiedoUGj1xiZCnO7cv4iIi3UIZ59p1-HL3Q",
    placeholderId
  );
});

//adicionar condicional para o app rodar só se a key de terminado for true
async function appStart() {
  const accessToken = await getAuthorization();
  const auvoCpf = await getClientAuvo(accessToken, placeholderId);
  const pipeClient = await getClientPipe(auvoCpf);
  const noteAdded = await addNote(
    placeholderIdPipe,
    placeholderTarefa,
    placeholderLocal,
    placeholderOperador,
    placeholderHorario
  );
  console.log(noteAdded);
}

//funçao que gera o token de autorizaçao para o auvo
async function getAuthorization() {
  const response = await axios(
    `${AuvoBaseURL}/login/?apiKey=${APIauvoKey}&apiToken=${APIauvoToken}`
  );
  const data = await response.data;
  const accessToken = await data.result.accessToken;
  console.log(accessToken);
  return accessToken;
}

//funçao que gera o cpf do cliente do auvo para referenciar no pipeDrive
//recebe o token de acesso(da funçao) e a id do cliente(da requisiçao)
async function getClientAuvo(acessToken, id) {
  const response = await axios({
    method: "get",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${acessToken}`,
    },
    url: `${AuvoBaseURL}/customers/${id}`,
  });
  const data = await response.data;
  const cpf = await data.result.description;
  console.log(cpf);
  return cpf;
}

//funçao para selecionar o cliente no pipeDrive, recebe o cpf do cliente alvo do auvo (kek)
async function getClientPipe(cpf) {
  const response = await axios(
    `${PipeBaseURL}/persons/search?fields=custom_fields&exact_match=true&api_token=${pipeKey}&term=${cpf}`
  );
  const data = await response.data.data;
  const id = await data.items[0].item.id;
  console.log(id);
  return id;
}

//funçao que adiciona a nota no cliente do pipeDrive
//recebe o id do cliente do pipeDrive (da funçao), nome da tarefa realizada, local, operador e horario (da requisiçao)
async function addNote(id, nomeTarefa, local, operador, horario) {
  let body = {
    content: `Tarefa ${nomeTarefa} foi concluida em ${local} por ${operador} às ${horario}`,
    person_id: id,
  };

  const response = await axios({
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    url: `${PipeBaseURL}/notes`,
    body: querystring.stringify(body),
  });
  const data = await response.data;
  const success = await data.success;
  return success;
}

app.listen(PORT, () =>
  console.log(`App listening at http://localhost:${PORT}`)
);
