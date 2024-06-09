import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Gateway, Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { TextDecoder } from 'util';

export interface Asset {
    ID?: string
    Date?: Date
    Hash: string
    Owner: string
    SchoolName: string
}

export class AssetTransfert {
    public async GetAllAssets(): Promise<Asset[]> {
        return await GetAllAssets();
    }

    public async CreateAsset(asset: Asset): Promise<void> {
        return await CreateAsset(asset);
    }

    public async UpdateAsset(asset: Asset): Promise<void> {
        return await UpdateAsset(asset);
    }

    public async GetAsset(assetID: string): Promise<Asset | null> {
        return await GetAsset(assetID);
    }

}
const __dirname = path.dirname(process.cwd())

const channelName = envOrDefault('CHANNEL_NAME', 'mychannel');
const chaincodeName = envOrDefault('CHAINCODE_NAME', 'basic');
const mspId = envOrDefault('MSP_ID', 'Org1MSP');

// Path to crypto materials.
const cryptoPath = envOrDefault('CRYPTO_PATH', path.resolve(__dirname, 'hyperledger', 'network', 'organizations', 'peerOrganizations', 'org1.example.com'));

// Path to user private key directory.
const keyDirectoryPath = envOrDefault('KEY_DIRECTORY_PATH', path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore'));

// Path to user certificate directory.
const certDirectoryPath = envOrDefault('CERT_DIRECTORY_PATH', path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts'));

// Path to peer tls certificate.
const tlsCertPath = envOrDefault('TLS_CERT_PATH', path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt'));

// Gateway peer endpoint.
const peerEndpoint = envOrDefault('PEER_ENDPOINT', 'localhost:7051');

// Gateway peer SSL host name override.
const peerHostAlias = envOrDefault('PEER_HOST_ALIAS', 'peer0.org1.example.com');

const utf8Decoder = new TextDecoder();

async function GetGateway(): Promise<[grpc.Client, Gateway]> {
    // The gRPC client connection should be shared by all Gateway connections to this endpoint.
    const client = await newGrpcConnection();
    const gateway = connect({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
        // Default timeouts for different gRPC calls
        evaluateOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        endorseOptions: () => {
            return { deadline: Date.now() + 15000 }; // 15 seconds
        },
        submitOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        commitStatusOptions: () => {
            return { deadline: Date.now() + 60000 }; // 1 minute
        },
    });

    return [client, gateway];
}

async function GetAllAssets(): Promise<Asset[]> {

    const [client, gateway] = await GetGateway();
    let result: Asset[] = [];
    try {
        // Get a network instance representing the channel where the smart contract is deployed.
        const network = gateway.getNetwork(channelName);

        // Get the smart contract from the network.
        const contract = network.getContract(chaincodeName);

        // Return all the current assets on the ledger.
        result = await getAllAssets(contract);
    } catch (error) {
        console.error(`******** FAILED to run the application: ${error}`);

    } finally {
        gateway.close();
        client.close();
    }
    return result;
}

async function CreateAsset(asset: Asset): Promise<void> {
    const [client, gateway] = await GetGateway();

    try {
        // Get a network instance representing the channel where the smart contract is deployed.
        const network = gateway.getNetwork(channelName);

        // Get the smart contract from the network.
        const contract = network.getContract(chaincodeName);
        // Create a new asset on the ledger.
        return await createAsset(contract, asset);
    } finally {
        gateway.close();
        client.close();
    }
}
async function UpdateAsset(asset: Asset): Promise<void> {
    const [client, gateway] = await GetGateway();

    try {
        // Get a network instance representing the channel where the smart contract is deployed.
        const network = gateway.getNetwork(channelName);

        // Get the smart contract from the network.
        const contract = network.getContract(chaincodeName);
        // Create a new asset on the ledger.
        return await updateAssetAsync(contract, asset);
    } finally {
        gateway.close();
        client.close();
    }
}

async function GetAsset(assetID: string): Promise<Asset | null> {
    const [client, gateway] = await GetGateway();
    try {
        // Get a network instance representing the channel where the smart contract is deployed.
        const network = gateway.getNetwork(channelName);

        // Get the smart contract from the network.
        const contract = network.getContract(chaincodeName);

        // Return all the current assets on the ledger.
        return await readAssetByID(contract, assetID);
    } catch (error) {
        console.error(`******** FAILED to run the application: ${error}`);

    } finally {
        gateway.close();
        client.close();
    }
    return null;
}

async function newGrpcConnection(): Promise<grpc.Client> {
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });
}

async function newIdentity(): Promise<Identity> {
    const certPath = await getFirstDirFileName(certDirectoryPath);
    const credentials = await fs.readFile(certPath);
    return { mspId, credentials };
}

async function getFirstDirFileName(dirPath: string): Promise<string> {
    const files = await fs.readdir(dirPath);
    return path.join(dirPath, files[0]);
}

async function newSigner(): Promise<Signer> {
    const keyPath = await getFirstDirFileName(keyDirectoryPath);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}
/**
 * This type of transaction would typically only be run once by an application the first time it was started after its
 * initial deployment. A new version of the chaincode deployed later would likely not need to run an "init" function.
 */
async function initLedger(contract: Contract): Promise<void> {
    console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');

    await contract.submitTransaction('InitLedger');

    console.log('*** Transaction committed successfully');
}

/**
 * Evaluate a transaction to query ledger state.
 */
async function getAllAssets(contract: Contract): Promise<Asset[]> {
    console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');

    const resultBytes = await contract.evaluateTransaction('GetAllAssets');

    const resultJson = utf8Decoder.decode(resultBytes);
    const result: Asset[] = JSON.parse(resultJson);
    return result;
}

/**
 * Submit a transaction synchronously, blocking until it has been committed to the ledger.
 */
async function createAsset(contract: Contract, asset: Asset): Promise<void> {
    console.log('\n--> Submit Transaction: CreateAsset, creates new asset with ID, hash, owner, and school name');
    asset.ID = crypto.randomUUID();
    await contract.submitTransaction('CreateAsset', asset.ID, asset.Hash, asset.Owner, asset.SchoolName);

    console.log('*** Transaction committed successfully');
}

/**
 * Submit transaction asynchronously, allowing the application to process the smart contract response (e.g. update a UI)
 * while waiting for the commit notification.
 */
async function updateAssetAsync(contract: Contract, asset: Asset): Promise<void> {
    console.log('\n--> Submit Transaction: UpdateAsset ');
    if (!asset.ID) {
        throw new Error('Asset ID is required to update an asset');
    }
    try {
        await contract.submitTransaction(
            'UpdateAsset', asset.ID, asset.Hash, asset.Owner, asset.SchoolName,
        );
        console.log('******** FAILED to return an error');
    } catch (error) {
        console.log('*** Successfully caught the error: \n', error);
    }
}

async function readAssetByID(contract: Contract, id: string): Promise<Asset> {
    console.log('\n--> Evaluate Transaction: ReadAsset, function returns asset attributes');
    if (!id) {
        throw new Error('Asset ID is required to read an asset');
    }
    const resultBytes = await contract.evaluateTransaction('ReadAsset', id);

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);

    return result;
}


/**
 * envOrDefault() will return the value of an environment variable, or a default value if the variable is undefined.
 */
function envOrDefault(key: string, defaultValue: string) {
    return process.env[key] || defaultValue;
}

/**
 * displayInputParameters() will print the global scope parameters used by the main driver routine.
 */
async function displayInputParameters() {
    console.log(`channelName:       ${channelName}`);
    console.log(`chaincodeName:     ${chaincodeName}`);
    console.log(`mspId:             ${mspId}`);
    console.log(`cryptoPath:        ${cryptoPath}`);
    console.log(`keyDirectoryPath:  ${keyDirectoryPath}`);
    console.log(`certDirectoryPath: ${certDirectoryPath}`);
    console.log(`tlsCertPath:       ${tlsCertPath}`);
    console.log(`peerEndpoint:      ${peerEndpoint}`);
    console.log(`peerHostAlias:     ${peerHostAlias}`);
}