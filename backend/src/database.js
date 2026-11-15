
const Database = require("better-sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "..", "aquasense.db");
const db = new Database(databasePath);

// Create the readings table if it does not exist.
db.exec(`
  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deviceId TEXT NOT NULL,
    flowRateLpm REAL NOT NULL,
    pulseCount INTEGER DEFAULT 0,
    intervalMs INTEGER,
    totalLitres REAL,
    uptimeMs INTEGER,
    rssi INTEGER,
    sensorStatus TEXT DEFAULT 'online',
    receivedAt TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Detect existing database columns before applying migrations.
const existingColumns = db
  .prepare("PRAGMA table_info(readings)")
  .all()
  .map((column) => column.name);

// Preserve compatibility with existing databases.
if (!existingColumns.includes("source")) {
  db.exec(`
    ALTER TABLE readings
    ADD COLUMN source TEXT NOT NULL DEFAULT 'physical'
  `);
}

if (!existingColumns.includes("pressureBar")) {
  db.exec(`
    ALTER TABLE readings
    ADD COLUMN pressureBar REAL
  `);
}

if (!existingColumns.includes("pressureMode")) {
  db.exec(`
    ALTER TABLE readings
    ADD COLUMN pressureMode TEXT NOT NULL DEFAULT 'simulated'
  `);
}

// New column: identifies the simulator scenario.
// Existing records remain intact and receive NULL.
if (!existingColumns.includes("scenario")) {
  db.exec(`
    ALTER TABLE readings
    ADD COLUMN scenario TEXT DEFAULT NULL
  `);
}

console.log("AquaSense database initialized.");

module.exports = db;
