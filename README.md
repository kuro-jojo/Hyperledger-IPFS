# Groupe 1 : Évaluation du Stockage Off-Chain avec Hyperledger et IPFS
## Membres
- JonathanAssamagan ([@kuro-jojo](https://github.com/kuro-jojo))
- Ibrahima Balde ([@Ibalde2410](https://github.com/Ibalde2410))
- Saliou Samba DIAO ([@saliousambadiao](https://github.com/saliousambadiao))
- Dieynaba SOW ([@Dieynaba11](https://github.com/Dieynaba11))


# Comment exécuter le projet
## Prérequis
- Docker
- Docker-compose
- Node.js
- npm
- Go
- IPFS
- jq

## Installation
1. Cloner le projet
2. Mise en place de la blockchain Hyperledger Fabric
```bash
cd hyperledger
./start.sh

```
3. Démarrez le serveur IPFS
```bash
ipfs daemon --offline
```
4. Mise en place du client
```bash
cd ../client
npm install
npm run dev
```

## Utilisation
Ouvrir un navigateur et accéder à l'adresse `http://localhost:3000`

## Pour arrêter le projet
1. Arrêtez le serveur IPFS
2. Arrêtez le client
3. Arrêtez la blockchain Hyperledger Fabric
```bash
    cd hyperledger
    ./clean.sh
```