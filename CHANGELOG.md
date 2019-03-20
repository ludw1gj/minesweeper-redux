# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 3.0.3 - 2019-03-20

### Added

- Added changelog.

## 3.0.2 - 2019-03-19

### Changed

- Internal array type to Readonly.

## 3.0.1 - 2019-03-19

### Changed

- Slight update to project desc.

## 3.0.0 - 2019-03-19

### Changed

- Added status enum for Cell type removing isVisible and isFlagged properties.
- Updated README docs for status enum for Cell type.

## 2.0.4 - 2019-03-17

### Changed

- Small code refactor.

## 2.0.3 - 2019-03-14

### Changed

- Renamed internal function for better code readability.

## 2.0.2 - 2019-03-14

### Added

- Internal coordinatesAreEqual helper func.

### Changed

- Moved some logic from updaters to minesweeperBoard.js.
- Made findAdjacentCells func easier to comprehend.
- Small internal refactor.

## 2.0.1 - 2019-03-12

### Changed

- Updated doc for version > 2.0.0 in README.
- Made instructions easier to read in README.

### Removed

- Typo in package.json.

## 2.0.0 - 2019-03-12

### Added

- Check if height and width are positive integers in createInitialGrid.

### Changed

- Reduced usage of `let`.
- Improved readability of findAdjacentCells function.
- Grid is now an interface with an added height & width properties.
- Updated dep packages.
- Updated project description.
- Updated jest

## 1.2.0 - 2019-02-19

### Changed

- Test suite now only imports from index.

## 1.1.0 - 2019-02-19

### Added

- Check if height and width are positive integers in createInitialGrid.

### Changed

- Small internal refactor.
- Grid is a stricter type.
- Made setEmptyAdjacentCellsVisible function slightly more comprehensible.
- Updated project description.

### Removed

- Removed unnecessary comments.

## 1.0.0 - 2019-02-17

### Changed

- Avoid creating unnecessary new cell objects when saving and loading previous grid state.
- Negative remaining flags amount is allowed.

## 0.8.8 - 2019-02-15

### Changed

- Small update to docs in README.

## 0.8.7 - 2019-02-15

### Changed

- Small update to format in README.

## 0.8.6 - 2019-02-15

### Fixed

- Issues with number order formatting in README.

## 0.8.5 - 2019-02-15

### Added

- MIT license.

## 0.8.4 - 2019-02-15

### Added

- More comprehensive docs in README.

### Changed

- Strengthened tests.
- Internal refactor.
- Fixed typo.

## 0.8.3 - 2019-02-14

### Added

- 3 predefined difficulties.

### Fixed

- Fixed API function urls.

## 0.8.2 - 2019-02-14

### Fixed

- Adjacent cells with zero surrounding mines not becoming visible when a cell is revealed.

## 0.8.1 - 2019-02-14

### Changed

- Removed runtime checks in updater functions.

## 0.8.0 - 2019-02-14

### Added

- Exposed some funcs from core.

### Fixed

- SetEmptyAdjacentCellsVisible not revealing cells properly.
- Fixed timer not stopping on win.

### Removed

- UserError's, now errors are only used internally.

## 0.7.1 - 2019-02-14

### Changed

- Updated desc.

## 0.7.0 - 2019-02-14

### Added

- New Error types.

### Changed

- Improved types.
- Improved tests.
- Code refactor.

### Removed

- Lodash dependency
