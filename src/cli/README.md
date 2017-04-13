# orbitdb - CLI for orbit-db

**Work in progress!**

## Run

```
node ./src/cli/bin
```

Output:

```
                 _     _ _         _ _
                | |   (_) |       | | |
       ___  _ __| |__  _| |_    __| | |__
      / _ \| '__| '_ \| | __|  / _` | '_ \
     | (_) | |  | |_) | | |_  | (_| | |_) |
      \___/|_|  |_.__/|_|\__|  \__,_|_.__/

        Serverless peer-to-peer Database
    Website: https://github.com/orbitdb/orbit-db

Usage: src/cli/bin <command>

Commands:
  demo <name>                  Runs a sequence of commands as an example
  docstore <command> <dbname>  Document Database

Options:
  -h, --help  Show help                                                [boolean]

```

## Demo

```
node ./src/cli/bin demo Frank
```

Output:

```
                 _     _ _         _ _
                | |   (_) |       | | |
       ___  _ __| |__  _| |_    __| | |__
      / _ \| '__| '_ \| | __|  / _` | '_ \
     | (_) | |  | |_) | | |_  | (_| | |_) |
      \___/|_|  |_.__/|_|\__|  \__,_|_.__/

        Serverless peer-to-peer Database
    Website: https://github.com/orbitdb/orbit-db

> node ./src/cli/bin docstore put /orbitdb/demo "{\"_id\":1,\"name\":\"Frank\"}" name
Loading database '/orbitdb/demo'
Index as 'Frank' (name) to '/orbitdb/demo'
Added Qmf3AsAHqtraf6ggEdZJajUCHVCGhqLx5rSEsVEU4ZPiYe (16 ms)

> node ./src/cli/bin docstore search /orbitdb/demo "Frank" -p
Loading database '/orbitdb/demo' ████████████████████████████████████████████████ 1/1 | 100.0% | 00:00:00
Search for 'Frank' from '/orbitdb/demo'
┌────────────────────────────────────────────────────────────────┬───┐
│name                                                            │_id│
├────────────────────────────────────────────────────────────────┼───┤
│Frank                                                           │1  │
└────────────────────────────────────────────────────────────────┴───┘
Found 1 matches (1 ms)

> node ./src/cli/bin docstore drop /orbitdb/demo yes
Loading database '/orbitdb/demo'
Dropped database '/orbitdb/demo'

Demo finished!
```
