import { unlink } from 'node:fs/promises';
import { create, globSource } from 'kubo-rpc-client'


const ipfs = create();

export async function CheckIPFS(): Promise<boolean> {
    if (await ipfs.id()) {
        return true
    }
    return false
}

// Uploads a file to IPFS and returns the CID
export async function UploadToIPFS(file: Express.Multer.File) {
    console.info("Uploading file to IPFS", file.path);
    const source = globSource(process.cwd() + '/uploads', file.originalname)
    var result
    for await (const f of ipfs.addAll(source)) {
        result = f
        // remove the file after it has been uploaded
        await unlink(file.path)
    }
    return result
}