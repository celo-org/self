import dotenv from "dotenv";
import { getContractInstance } from "./getContracts";
import { getChain } from "./chains";

dotenv.config();

const network = process.env.NETWORK as string;
const chain = getChain(network);

export class PassportVerifier extends ProofVerifier {

}
