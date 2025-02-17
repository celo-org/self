import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import hre from "hardhat";
import fs from "fs";
import path from "path";
import { ethers } from "ethers";

export default buildModule("UpdatePCR0", (m) => {
    const networkName = hre.network.config.chainId;
    const journalPath = path.join(__dirname, "../../deployments", `chain-${networkName}`, "journal.jsonl");

    // Read and parse the journal file
    const journal = fs.readFileSync(journalPath, "utf8")
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line));

    // Find the deployment result entry
    const deploymentResult = journal.find(entry =>
        entry.type === "DEPLOYMENT_EXECUTION_STATE_COMPLETE" &&
        entry.futureId === "DeployPCR0#PCR0Manager"
    );

    if (!deploymentResult?.result?.address) {
        throw new Error("PCR0Manager address not found in journal. Please deploy PCR0Manager first.");
    }

    const pcr0Address = deploymentResult.result.address;
    const pcr0Manager = m.contractAt("PCR0Manager", pcr0Address);

    // Create a zero-filled hex string
    const zeroPcr0 = "0x" + "0".repeat(96);

    // Add the zero PCR0 value
    m.call(pcr0Manager, "addPCR0", [zeroPcr0]);

    return {};
});