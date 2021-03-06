const express = require("express");
const axios = require("axios");
const qs = require("querystring");
require("dotenv").config();
const PORT = process.env.PORT || 8080;

const app = express();
app.use(express.static("public"));
app.use(express.json());

const pipeKey = process.env.pipeKey;
const APIauvoKey = process.env.APIauvoKey;
const APIauvoToken = process.env.APIauvoToken;
const taskIdControl = [];

const AuvoBaseURL = "https://api.auvo.com.br/v2/";
const PipeBaseURL = "https://api.pipedrive.com/v1";

app.post("/", (req, res) => {
  console.log("connected");
  res.send("post recieved");
});

//rota principal da api, para onde os webhooks são direcionados
app.post("/auvo", (req, res) => {
  const body = req.body;
  const taskId = body.entities[0].taskID;
  const isFinished = body.entities[0].finished;
  const havePendency = body.entities[0].pendency;
  const auvoId = body.entities[0].customerId;
  const reqPDF = body.entities[0].taskUrl;

  if (isFinished && havePendency === "" && !taskIdControl.includes(taskId)) {
    taskIdControl.push(taskId);
    appStart(auvoId, reqPDF);
    console.log("tarefa postada");
    res.send("success 1");
    return;
  } else if (havePendency !== "") {
    console.log("tarefa com pendencia");
    res.send("failed type 1");
    return;
  } else if (taskIdControl.includes(taskId)) {
    console.log("tarefa ja processada");
    res.send("failed type 2");
    return;
  } else {
    console.log(body);
    console.log("algum outro erro");
    res.send("failed type 3");
  }
});

//funçao para inicio da aplicaçao
async function appStart(auvoId, reqPDF) {
  try {
    const accessToken = await getAuthorization();
    const auvoCpf = await getClientAuvo(accessToken, auvoId);
    const pipeClient = await getClientPipe(auvoCpf);
    const pipeClientId = await pipeClient.id;
    const pipeClientName = await pipeClient.name;
    const noteAdded = await addNote(pipeClientId, reqPDF);
    const taskAdded = await addTask(pipeClientName, pipeClientId, reqPDF);
    console.log(noteAdded);
    console.log(taskAdded);
  } catch (err) {
    console.error(err);
  }
}

//funçao que gera o token de autorizaçao para o auvo
async function getAuthorization() {
  try {
    const response = await axios({
      method: "post",
      headers: {
        "Content-type": "application/json",
        Accept: "application/json",
      },
      data: {
        apiKey: `${APIauvoKey}`,
        apiToken: `${APIauvoToken}`,
      },
      url: `${AuvoBaseURL}/login`,
    });
    const data = await response.data;
    const accessToken = await data.result.accessToken;
    console.log("Token de autorizaçao ok");
    return accessToken;
  } catch (err) {
    console.log("getting auth token failed");
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
    console.log("Cpf auvo ok");
    return cpf;
  } catch (err) {
    console.log("getting auvo id failed");
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
    const name = await data.items[0].item.name;
    const id = await data.items[0].item.id;
    console.log("Id pipedrive ok");
    return { id, name };
  } catch (err) {
    console.log("getting pipe id failed");
    console.error(err);
  }
}

//funçao que adiciona a nota no cliente do pipeDrive
//recebe o id do cliente do pipeDrive (da funçao), nome da tarefa realizada, local, operador e horario (da requisiçao)
async function addNote(id, pdf) {
  try {
    const body = {
      content: `Relatorio da tarefa aqui ${pdf}`,
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
    const success = await data.success;
    return "Note added";
  } catch (err) {
    console.log("note not added");
    console.error(err);
  }
}

//funçao para adicionar uma tarefa a um funcionario
//funcionario atualmente é riva de oliveira alves
async function addTask(clientName, clientId, pdf) {
  try {
    const body = {
      user_id: 12172438,
      person_id: clientId,
      type: "encaminhar___pdf",
      note: `Encaminhar relatorio para cliente ${clientName} da tarefa ${pdf}.`,
    };
    const response = await axios({
      method: "post",
      url: `${PipeBaseURL}/activities?api_token=${pipeKey}`,
      headers: {
        "Content-type": "application/json",
        Accept: "application/jsopn",
      },
      data: body,
    });

    return "task added";
  } catch (err) {
    console.log("task not added");
    console.error(err);
  }
}

app.listen(PORT, () =>
  console.log(`App listening at http://localhost:${PORT}`)
);
