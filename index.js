const express = require("express");
const axios = require("axios");
const qs = require("querystring");
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
const placeholderIdPipe = 182886;
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

  getClientPipe("teste de automaçao");
});

//adicionar condicional para o app rodar só se a key de terminado for true
async function appStart() {
  try {
    const accessToken = await getAuthorization();
    const auvoCpf = await getClientAuvo(accessToken, placeholderId);
    const pipeClient = await getClientPipe(auvoCpf);
    const noteAdded = await addNote(
      pipeClient,
      placeholderTarefa,
      placeholderLocal,
      placeholderOperador,
      placeholderHorario
    );
    console.log(noteAdded);
  } catch (err) {
    console.error(err);
  }
}

//funçao que gera o token de autorizaçao para o auvo
async function getAuthorization() {
  try {
    const response = await axios(
      `${AuvoBaseURL}/login/?apiKey=${APIauvoKey}&apiToken=${APIauvoToken}`
    );
    const data = await response.data;
    const accessToken = await data.result.accessToken;
    console.log(accessToken);
    return accessToken;
  } catch (err) {
    console.error(err);
  }
}

//funçao que gera o cpf do cliente do auvo para referenciar no pipeDrive
//recebe o token de acesso(da funçao) e a id do cliente(da requisiçao)
async function getClientAuvo(acessToken, id) {
  try {
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
    const cpf = await data.result.cpfCnpj;
    console.log(cpf);
    return cpf;
  } catch (err) {
    console.error(err);
  }
}

//funçao para selecionar o cliente no pipeDrive, recebe o cpf do cliente alvo do auvo (kek)
async function getClientPipe(cpf) {
  try {
    const response = await axios(
      `${PipeBaseURL}/persons/search?exact_match=true&api_token=${pipeKey}&term=${cpf}`
    );
    const data = await response.data.data;
    const id = await data.items[0].item.id;
    console.log(id);
    return id;
  } catch (err) {
    console.error(err);
  }
}

//funçao que adiciona a nota no cliente do pipeDrive
//recebe o id do cliente do pipeDrive (da funçao), nome da tarefa realizada, local, operador e horario (da requisiçao)
async function addNote(id, nomeTarefa, local, operador, horario) {
  try {
    const body = {
      content: `Tarefa ${nomeTarefa} concluida em ${local} por ${operador} às ${horario}`,
      person_id: id,
    };
    const response = await axios({
      method: "post",
      url: `${PipeBaseURL}/notes?api_token=${pipeKey}`,
      headers: {
        "Content-type": "application/x-www-form-urlencoded",
        Accept: "application/x-www-form-urlencoded",
      },
      data: qs.stringify(body),
    });
    const data = await response.data;
    console.log(data);
    const success = await data.success;
    if (success) {
      return "Note added";
    } else {
      return "Something whent wrong";
    }
  } catch (err) {
    console.error(err);
  }
}

app.listen(PORT, () =>
  console.log(`App listening at http://localhost:${PORT}`)
);
