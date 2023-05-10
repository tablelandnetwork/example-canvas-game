# Canvas Game

> Dynamic global game state controlled by user-owned game NFTs.

## Background

Tableland makes it possible for an event-driven architecture that dynamically updates NFT metadata. In this tutorial, users are able to openly mint "pixel" NFTs that mutate a global game state table. The `CanvasGame` contract owns a Tableland table and writes all mutating SQL statements, but the mutating SQL statement first check the caller's token ownership before changing any metadata values for `x` and `y` pixel coordinates on a 512x512 canvas.

A metadata table holds data for the token ID and these coordinates, allowing for ERC721 metadata to be composed:

```sql
SELECT
  json_object(
    'name', 'Token #' || id,
    'external_url', '<external_url>',
    'attributes',
    json_array(
      json_object(
        'display_type', 'number',
        'trait_type', 'x',
        'value', x
      ),
      json_object(
        'display_type', 'number',
        'trait_type', 'y',
        'value', y
      )
    )
  )
FROM
  <prefix_chainId_tableId>
WHERE
  id = <tokenId>
```

For a detailed walkthrough, [check out the docs](https://docs.tableland.xyz/tutorials/dynamic-nft-solidity).

### Project structure

If you're following along, the following outlines steps needed to recreate the structure in this repository. These steps are not needed if you simply clone or fork this repo.

First, set up a Hardhat project by creating a directory, `cd` into it, and then run the following:

```bash
npx hardhat
```

You'll need the following dependencies:

- `@tableland/evm`
- `@openzeppelin/contracts-upgradeable`

Do this will the following command:

```bash
npm i @tableland/evm @openzeppelin/contracts-upgradeable
```

And development dependencies of `@tableland/local`, `@tableland/hardhat`, and `dotenv`:

```bash
npm i -D @tableland/local @tableland/hardhat dotenv
```

From there, the `contracts/Lock.sol` (and the contract name) should be changed to `contracts/CanvasGame.sol`, and four scripts should be created in the `scripts` directory:

- `deploy.ts`
- `move.ts`
- `upgrade.ts`
- `verify.ts`

Be sure to also update the `config` object in `hardhat.config.ts` with information needed for the Tableland Hardhat plugin.

```js
// ...
localTableland: {
  silent: false,
  verbose: false,
},
// ...
```

The linked tutorial on the docs site walks through the rest of the setup and code.

## Usage

If you're simply cloning this repo, first, install dependencies with `npm`:

```bash
npm install
```

You'll also want to ensure you `.env` variables set up—copy the `.env.example` into `.env` and update the placeholders if you plan to deploy to a live network, such as Polygon Mumbai: `POLYGON_MUMBAI_PRIVATE_KEY`, `POLYGON_MUMBAI_API_KEY`, and `POLYGONSCAN_API_KEY`.

If you are developing locally, you'll first want to start a local Hardhat and Tableland node:

```bash
npx hardhat node --network local-tableland
```

Then, you can run the deploy script—**be sure to update the `deployments`** variable in `hardhat.config.ts` with the value logged in the script:

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

That is, update this with your data:

```js
export const deployments: { [key: string]: string } = {
  localhost: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707", // If it's the first deployed contract, this is deterministic
  maticmum: "", // Update this with your proxy contract deployment
  // And/or, add a different network key
};
```

The following scripts are also available:

- `move.ts`: Move your owned pixel NFT's `x` and `y` coordinates.
- `upgrade.ts`: Upgrade your contract upon code changes.
- `verify.ts`: Verify the contract on live networks.

If you would like to deploy to Polygon Mumbai, as an example, simply change the `--network` flag:

```bash
npx hardhat run scripts/deploy.ts --network maticmum
```

### Testing

Tests use Local Tableland and can be ran with `npm run test`, which runs the following under the hood:

```bash
npx hardhat --network localhost test
```

This spins up a Tableland and Hardhat node temporarily, so be sure to close out any running instances of these nodes when running tests.

### Example output

The following contract was deployed on Polygon Mumbai: [`0xEB5865EF3949585324c465eC9ba5C7777f455488`](https://mumbai.polygonscan.com/address/0xEB5865EF3949585324c465eC9ba5C7777f455488#writeProxyContract). An ERC721 example query for token `0` can be viewed [here](https://testnets.tableland.network/api/v1/query?unwrap=true&extract=true&statement=SELECT%20json_object%28%27name%27%2C%20%27Token%20%23%27%20%7C%7C%20id%2C%20%27external_url%27%2C%20'not.implemented.com'%2C%20%27attributes%27%2Cjson_array%28json_object%28%27display_type%27%2C%20%27number%27%2C%20%27trait_type%27%2C%20%27x%27%2C%20%27value%27%2C%20x%29%2Cjson_object%28%27display_type%27%2C%20%27number%27%2C%20%27trait_type%27%2C%20%27y%27%2C%20%27value%27%2C%20y%29%29%29%20FROM%20canvas_80001_6076%20WHERE%20id=0).
