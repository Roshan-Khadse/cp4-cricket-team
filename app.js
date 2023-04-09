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
    app.listen(3057, () => {
      console.log("Server Running at http://localhost:3057/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperty = (requestQuery) => {
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
  try {
    switch (true) {
      case hasPriorityAndStatusProperty(request.query):
        todosQuery = `
          SELECT *
          FROM
          todo
          WHERE
         todo LIKE '%${search_q}%'
         AND status='${status}'
         AND priority='${priority}';`;
        break;
      case hasPriorityProperty(request.query):
        todosQuery = `
          SELECT
          *
          FROM
          todo
          WHERE
          todo LIKE '%${search_q}%'
          AND priority='${priority}';`;
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
  } catch (e) {
    console.log(e.message);
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoById = `
  SELECT 
  *
  FROM
  todo
  WHERE
  ID=${todoId};`;
  const resTodo = await db.get(getTodoById);
  response.send(resTodo);
});

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const postTodoQuery = `
  INSERT INTO 
  todo(id,todo,priority,status)
  VALUES(
        ${id}, 
       '${todo}',
      '${priority}',
      '${status}'
  );`;
  await db.run(postTodoQuery);
  //const todoId = dbResponse.lastID;
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
  SELECT
  * FROM
  todo
  WHERE
  id=${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
  DELETE
  FROM
  todo
  WHERE
  id=${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});
