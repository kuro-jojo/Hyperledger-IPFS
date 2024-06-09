import express, { Request, Response } from "express";
import path, { dirname } from 'path';
import { CheckIPFS, UploadToIPFS } from './src/ipfs.js'
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
    console.log("Loading add page");
    res.sendFile(path.join(__dirname, 'public/add.html'));
});

app.get("/document", (req: Request, res: Response) => {
    console.log("Loading retrieve document page");
    res.sendFile(path.join(__dirname, 'public/get.html'));
});

app.get("/document/retrieve", (req: Request, res: Response) => {
    console.log("Retrieving document from blockchain");
    let assetID = req.query.assetID as string;

    const assetTransfer: AssetTransfert = new AssetTransfert();
    assetTransfer.GetAsset(assetID).then((asset) => {
        console.log("asset", asset);
        if (asset) {
            console.log('Asset retrieved successfully');
            const assetJson = JSON.stringify(asset, null, 2);
            return res.status(200).json({ asset: assetJson });
        } else {
            console.log('Asset not found');
            return res.status(404).json({ message: 'Asset not found' });
        }
    }).catch((error) => {
        console.log(error);
        return res.status(500).json({ message: 'Error while getting asset' });
    });
});

app.get("/all", (req: Request, res: Response) => {
    console.log("Loading all assets from blockchain");
    const assetTransfer: AssetTransfert = new AssetTransfert();
    assetTransfer.GetAllAssets().then((assets) => {
        // jsonify the assets
        return res.status(200).json(assets);
    }).catch((error) => {
        console.log(error);
        return res.status(500).json({ message: 'Error while getting assets' });
    });
});

app.post('/add', upload.single("document"), async function (req, res) {
    console.log("Adding asset to blockchain");
    try {
        if (req.file) {
            const result = await UploadToIPFS(req.file)
            if (!result) {
                return res.status(400).json({ message: 'Error while uploading file to IPFS' });
            }
            console.log('File uploaded to IPFS successfully');
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
        console.log("Error while adding asset to blockchain", error.message);
        return res.status(400).json({ message: error.message });
    }
});

app.listen(3000, function () {
    console.log('App is listening on port 3000!');

    // Check if IPFS is online
    console.log('Checking IPFS connection');
    CheckIPFS().then((result) => {
        if (result) {
            console.log('IPFS is online');
        } else {
            console.log('IPFS is offline');
            console.log("Please make sure IPFS is running on your machine");
            // exit the app
            process.exit(1);
        }
    })
});