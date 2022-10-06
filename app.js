
const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "datapeace.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

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
app.get("/users/", async (request, response) => {
  let data = null;
  let getUsersQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getUsersQuery = `
      SELECT
        *
      FROM
        user
      WHERE
        user LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getUsersQuery = `
      SELECT
        *
      FROM
        user
      WHERE
        user LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getUsesQuery = `
      SELECT
        *
      FROM
        user
      WHERE
        user LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    default:
      getUsersQuery = `
      SELECT
        *
      FROM
        user
      WHERE
        user LIKE '%${search_q}%';`;
  }

  data = await database.all(getUsersQuery);
  response.send(data);
});

app.get("/users/:usersId/", async (request, response) => {
  const { usersId } = request.params;

  const getUserQuery = `
    SELECT
      *
    FROM
      user
    WHERE
      id = ${usersId};`;
  const user = await database.get(getUserQuery);
  response.send(user);
});

app.post("/users/", async (request, response) => {
  const { id, user, priority, status } = request.body;
  const postUserQuery = `
  INSERT INTO
    user (id, user, priority, status)
  VALUES
    (${id}, '${user}', '${priority}', '${status}');`;
  await database.run(postUserQuery);
  response.send("User Successfully Added");
});

app.put("/users/:usersId/", async (request, response) => {
  const { userId } = request.params;
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
      updateColumn = "User";
      break;
  }
  const previousUserQuery = `
    SELECT
      *
    FROM
      user
    WHERE 
      id = ${userId};`;
  const previousUser = await database.get(previousUserQuery);

  const {
    user = previousUser.user,
    priority = previousUser.priority,
    status = previousUser.status,
  } = request.body;

  const updateUserQuery = `
    UPDATE
      user
    SET
      user='${user}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${userId};`;

  await database.run(updateUserQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/users/:userId/", async (request, response) => {
  const { userId } = request.params;
  const deleteUserQuery = `
  DELETE FROM
    user
  WHERE
    id = ${userId};`;

  await database.run(deleteUserQuery);
  response.send("User Deleted");
});

module.exports = app;
