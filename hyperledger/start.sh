#/bin/sh

# Start the Hyperledger Fabric network
cd network
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
echo "=============================Starting the Hyperledger Fabric network============================="
echo "====================Shutting down the network===================="
./network.sh down
echo "====================Starting the network===================="

./network.sh up createChannel

echo "====================Deploying the chaincode===================="
./../../chaincode/chaincode.sh