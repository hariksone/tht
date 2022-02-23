# Token and sale smart contract + simple frontend
Smart contract with token lock periods
# Migrating
1. `npm install`
2. `truffle migrate --reset --network {NETWORK NAME}`
3. `truffle run verify ThtSale --network {NETWORK NAME}` (optional verify source code)
4. Copy compiled contracts to ./client/abi/token.json and ./client/abi/contract.json
5. Change contract address in ./client/main.js