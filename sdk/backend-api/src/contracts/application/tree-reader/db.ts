import { Pool } from 'pg';
import { EventsData } from "./constants";

// Create a new pool instance
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});
console.log({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});
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
        const result = await pool.query(query, [type]);

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
                await client.query(query, [
                    type,
                    event.index,
                    event
                ]);
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
        const query = 'SELECT tree_data FROM trees WHERE type = $1';
        const result = await pool.query(query, [type]);

        if (result.rows.length === 0) return null;
        return result.rows[0].tree_data;
    } catch (error) {
        console.error('Error getting tree:', error);
        return null;
    }
}

/// @notice set the tree in the db, we only need to store the latest tree in the db and update it's value
export async function setTreeInDB(type: string, tree: string) {
    try {
        const query = `
            INSERT INTO trees (type, tree_data)
            VALUES ($1, $2)
            ON CONFLICT (type) 
            DO UPDATE SET 
                tree_data = $2,
                updated_at = CURRENT_TIMESTAMP
        `;
        await pool.query(query, [type, tree]);
        return true;
    } catch (error) {
        console.error('Error setting tree:', error);
        return false;
    }
}

