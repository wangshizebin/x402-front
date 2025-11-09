rm -rf dist
rm -rf x402.tar.gz
npm run build 
tar czvf x402.tar.gz dist/
scp x402.tar.gz root@154.92.16.59:/root
rm -rf x402.tar.gz
rm -rf dist