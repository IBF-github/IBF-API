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

  getAuthorization();
});
//adicionar condicional para o app rodar só se a key de terminado for true
async function appStart() {}

//funçao que gera o token de autorizaçao para o auvo
async function getAuthorization() {
  const response = await axios(
    `${AuvoBaseURL}/login/?apiKey=${APIauvoKey}&apiToken=${APIauvoToken}`
  );
  console.log(response);
  const data = await response.data;
  const acessToken = await data.result.acessToken;
  return acessToken;
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
  console.log(response);
  const data = await response.data;
  const cpf = await data.result.cpfCnpj;
  return cpf;
}

//funçao para selecionar o cliente no pipeDrive, recebe o cpf do cliente alvo do auvo (kek)
async function getClientPipe(cpf) {
  const response = await axios(
    `${PipeBaseURL}/persons/search?fields=custom_fields&api_token=${pipeKey}&term=${cpf}`
  );
  console.log(response);
  const data = await response.data;
  const id = await data.items.item.id;
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
  const success = await response.success;
  console.log(success);
}
