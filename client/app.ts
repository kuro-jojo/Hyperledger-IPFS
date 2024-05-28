import express, { Request, Response } from "express";
import path, { dirname } from 'path';
import { UploadToIPFS } from './src/ipfs.js'
import { Asset, AssetTransfert } from './src/assetTransfer.js';
import multer from 'multer';

const __dirname = dirname(process.cwd() + '/client')
const app = express();

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, __dirname + '/uploads/');
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.get("/", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get("/add", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public/add.html'));
});

app.get("/all", (req: Request, res: Response) => {
    const assetTransfer: AssetTransfert = new AssetTransfert();
    assetTransfer.GetAllAssets().then((assets) => {
        // jsonify the assets
        return res.status(200).json(assets);
    }).catch((error) => {
        console.log(error);
        return res.status(500).json({ message: 'Error while getting assets' });
    });
});

app.post('/add', async function (req, res) {
    try {
        if (req.file) {
            const result = await UploadToIPFS(req.file)
            if (!result) {
                return res.status(400).json({ message: 'Error while uploading file to IPFS' });
            }
            const owner = req.body.owner;
            const schoolName = req.body.schoolName;
            const asset: Asset = {
                Owner: owner,
                SchoolName: schoolName,
                Hash: result.cid.toString(),
            };
            // Create a new asset in the blockchain
            const assetTransfer: AssetTransfert = new AssetTransfert();
            await assetTransfer.CreateAsset(asset).then(() => {
                console.log('Asset created successfully');
            }
            );

            const assetJson = JSON.stringify(asset, null, 2);
            return res.status(201).json({ asset: assetJson });
        }
    } catch (error: any) {
        // handle error
        console.log(error);
        return res.status(400).json({ message: error.message });
    }
});

app.listen(3000, function () {
    console.log('App is listening on port 3000!');
});