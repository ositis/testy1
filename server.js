javascript

const express = require('express');
const { Pool } = require('pg'); // PostgreSQL client
const basicAuth = require('express-basic-auth');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Password protection for all routes
app.use(basicAuth({
    users: { 'admin': 'MyPassword123' }, // Change this!
    challenge: true,
    unauthorizedResponse: 'Unauthorized'
}));

// PostgreSQL connection (Render will provide this)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Initialize database table
pool.query(`
    CREATE TABLE IF NOT EXISTS hotels (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE,
        lat REAL,
        lon REAL,
        amenities JSONB,
        availability JSONB,
        manager_username TEXT,
        manager_password TEXT
    )
`).then(() => {
    // Seed initial data (run once)
    const initialHotels = [
        { name: "The Grand Hotel", lat: 51.5074, lon: -0.1278, amenities: ["Free WiFi", "Swimming Pool"], availability: { "Free WiFi": true, "Swimming Pool": false }, manager_username: "grandmgr", manager_password: "pass123" }
        // Add more hotels...
    ];
    initialHotels.forEach(hotel => {
        pool.query('INSERT INTO hotels (name, lat, lon, amenities, availability, manager_username, manager_password) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (name) DO NOTHING',
            [hotel.name, hotel.lat, hotel.lon, JSON.stringify(hotel.amenities), JSON.stringify(hotel.availability), hotel.manager_username, hotel.manager_password]);
    });
});

// API to get all hotels
app.get('/api/hotels', async (req, res) => {
    const result = await pool.query('SELECT name, lat, lon, amenities, availability FROM hotels');
    res.json(result.rows.map(row => ({
        name: row.name,
        lat: row.lat,
        lon: row.lon,
        amenities: row.amenities,
        availability: row.availability
    })));
});

// API to login and verify manager
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM hotels WHERE manager_username = $1 AND manager_password = $2', [username, password]);
    if (result.rows.length > 0) {
        res.json({ success: true, hotel: result.rows[0] });
    } else {
        res.status(401).json({ success: false });
    }
});

// API to update hotel data
app.put('/api/hotels/:name', async (req, res) => {
    const { name } = req.params;
    const { amenities, availability } = req.body;
    await pool.query('UPDATE hotels SET amenities = $1, availability = $2 WHERE name = $3', [JSON.stringify(amenities), JSON.stringify(availability), name]);
    res.send('Updated');
});

app.listen(port, () => console.log(`Server running on port ${port}`));

