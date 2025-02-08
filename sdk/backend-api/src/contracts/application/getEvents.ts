import { getContractInstance } from "./getContracts";
import { getChain } from "./chains";
import { createPublicClient, http, Log, decodeEventLog } from "viem";

export type DscCommitmentEvent = {
    index: number;
    commitment: bigint;
    merkleRoot: bigint;
    blockNumber: number;
    timestamp: number;
}

async function getEvents(
    eventName: string,
    startBlock: number,
    rpcUrl: string,
    network: string
): Promise<DscCommitmentEvent[]> {
    try {
        const chain = getChain(network);
        const { contract, publicClient } = getContractInstance(
            "registry",
            chain,
            process.env.PRIVATE_KEY as `0x${string}`,
            rpcUrl
        );

        console.log('Getting events with params:', {
            address: contract.address,
            eventName,
            startBlock,
            network
        });

        const logs = await publicClient.getContractEvents({
            address: contract.address,
            abi: contract.abi,
            eventName: eventName,
            fromBlock: BigInt(startBlock),
            toBlock: 'latest',
            strict: true
        });

        console.log(`Found ${logs.length} ${eventName} events`);

        const events: DscCommitmentEvent[] = [];

        for (const log of logs) {
            try {
                if (!log.blockNumber) continue;

                const { commitment, imtIndex, imtRoot } = log.args as {
                    commitment: bigint,
                    imtIndex: bigint,
                    imtRoot: bigint
                };

                const block = await publicClient.getBlock({
                    blockNumber: log.blockNumber
                });

                events.push({
                    index: Number(imtIndex),
                    commitment,
                    merkleRoot: imtRoot,
                    blockNumber: Number(log.blockNumber),
                    timestamp: Number(block.timestamp)
                });
            } catch (error) {
                console.error(`Error processing log for ${eventName}:`, error);
            }
        }

        return events;
    } catch (error) {
        console.error(`Error getting ${eventName} events:`, error);
        throw error;
    }
}

export async function getDscCommitmentEvents(
    startBlock: number = 7649934,
    rpcUrl: string,
    network: string
): Promise<DscCommitmentEvent[]> {
    const [devEvents, regularEvents] = await Promise.all([
        getEvents('DevDscKeyCommitmentRegistered', startBlock, rpcUrl, network),
        getEvents('DscKeyCommitmentRegistered', startBlock, rpcUrl, network)
    ]);

    return [...devEvents, ...regularEvents].sort((a, b) =>
        a.blockNumber === b.blockNumber
            ? a.index - b.index
            : a.blockNumber - b.blockNumber
    );
}
