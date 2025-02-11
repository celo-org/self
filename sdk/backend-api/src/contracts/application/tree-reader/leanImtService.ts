import { LeanIMT } from "@openpassport/zk-kit-lean-imt";
import { poseidon2 } from "poseidon-lite";
import { getContractInstanceRoot } from "./getTree";
import { addEventsInDB, setTreeInDB, getLastEventBlockFromDB, getTreeFromDB } from "./db";
import { getDscCommitmentEvents } from "../getEvents";
import { DEPLOYMENT_BLOCK, EventsData } from "./constants";

export class MerkleTreeService {
    private imt: LeanIMT;
    private type: string;
    constructor(type: 'dscKeyCommitment' | 'dscKeyCommitment') {
        this.type = type;
        this.imt = new LeanIMT((a, b) => poseidon2([a, b]));
        this.initializeTree();
    }

    private async initializeTree() {
        const treeFromDB = await getTreeFromDB(this.type);
        console.log('treeFromDB', treeFromDB);
        if (treeFromDB) {
            const hashFunction = (a: any, b: any) => poseidon2([a, b]);
            const tree = LeanIMT.import(hashFunction, treeFromDB);
            this.imt = tree;
        }
        await this.checkForUpdates();
    }

    private insertCommitment(commitment: string) {
        this.imt.insert(BigInt(commitment));
    }

    public getRoot(): string {
        if (this.imt.root === undefined) {
            return '0';
        }
        else {
            return this.imt.root.toString();
        }
    }

    private serializeTree() {
        return this.imt.export();
    }

    private async checkForEvents() {
        let lastEventBlock: any = await getLastEventBlockFromDB(this.type);
        console.log('lastEventBlock', lastEventBlock);
        if (!lastEventBlock) {
            lastEventBlock = DEPLOYMENT_BLOCK;
        }

        console.log('\n=== Processing Events ===');
        const events: EventsData[] = await getDscCommitmentEvents(lastEventBlock, process.env.RPC_URL as string, process.env.NETWORK as string);
        console.log('Total events to process:', events.length);

        for (const event of events) {
            console.log('Processing commitment:', event.commitment.toString());
            this.insertCommitment(event.commitment.toString());
        }

        const contractRoot = await getContractInstanceRoot(this.type);
        const localRoot = this.getRoot().toString();
        console.log('\n=== Root Comparison ===');
        console.log('Contract Root:', contractRoot);
        console.log('Local Root:', localRoot);

        if (contractRoot === localRoot) {
            console.log('\n=== Starting DB Updates ===');
            try {
                console.log('Adding events to DB...');
                const eventsAdded = await addEventsInDB(this.type, events);
                console.log('Events added successfully:', eventsAdded);

                console.log('Serializing tree...');
                const serializedTree = this.serializeTree();
                console.log('Tree serialized, length:', serializedTree.length);

                console.log('Setting tree in DB...');
                const treeSet = await setTreeInDB(this.type, serializedTree);
                console.log('Tree set in DB:', treeSet);
            } catch (error) {
                console.error('Error during DB updates:', error);
                throw error;
            }
        } else {
            throw new Error('Root does not match after updating the tree');
        }
    }

    private async checkForUpdates() {
        const contractRoot = await getContractInstanceRoot(this.type);
        if (contractRoot !== this.getRoot()) {
            console.log('Root are different, checking for events');
            await this.checkForEvents();
        }
    }

    public async getTree() {
        await this.checkForUpdates();
        return this.serializeTree();
    }
}
