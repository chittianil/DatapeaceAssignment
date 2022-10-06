
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
  const { search_q = "", first_name, last_name } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getUsersQuery = `
      SELECT
        *
      FROM
        user
      WHERE
        user LIKE '%${search_q}%'
        AND first_name = '${first_name}'
        AND last_name = '${las}';`;
      break;
    case hasPriorityProperty(request.query):
      getUsersQuery = `
      SELECT
        *
      FROM
        user
      WHERE
        user LIKE '%${search_q}%'`;
      break;
    case hasStatusProperty(request.query):
      getUsesQuery = `
      SELECT
        *
      FROM
        user
      WHERE
        user LIKE '%${search_q}%'
        AND age = '${age}';`;
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
  const { id, first_name, last_name, company_name,city,state,zip,email, web, age } = request.body;
  const postUserQuery = `
  INSERT INTO
    user (id, first_name, last_name, company_name,city,state,zip,email, web, age)
  VALUES
    (${id}, '${first_name}', '${last_name}','${company_name}', '${city}','${state}','${zip}','${email}','${web}','${age}');`;
  await database.run(postUserQuery);
  response.send("User Successfully Added");
});

app.put("/users/:Id/", async (request, response) => {
  const { Id } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "first_name";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "last_name";
      break;
    case requestBody.user !== undefined:
      updateColumn = "age";
      break;
  }
  const previousUserQuery = `
    SELECT
      *
    FROM
      user
    WHERE 
      id = ${Id};`;
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
      id = ${Id};`;

  await database.run(updateUserQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/users/:userId/", async (request, response) => {
  const { Id } = request.params;
  const deleteUserQuery = `
  DELETE FROM
    user
  WHERE
    id = ${Id};`;

  await database.run(deleteUserQuery);
  response.send("User Deleted");
});

module.exports = app;
