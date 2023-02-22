# ei-lover

An experimental bot for matrix.org

## Installation

To run this bot you must have these environment variables present (or you can put them in .env)

```bash
# Login to homeserver with access token
ACCESS_TOKEN=<Matrix access token>
# or with login credentials
USERNAME=<username>
PASSWORD=<password>
```

> You can edit config.sample.json and rename it to config.json to make the bot load settings
> from that instead (lower priority than env)

Assuming you're using pnpm, then to install dependencies

```bash
pnpm install
```

And finally to run the bot itself

```bash
pnpm start
```

## License

[MIT License](./LICENSE)
