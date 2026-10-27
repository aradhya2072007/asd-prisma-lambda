const express = require("express");
const usersRouter = require("./routes/users.routes");
const postsRouter = require("./routes/posts.routes");

const app = express();
app.use(express.json());
app.get("/health", (_req, res) => res.status(200).json({ status: "OK" }));
app.use("/users", usersRouter);
app.use("/posts", postsRouter);

const port = Number(process.env.PORT || 3000);
if (require.main === module) {
  app.listen(port, () => console.log(`Server started on port ${port}`));
}

module.exports = app;
