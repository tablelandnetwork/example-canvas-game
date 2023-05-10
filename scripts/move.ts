import { ethers, network } from "hardhat";
import { deployments } from "../hardhat.config";

async function main() {
  console.log(`\nMoving...`);

  // Ensure deployments
  if (deployments === undefined || deployments[network.name] === "") {
    throw Error(`no deployments entry for '${network.name}'`);
  }
  // Connect to the contract
  const canvasGame = await ethers.getContractAt(
    "CanvasGame",
    deployments[network.name]
  );
  const accounts = await ethers.getSigners();
  // Move your token
  const tokenId = 0; // Update with the token you own and desired x, y values
  const x = 20;
  const y = 20;
  let tx = await canvasGame
    .connect(accounts[0])
    .makeMove(ethers.BigNumber.from(tokenId).toNumber(), x, y);
  await tx.wait();
  console.log(`\nDone! Refresh the metadata URL.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
