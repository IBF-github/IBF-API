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

app.get("/", (req, res) =>
  res.status(200).send(`
    <html>
    <head><title>Success!</title></head>
    <body>
        <h1>You did it!</h1>
        <img src="https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif" alt="Cool kid doing thumbs up" />
        <a href="/omieList">Chamar Lista</a>
    </body>
    </html>
    `)
);
//adicionar condicional para o app rodar só se a key de terminado for true
async function appStart() {}

async function getAuthorization() {
  const response = await axios(
    `${AuvoBaseURL}/login/?apiKey=${APIauvoKey}&apiToken=${APIauvoToken}`
  );
  console.log(response);
  const data = await response.data;
  const acessToken = await data.result.acessToken;
  return acessToken;
}

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

async function getClientPipe(cpf) {
  const response = await axios(
    `${PipeBaseURL}/persons/search?fields=custom_fields&api_token=${pipeKey}&term=${cpf}`
  );
  console.log(response);
  const data = await response.data;
  const id = await data.items.item.id;
  return id;
}

async function addNote(id) {
  //ver api pipedrive sobre adicionar nota a um cliente
  const response = await axios();
}
