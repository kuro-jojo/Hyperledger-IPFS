#/bin/sh

cd network
echo "=============================Cleaning the Hyperledger Fabric network============================="
echo "====================Shutting down the network===================="
./network.sh down

echo "====================Removing the chaincode===================="
rm -rf ../../chaincode/vendor