const dotenv = require("dotenv");
dotenv.config();

const app = require("./src/app");
const sequelize = require("./src/config/database");

const PORT = process.env.PORT || 8000;

let server;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ force: false });
      console.log("All models were synchronized successfully.");
    }

    server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Access the application at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database or start server:", error);
    process.exit(1);
  }
}

const gracefulShutdown = () => {
  console.log("\nShutting down gracefully...");
  server.close(async () => {
    console.log("HTTP server closed.");
    try {
      await sequelize.close();
      console.log("Database connections closed.");
      process.exit(0);
    } catch (err) {
      console.error("Error closing database connections:", err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error("Forcing shutdown due to timeout...");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

startServer();
