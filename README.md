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

## Installation
1. Cloner le projet
2. Mise en place de la blockchain Hyperledger Fabric
```bash
cd hyperledger
./start.sh

```
3. Mise en place du client
```bash
cd client
npm install
npm run dev
```
