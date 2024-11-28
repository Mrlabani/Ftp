const express = require("express");
const bodyParser = require("body-parser");
const ftp = require("ftp");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(bodyParser.json());

let client;

// Connect to FTP Server
app.post("/api/connect", (req, res) => {
  const { host, port, username, password } = req.body;

  client = new ftp();
  client.on("ready", () => res.status(200).json({ message: "Connected successfully" }));

  client.on("error", (err) => res.status(500).json({ error: err.message }));

  client.connect({ host, port, user: username, password });
});

// List Files and Folders
app.get("/api/list", (req, res) => {
  if (!client) return res.status(400).json({ error: "Not connected to any FTP server" });

  client.list((err, list) => {
    if (err) return res.status(500).json({ error: err.message });

    const files = list.map((file) => ({
      name: file.name,
      type: file.type === "d" ? "Folder" : "File",
      size: file.size,
    }));
    res.json(files);
  });
});

// Create a Folder
app.post("/api/create-folder", (req, res) => {
  const { folderName } = req.body;

  if (!client) return res.status(400).json({ error: "Not connected to any FTP server" });

  client.mkdir(folderName, true, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: "Folder created successfully" });
  });
});

// Rename File/Folder
app.post("/api/rename", (req, res) => {
  const { oldName, newName } = req.body;

  if (!client) return res.status(400).json({ error: "Not connected to any FTP server" });

  client.rename(oldName, newName, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: "Renamed successfully" });
  });
});

// Delete File/Folder
app.post("/api/delete", (req, res) => {
  const { fileName } = req.body;

  if (!client) return res.status(400).json({ error: "Not connected to any FTP server" });

  client.delete(fileName, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: "Deleted successfully" });
  });
});

// Download File
app.get("/api/download", (req, res) => {
  const { file } = req.query;

  if (!client) return res.status(400).json({ error: "Not connected to any FTP server" });

  const localPath = path.join(__dirname, "downloads", file);

  client.get(file, (err, stream) => {
    if (err) return res.status(500).json({ error: err.message });

    stream.once("close", () => res.download(localPath, file));
    stream.pipe(fs.createWriteStream(localPath));
  });
});

// Disconnect from FTP Server
app.get("/api/disconnect", (req, res) => {
  if (!client) return res.status(400).json({ error: "Not connected to any FTP server" });

  client.end();
  res.status(200).json({ message: "Disconnected successfully" });
});

// Start the Server
const PORT = process.env.PORT || 3000; // Use environment port
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
