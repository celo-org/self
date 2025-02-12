import {
  ArgumentsDisclose,
  ArgumentsProveOffChain,
  ArgumentsProveOnChain,
  ArgumentsRegister,
  Mode,
  SelfAppPartial,
  SelfApp
} from '../../../common/src/utils/appType';
import {
  DEFAULT_RPC_URL,
  countryNames,
} from '../../../common/src/constants/constants';
import { UserIdType } from '../../../common/src/utils/circuits/uuid';
import { AttestationVerifier } from './AttestationVerifier';
export class SelfVerifier extends AttestationVerifier {

  constructor(
    scope: string,
    rpcUrl: string = DEFAULT_RPC_URL,
    registryContractAddress: `0x${string}`,
    verifyAllContractAddress: `0x${string}`,
  ) {
    super(
      rpcUrl,
      registryContractAddress,
      verifyAllContractAddress,
    );
    this.scope = scope;
  }

  setTargetRootTimestamp(targetRootTimestamp: number): this {
    this.targetRootTimestamp = targetRootTimestamp;
    return this;
  }

  setMinimumAge(age: number): this {
    if (age < 10) {
      throw new Error('Minimum age must be at least 10 years old');
    }
    if (age > 100) {
      throw new Error('Minimum age must be at most 100 years old');
    }
    this.minimumAge = { enabled: true, value: age.toString() };
    return this;
  }

  setNationality(country: (typeof countryNames)[number]): this {
    this.nationality = { enabled: true, value: country };
    return this;
  }

  discloseNationality(): this {
    this.setNationality('Any');
    return this;
  }

  excludeCountries(...countries: (typeof countryNames)[number][]): this {
    this.excludedCountries = { enabled: true, value: countries };
    return this;
  }

  enablePassportNoOfacCheck(): this {
    this.passportNoOfac = true;
    return this;
  }

  enableNameAndDobOfacCheck(): this {
    this.nameAndDobOfac = true;
    return this;
  }

  enableNameAndYobOfacCheck(): this {
    this.nameAndYobOfac = true;
    return this;
  }

  // TODO: related to the qr code
  // getIntent(
  //   appName: string,
  //   userId: string,
  //   userIdType: UserIdType,
  //   sessionId: string,
  //   websocketUrl: string = WEBSOCKET_URL
  // ): string {
  //   const intent_raw: SelfAppPartial = {
  //     appName: appName,
  //     scope: this.scope,
  //     websocketUrl: websocketUrl,
  //     sessionId: sessionId,
  //     userId: userId,
  //     userIdType: userIdType,
  //     devMode: this.devMode,
  //   };

  //   let selfArguments: ArgumentsProveOffChain | ArgumentsRegister;
  //       const argsVcAndDisclose: ArgumentsDisclose = {
  //         disclosureOptions: {
  //           minimumAge: this.minimumAge,
  //           nationality: this.nationality,
  //           excludedCountries: this.excludedCountries,
  //           ofac: this.ofac,
  //       };
  //       selfArguments = argsVcAndDisclose;
  //   }

  //   const intent: SelfApp = {
  //     ...intent_raw,
  //     args: selfArguments,
  //   };
  //   const encoded = msgpack.encode(intent);
  //   try {
  //     const compressedData = pako.deflate(encoded);
  //     return btoa(String.fromCharCode(...new Uint8Array(compressedData)));
  //   } catch (err) {
  //     console.error(err);
  //     return '';
  //   }
  // }
}
