import { EventsData } from "./constants";

/// @notice retrieve the event with the highest index from the db and return the block number
export async function getLastEventBlockFromDB(type: string) {
    try {
        throw new Error('Not implemented');
    } catch (error) {
        console.error(error);
        return null;
    }
}

/// @notice add the events to the db, be careful this app will could try to overwrite the events
export async function addEventsInDB(type: string, events: EventsData[]) {
    try {
        throw new Error('Not implemented');
    } catch (error) {
        console.error(error);
        return false;
    }
}

/// @notice retrieve the tree from the db
export async function getTreeFromDB(type: string) {
    try {
        throw new Error('Not implemented');
    } catch (error) {
        console.error(error);
        return null;
    }
}

/// @notice set the tree in the db, we only need to store the latest tree in the db and update it's value
export async function setTreeInDB(type: string, tree: string) {
    try {
        throw new Error('Not implemented');
    } catch (error) {
        console.error(error);
        return false;
    }
}

