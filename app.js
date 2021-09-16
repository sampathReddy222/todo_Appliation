const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
var format = require("date-fns/format");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
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

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasSpecificStatusProperty = (a) => {
  return (
    a.status === "TO DO" || a.status === "IN PROGRESS" || a.status === "DONE"
  );
};
const hasSpecificPriorityProperty = (a) => {
  return (
    a.priority === "HIGH" || a.priority === "LOW" || a.priority === "MEDIUM"
  );
};
const hasSpecificPriorityAndStatusProperties = (a) => {
  return (
    (a.status === "TO DO" ||
      a.status === "IN PROGRESS" ||
      a.status === "DONE") &&
    (a.priority === "HIGH" || a.priority === "LOW" || a.priority === "MEDIUM")
  );
};
const hasSpecificCategoryAndStatusProperties = (a) => {
  return (
    (a.category === "WORK" ||
      a.category === "HOME" ||
      a.category === "LEARNING") &&
    (a.status === "TO DO" || a.status === "IN PROGRESS" || a.status === "DONE")
  );
};
const hasSpecificCategoryProperty = (a) => {
  return (
    a.category === "WORK" || a.category === "HOME" || a.category === "LEARNING"
  );
};
const hasSpecificCategoryAndPriorityProperties = (a) => {
  return (
    (a.category === "WORK" ||
      a.category === "HOME" ||
      a.category === "LEARNING") &&
    (a.priority === "HIGH" || a.priority === "LOW" || a.priority === "MEDIUM")
  );
};

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let getTodosQuery = "";
  let todoData = null;
  const { search_q = "", priority, status, category } = request.query;
  switch (true) {
    case hasPriorityProperty(request.query) && hasStatusProperty(request.query):
      if (hasSpecificPriorityAndStatusProperties(request.query)) {
        getTodosQuery = `
                    SELECT *
                    FROM todo
                    WHERE
                    todo LIKE '%${search_q}%'
                    AND status = '${status}'
                    AND priority = '${priority}';
                    `;
      } else {
        if (hasSpecificStatusProperty(request.query) === false) {
          response.status(400);
          response.send("Invalid Todo Status");
        }
        if (hasSpecificPriorityProperty(request.query) === false) {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      }
      break;
    case hasCategoryProperty(request.query) && hasStatusProperty(request.query):
      if (hasSpecificCategoryAndStatusProperties(request.query)) {
        getTodosQuery = `
                    SELECT *
                    FROM todo
                    WHERE
                    todo LIKE '%${search_q}%'
                    AND category = '${category}'
                    AND status = '${status}';
                    `;
      } else {
        if (hasSpecificStatusProperty(request.query) === false) {
          response.status(400);
          response.send("Invalid Todo Status");
        }
        if (hasSpecificCategoryProperty(request.query) === false) {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      }
      break;
    case hasCategoryProperty(request.query) &&
      hasPriorityProperty(request.query):
      if (hasSpecificCategoryAndPriorityProperties(request.query)) {
        getTodosQuery = `
                    SELECT *
                    FROM todo
                    WHERE
                    todo LIKE '%${search_q}%'
                    AND category = '${category}'
                    AND priority = '${priority}';
                    `;
      } else {
        if (hasSpecificCategoryProperty(request.query) === false) {
          response.status(400);
          response.send("Invalid Todo Category");
        }
        if (hasSpecificPriorityProperty(request.query) === false) {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      }
      break;
    case hasStatusProperty(request.query):
      if (hasSpecificStatusProperty(request.query)) {
        getTodosQuery = `
                    SELECT *
                    FROM todo
                    WHERE
                    todo LIKE '%${search_q}%'
                    AND status = '${status}';
                    `;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriorityProperty(request.query):
      if (hasSpecificPriorityProperty(request.query)) {
        getTodosQuery = `
                SELECT *
                FROM todo
                WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}';
                `;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryProperty(request.query):
      if (hasSpecificCategoryProperty(request.query)) {
        getTodosQuery = `
                    SELECT *
                    FROM todo
                    WHERE
                    todo LIKE '%${search_q}%'
                    AND category = '${category}';
                    `;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodosQuery = `
                SELECT *
                FROM todo
                WHERE
                todo LIKE '%${search_q}%';
                `;
  }
  todoData = await db.all(getTodosQuery);
  response.send(
    todoData.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
  );
});
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `
    SELECT *
    FROM todo
    WHERE id = '${todoId}';
    `;
  const todoData = await db.get(todoQuery);
  response.send(convertDbObjectToResponseObject(todoData));
});
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const dateArray = date.split("-");
  const getAllDatesQuery = `
  SELECT due_date
  FROM todo;
  `;
  const datesArray = await db.all(getAllDatesQuery);
  try {
    var newDate = await format(
      new Date(dateArray[0], dateArray[1] - 1, dateArray[2]),
      "yyyy-MM-dd"
    );
    const newDateObject = { due_date: `${newDate}` };
    let count = 0;
    for (let newObj of datesArray) {
      if (newObj["due_date"] === newDateObject["due_date"]) {
        count = count + 1;
      }
    }
    if (count > 0) {
      const todosQuery = `
        SELECT *
        FROM todo
        WHERE due_date = '${newDate}';
        `;
      const todoData = await db.all(todosQuery);
      response.send(
        todoData.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
      );
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  } catch (error) {
    response.status(400);
    response.send("Invalid Due Date");
  }
});
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (hasSpecificStatusProperty(request.body) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (hasSpecificCategoryProperty(request.body) === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (hasSpecificPriorityProperty(request.body) == false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else {
    const postTodoQuery = `
        INSERT INTO
            todo (id, todo, priority, status, category, due_date)
        VALUES
            (${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}');`;
    await db.run(postTodoQuery);
    response.send("Todo Successfully Added");
  }
});
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  let updateTodoQuery = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      if (hasStatusProperty(requestBody)) {
        updateColumn = "Status";
        const { status } = requestBody;
        updateTodoQuery = `
                    UPDATE
                    todo
                    SET
                    status='${status}'
                    WHERE
                    id = ${todoId};`;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (hasSpecificPriorityProperty(requestBody)) {
        updateColumn = "Priority";
        const { priority } = requestBody;
        updateTodoQuery = `
                    UPDATE
                    todo
                    SET
                    priority='${priority}'
                    WHERE
                    id = ${todoId};`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      const { todo } = requestBody;
      updateTodoQuery = `
                    UPDATE
                    todo
                    SET
                    todo='${todo}'
                    WHERE
                    id = ${todoId};`;
      break;
    case requestBody.category !== undefined:
      if (hasSpecificCategoryProperty(requestBody)) {
        updateColumn = "Category";
        const { category } = requestBody;
        updateTodoQuery = `
                    UPDATE
                    todo
                    SET
                    category='${category}'
                    WHERE
                    id = ${todoId};`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      const { dueDate } = requestBody;
      const dateArray = dueDate.split("-");
      try {
        var newDate = await format(
          new Date(dateArray[0], dateArray[1] - 1, dateArray[2]),
          "yyyy-MM-dd"
        );
        updateTodoQuery = `
                    UPDATE
                    todo
                    SET
                    due_date='${newDate}'
                    WHERE
                    id = ${todoId};`;
      } catch (error) {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
