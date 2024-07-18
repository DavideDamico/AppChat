// #region ::: IMPORTS :::
import express, { Request, Response } from "express";
import { createClient } from "@vercel/postgres";
import { config } from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
// #endregion

// #region ::: CONFIGURATION :::
config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const client = createClient({
  connectionString: process.env.DATABASE_URL,
});

client.connect();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// #endregion

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("message-sent", (message) => {
    client.query(
      `INSERT INTO messages (content) VALUES ($1)`,
      [message],
      (error) => {
        if (!error) io.emit("message-received", message);
      }
    );
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

app.get("/api/messages", (req: Request, res: Response) => {
  client.query("SELECT * FROM messages", (error, response) => {
    if (error) res.status(500).json({ error });
    else res.status(200).json(response.rows);
  });
});

app.post("/api/messages", (req: Request, res: Response) => {
  const { content } = req.body;
  client.query(
    `INSERT INTO messages (content) VALUES ($1)`,
    [content],
    (error) => {
      if (error) res.status(500).json({ error });
      else res.status(200).json({ message: "Message added" });
    }
  );
});

app.listen(8080, () => {
  console.log(`Server is running on http://localhost:${8080}/api/messages`);
});

server.listen(3000, () => {
  console.log(`Server is running on http://localhost:${3000}/api/messages`);
});
