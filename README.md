# ei-lover

An experimental bot for matrix.org

## Installation

To run this bot you must have these environment variables present (or you can put them in .env)

```bash
# Default homeserver is https://matrix-client.matrix.org, you can change by setting HOMESERVER env
# HOMESERVER=<your homeserver>
# Default bot prefix is !, you can change by setting PREFIX env
# PREFIX=<your preferred prefix>
# Login to homeserver with access token
ACCESS_TOKEN=<Matrix access token>
# or with login credentials
USERNAME=<username>
PASSWORD=<password>
```

Assuming you're using pnpm, then to install dependencies

```bash
pnpm install
```

And finally run the bot itself

```
pnpm start
```

## License

MIT License
