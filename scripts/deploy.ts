import { ethers, upgrades, network } from "hardhat";
import {
  proxies,
  baseURIs,
  TablelandNetworkConfig,
} from "@tableland/evm/network";

async function main() {
  // Get the Tableland registry address for the current network
  const registryAddress =
    network.name === "localhost"
      ? proxies["local-tableland" as keyof TablelandNetworkConfig]
      : proxies[network.name as keyof TablelandNetworkConfig];
  // Get the baseURI with only the endpoint `/api/v1/` instead of an appended `/tables`
  let baseURI =
    network.name === "localhost"
      ? baseURIs["local-tableland" as keyof TablelandNetworkConfig]
      : baseURIs[network.name as keyof TablelandNetworkConfig];
  baseURI = baseURI.match(/^https?:\/\/[^\/]+\/[^\/]+\/[^\/]+\/?/)![0];

  if (!registryAddress)
    throw new Error("cannot get registry address for " + network.name);
  if (!baseURI) throw new Error("cannot get base URI for " + network.name);

  // Deploy the Canvas contract.
  const CanvasGame = await ethers.getContractFactory("CanvasGame");
  const canvasGame = await upgrades.deployProxy(
    CanvasGame,
    [baseURI, "not.implemented.com"],
    {
      kind: "uups",
    }
  );
  await canvasGame.deployed();
  // Check upgradeability.
  console.log("Proxy deployed to:", canvasGame.address, "on", network.name);
  const impl = await upgrades.erc1967.getImplementationAddress(
    canvasGame.address
  );
  console.log("^Add this to your 'hardhat.config.ts' file's 'deployments'");
  console.log("New implementation address:", impl);

  // Run post deploy table creation.
  console.log("\nRunning post deploy...");
  // Create our metadata table
  let tx = await canvasGame.createMetadataTable();
  let receipt = await tx.wait();
  const tableId = receipt.events[0].args.tokenId;
  console.log("Metadata table ID:", tableId.toString());

  // For fun—test minting and making a move.
  const accounts = await ethers.getSigners();
  tx = await canvasGame.connect(accounts[0]).safeMint(accounts[0].address);
  receipt = await tx.wait();
  const [, transferEvent] = (await receipt.events) ?? [];
  const tokenId = await transferEvent.args!.tokenId;
  console.log("Token ID:", ethers.BigNumber.from(tokenId).toNumber());

  // Query all table values after mutating.
  // Note the `makeMove` method's SQL:
  // UPDATE canvas_{chainId}_{tokenId} SET x = ${x}, y = ${y} WHERE id = ${tokenId};
  await canvasGame
    .connect(accounts[0])
    .makeMove(ethers.BigNumber.from(tokenId).toNumber(), 10, 10); // (tokenId, x, y)
  await tx.wait();
  // Query all table values after mutating.
  const gateway = await canvasGame.metadataURI();
  console.log(`\nCheck out the mutated table data:`);
  console.log(gateway);
  // Get the specific token's URI.
  const tokenURI = await canvasGame.tokenURI(tokenId);
  console.log(`And the specific token's URI:`);
  console.log(tokenURI);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
