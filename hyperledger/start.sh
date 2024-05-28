#/bin/sh

# Start the Hyperledger Fabric network
cd network
# echo "=============================Starting the Hyperledger Fabric network============================="
# echo "====================Shutting down the network===================="
./network.sh down
echo "====================Starting the network===================="

./network.sh up createChannel

echo "====================Deploying the chaincode===================="
# ./../../chaincode/chaincode.sh

# OR 

./network.sh deployCC -ccn basic -ccp ../../chaincode -ccl go 

rm basic.tar.gz
# ./network.sh deployCC -ccn basic -ccp ../../../Hyperledger-IPFS/chaincode/ -ccl go