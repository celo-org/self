import elliptic from "elliptic";
import forge from 'node-forge';

const { ec: EC } = elliptic;
const rpcUrl =
    "ws://ad3c378249c1242619c12616bbbc4036-28818039163c2199.elb.eu-west-1.amazonaws.com:8888/";
const wsUrl =
    "ws://ad3c378249c1242619c12616bbbc4036-28818039163c2199.elb.eu-west-1.amazonaws.com:8890/";

const good_inputs = {
}


function encryptAES256GCM(plaintext: string, key: forge.util.ByteStringBuffer) {
    // Generate a random 12-byte IV
    const iv = forge.random.getBytesSync(12);

    // Create cipher
    const cipher = forge.cipher.createCipher('AES-GCM', key);
    cipher.start({
        iv: iv,
        tagLength: 128 // Set authentication tag length to 128 bits
    });

    // Update the cipher with data and finalize
    cipher.update(forge.util.createBuffer(plaintext, 'utf8'));
    cipher.finish();

    // Get encrypted data and authentication tag
    const encrypted = cipher.output.getBytes();
    const authTag = cipher.mode.tag.getBytes();

    return {
        nonce: Array.from(Buffer.from(iv, 'binary')),
        cipher_text: Array.from(Buffer.from(encrypted, 'binary')),
        auth_tag: Array.from(Buffer.from(authTag, 'binary')),
    };
}

const ec = new EC("p256");

const key1 = ec.genKeyPair();

const pubkey =
    key1.getPublic().getX().toString("hex").padStart(64, "0") +
    key1.getPublic().getY().toString("hex").padStart(64, "0");
const helloBody = {
    jsonrpc: "2.0",
    method: "openpassport_hello",
    id: 1,
    params: {
        user_pubkey: [4, ...Array.from(Buffer.from(pubkey, "hex"))],
    },
};

const circuitNames = [
    "registerSha1Sha256Sha256Rsa655374096",
    "registerSha256Sha256Sha256EcdsaBrainpoolP256r1",
];

export async function firePayload(inputs: any, timeoutMs = 1200000) {
    const ws = new WebSocket(rpcUrl);
    let ws2: WebSocket | null = null;

    ws.addEventListener("open", () => {
        console.log("Connected to rpc");
        console.log("Sending hello body:", helloBody);
        ws.send(JSON.stringify(helloBody));
    });

    ws.addEventListener("message", async (event) => {
        try {
            const result = JSON.parse(event.data);
            console.log("Received message:", result);

            if (result.result?.pubkey !== undefined) {
                const serverPubkey = result.result.pubkey;
                console.log("Server pubkey:", serverPubkey);

                const key2 = ec.keyFromPublic(serverPubkey, "hex");
                const sharedKey = key1.derive(key2.getPublic());

                console.log("Generated shared key");

                // Convert the shared key to forge buffer for encryption
                const forgeKey = forge.util.createBuffer(
                    Buffer.from(sharedKey.toString("hex").padStart(64, "0"), "hex").toString('binary')
                );

                const encryptionData = encryptAES256GCM(
                    JSON.stringify({
                        type: "register",
                        prove: {
                            name: 'registerSha1Sha256Sha256Rsa655374096',
                            inputs: JSON.stringify(good_inputs),
                            public_inputs: JSON.stringify({}),
                        },
                    }),
                    forgeKey
                );

                const submitBody = {
                    jsonrpc: "2.0",
                    method: "openpassport_submit_request",
                    id: 1,
                    params: {
                        uuid: result.result.uuid,
                        ...encryptionData,
                    },
                };

                console.log("Sending submit body");
                const truncatedBody = {
                    ...submitBody,
                    params: {
                        uuid: submitBody.params.uuid,
                        nonce: submitBody.params.nonce.slice(0, 3) + '...',
                        cipher_text: submitBody.params.cipher_text.slice(0, 3) + '...',
                        auth_tag: submitBody.params.auth_tag.slice(0, 3) + '...'
                    }
                };
                console.log('Truncated submit body:', truncatedBody);
                ws.send(JSON.stringify(submitBody));
            } else {
                const uuid = result.result;
                console.log("Received UUID:", uuid);

                ws2 = new WebSocket(wsUrl);

                ws2.addEventListener("open", () => {
                    console.log("WS2: Connection opened");
                    ws2?.send(uuid);
                });

                ws2.addEventListener("error", (err) => {
                    console.error("WS2 error details:", {
                        error: err,
                        readyState: ws2?.readyState,
                        bufferedAmount: ws2?.bufferedAmount
                    });
                });

                ws2.addEventListener("message", (event) => {
                    const message = JSON.parse(
                        typeof event.data === 'string' ? event.data : event.data.toString()
                    );
                    console.log("WS2 message:", message);
                    if (message.new_status === 2) {
                        console.log("Proof generation completed");
                        if (ws2?.readyState === WebSocket.OPEN) ws2.close();
                        if (ws.readyState === WebSocket.OPEN) ws.close();
                    }
                });

                ws2.addEventListener("close", (event) => {
                    console.log(
                        `WS2 closed. Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`
                    );
                });
            }
        } catch (error) {
            console.error("Error processing message:", error);
            console.error("Raw message data:", event.data);
        }
    });

    ws.addEventListener("error", (error) => {
        console.error("WebSocket 1 error:", error);
    });

    ws.addEventListener("close", (event) => {
        console.log(
            `WebSocket 1 closed. Code: ${event.code}, Reason: ${event.reason}`
        );
    });

    return new Promise((resolve, reject) => {
        // Set up a timeout to reject if the request takes too long.
        const timer = setTimeout(() => {
            ws.close();
            reject(new Error(`Request timed out after ${timeoutMs} ms`));
        }, timeoutMs);

        ws.addEventListener("close", () => {
            clearTimeout(timer);
            resolve(undefined);
        });
        ws.addEventListener("error", (error) => {
            clearTimeout(timer);
            reject(error);
        });
    });
}
