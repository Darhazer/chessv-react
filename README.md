# ChessV Web

A browser port of **[ChessV](http://www.chessv.org/)** — a powerful chess-variant
engine and GUI originally written in C#/.NET by Greg Strong. This project
reimplements ChessV in TypeScript and React so every variant it ships can be
played in the browser.

## Status

| Phase | Scope | Status |
| ----- | ----- | ------ |
| 0 | Monorepo scaffold | done |
| 1 | Core engine + Standard Chess playable | done |
| 2 | AI engine (Web Worker) | done |
| 3 | Variant catalog | done — 85 variants registered (see [phase-3-deferred](docs/phase-3-deferred.md)) |
| 4 | Themes, PGN, polish | done (see [phase-4-deferred](docs/phase-4-deferred.md)) |
| 5 | Hardening / parity testing | done |

### Variant coverage

ChessV's C# source has 114 `[Game]` attribute entries. After accounting for
the 16 "Generic" UI templates (configuration scaffolds for build-your-own
variants, not playable as-is) and 15 of the `CwDA: X vs. Y` matchups (which
all instantiate the same `ChessWithDifferentArmies` class with different
default armies), ChessV ships **82 distinct playable variants**. This port
registers **85** of them — every base variant is covered, with two of them
(`Grand Shatranj`, `Great Shatranj`) split into four cards where the
C# version exposes them through a `Variant` choice. `ChessWithDifferentArmies`
is registered once and exposes the 16 army pairings via internal choice
variables.

## Workspace layout

```
packages/
  engine/    @chessv/engine    core game model: board, pieces, moves, rules, FEN
  rules/     @chessv/rules     pluggable Rule subclasses (castling, en passant, ...)
  pieces/    @chessv/pieces    piece-type definitions
  variants/  @chessv/variants  variant definitions + catalog registry
  ai/        @chessv/ai        alpha-beta search engine + Web Worker
  ui/        @chessv/app       React + Vite web client
tools/       build scripts (asset conversion, perft comparison)
test/        cross-package tests (perft fixtures)
```

## Development

```sh
pnpm install
pnpm dev          # run the web client
pnpm typecheck    # type-check every package
pnpm test         # run unit + perft tests
```

## License

ChessV is free software licensed under the **GNU General Public License, version 3
or (at your option) any later version**. This web port is a derivative work and is
distributed under the same terms — see [`LICENSE`](./LICENSE) for the full text.

Original ChessV is Copyright © 2012–2019 Greg Strong. The ChessV website is
<http://www.chessv.org/>.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU General Public License for more details.
