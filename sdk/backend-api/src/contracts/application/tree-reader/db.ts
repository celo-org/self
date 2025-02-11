import { Pool } from 'pg';
import { EventsData } from "./constants";

// Create a new pool instance with persistent settings
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: {
        // For encrypted connections—if you want full TLS verification, uncomment these lines:
        // rejectUnauthorized: true,
        // ca: fs.readFileSync("path/to/rds-ca-2019-root.pem").toString(),
        rejectUnauthorized: false,
    },
    keepAlive: true,                // Keep the underlying TCP connection alive
    idleTimeoutMillis: 30000,       // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000,  // Fail if a new connection isn't established within 2000ms
});

// Listen for unexpected errors on idle clients and log them
pool.on("error", (err, client) => {
    console.error("Unexpected error on idle client", err);
});

// Helper function that will retry queries if they fail transiently
async function queryWithRetry(
    query: string,
    params: any[] = [],
    retries = 3,
    delayMs = 1000
) {
    try {
        return await pool.query(query, params);
    } catch (error) {
        if (retries > 0) {
            console.error(
                `Query failed. Retrying in ${delayMs}ms... Attempts left: ${retries}`,
                error
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            return queryWithRetry(query, params, retries - 1, delayMs);
        } else {
            console.error("Query failed after retries.", error);
            throw error;
        }
    }
}

/// @notice retrieve the event with the highest index from the db and return the block number
export async function getLastEventBlockFromDB(type: string) {
    try {
        const query = `
            SELECT event_data->>'blockNumber' as block_number 
            FROM events 
            WHERE type = $1 
            ORDER BY event_index DESC 
            LIMIT 1
        `;
        const result = await queryWithRetry(query, [type]);

        if (result.rows.length === 0) return null;
        return parseInt(result.rows[0].block_number);
    } catch (error) {
        console.error('Error getting last event block:', error);
        return null;
    }
}

/// @notice add the events to the db, be careful this app will could try to overwrite the events
export async function addEventsInDB(type: string, events: EventsData[]) {
    try {
        // Start a transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const event of events) {
                const query = `
                    INSERT INTO events (type, event_index, event_data)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (type, event_index) DO NOTHING
                `;
                const result = await client.query(query, [
                    type,
                    event.index,
                    event
                ]);
                console.log('event result', result);
            }

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error adding events:', error);
        return false;
    }
}

/// @notice retrieve the tree from the db
export async function getTreeFromDB(type: string) {
    try {
        console.log("\n=== Reading Tree from DB ===");
        console.log("Type:", type);

        const query = 'SELECT tree_data FROM trees WHERE type = $1';
        const result = await queryWithRetry(query, [type]);

        console.log("DB Read Result:", {
            rowCount: result.rowCount,
            hasData: result.rows.length > 0
        });

        if (result.rows.length === 0) return null;
        return result.rows[0].tree_data;
    } catch (error) {
        console.error("\n=== Error Reading Tree from DB ===");
        console.error("Type:", type);
        console.error("Error:", error);
        return null;
    }
}

/// @notice set the tree in the db, we only need to store the latest tree in the db and update it's value
export async function setTreeInDB(type: string, tree: string) {
    try {
        console.log("\n=== Writing Tree to DB ===");
        console.log("Type:", type);
        console.log("Tree length:", tree?.length || 0);
        console.log("Tree preview:", tree?.substring(0, 100) + "...");

        const query = `
            INSERT INTO trees (type, tree_data)
            VALUES ($1, $2)
            ON CONFLICT (type) 
            DO UPDATE SET 
                tree_data = $2,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;

        const result = await queryWithRetry(query, [type, tree]);
        console.log("DB Write Result:", {
            rowCount: result.rowCount,
            rows: result.rows
        });
        return true;
    } catch (error) {
        console.error("\n=== Error Writing Tree to DB ===");
        console.error("Type:", type);
        console.error("Error:", error);
        return false;
    }
}

// Add this function to periodically ping the DB
function startKeepAlive(intervalMs: number = 5 * 60 * 1000) { // default every 5 minutes
    setInterval(async () => {
        try {
            await queryWithRetry("SELECT 1");
            console.log('Database ping successful');
        } catch (error) {
            console.error('Database ping failed', error);
        }
    }, intervalMs);
}

// Start the keep-alive when your module initializes
startKeepAlive();

