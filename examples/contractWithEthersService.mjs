import * as ethers from "ethers";
import { EthersService } from "../backend/services/ethersService.mjs";
import { config } from "dotenv";
config();

const service = new EthersService(process.env.PROVIDER_URL, process.env.PRIVATE_KEY);
await service.initialize();

const movesToMake = 10;
const mawAbi = [
    "constructor()",
    "function join(uint8 x, uint8 y, uint8 dir)",
    "function move(uint8 dir)",
    "function whap(address target)",
    "event PlayerJoined(address indexed player, uint256 indexed x, uint256 indexed y, uint8 dir)",
    "event PlayerMoved(address indexed player, uint256 indexed x, uint256 indexed y, uint8 dir)",
    "event PlayerAttacked(address indexed attacker, address indexed victim)",
];
const mawContract = new ethers.Contract(process.env.MAW_CONTRACT_ADDRESS, mawAbi, service.signer);

//Join
let response = await mawContract.join(123,45,0);
await response.wait().then(x => console.log(x));

//Make random moves.
for(let m = 0; m < movesToMake; m++) {
    await new Promise(r => setTimeout(r, 2000));            //2 second wait time.
    let randomDirection = Math.floor(Math.random()*4);     //Get a random direction.
    let response = await mawContract.move(randomDirection); //Do the actual move.
    await response.wait().then(x => console.log(x));        //Wait and log the transaction.
}

//Kill yourself so if you run this script again it won't crash because of double joining.
await new Promise(r => setTimeout(r, 2000));
response = await mawContract.whap(process.env.PRIVATE_KEY_ADDRESS); 
await response.wait().then(x => console.log(x));   