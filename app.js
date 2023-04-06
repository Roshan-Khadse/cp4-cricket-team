const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
module.exports = app;
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3050, () => {
      console.log("Server Running at http://localhost:3050/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority } = request.query;
  let data = null;
  let todosQuery = "";
  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      todosQuery = `
          SELECT *
          FROM
          todo
          WHERE
         todo LIKE '%${search_q}%'
         AND status='${status}'
         AND priority='${priority};`;
      break;
    case hasPriorityProperty(request.query):
      todosQuery = `
          SELECT
          *
          FROM
          todo
          WHERE
          todo LIKE '%${search_q}%'
          AND priority='${priority};`;
      break;
    case hasStatusProperty(request.query):
      todosQuery = `
          SELECT
          *
        FROM
        todo
        WHERE
         todo LIKE '%${search_q}%'
         AND status='${status}';`;
    default:
      todosQuery = `
          SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%';`;
  }
  data = await db.all(todosQuery);
  response.send(data);
});
