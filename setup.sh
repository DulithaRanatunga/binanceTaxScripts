#/bin/bash

# I thought i' might need to run npm link in each of these
# too, but it doesnt seem to be the case :/

echo "Running npm install in each directory"
cd utils && npm install
cd ..
cd stakingInterest && npm install 
cd ..
cd tradesInAud && npm install

echo "Done."