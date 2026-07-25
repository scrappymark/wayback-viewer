import test from 'node:test';
import assert from 'node:assert/strict';

import {
  filterDuplicateCandidates,
  getTileCoordinates,
  normalizeWaybackConfig
} from '../src/wayback.js';

test('normalizes Wayback releases and converts tile URL placeholders', () => {
  const releases = normalizeWaybackConfig({
    10: {
      itemID: 'older',
      itemTitle: 'World Imagery (Wayback 2024-01-04)',
      itemURL: 'https://example.test/tile/10/{level}/{row}/{col}'
    },
    20: {
      itemID: 'newer',
      itemTitle: 'World Imagery (Wayback 2025-02-06)',
      itemURL: 'https://example.test/tile/20/{level}/{row}/{col}'
    }
  });

  assert.deepEqual(releases.map(release => release.id), ['newer', 'older']);
  assert.equal(releases[0].imageUrl, 'https://example.test/tile/20/{z}/{y}/{x}');
  assert.equal(releases[0].year, 2025);
});

test('calculates the tile for the selected map point', () => {
  assert.deepEqual(
    getTileCoordinates({ latitude: 0, longitude: 0 }, 1),
    { column: 1, row: 1 }
  );

  assert.deepEqual(
    getTileCoordinates({ latitude: 0, longitude: 360 }, 1),
    { column: 1, row: 1 }
  );
});

test('removes consecutive same-size releases while preserving the oldest', () => {
  const candidates = [
    { releaseNumber: 4, size: 100 },
    { releaseNumber: 3, size: 100 },
    { releaseNumber: 2, size: 200 },
    { releaseNumber: 1, size: 200 }
  ];

  assert.deepEqual(
    filterDuplicateCandidates(candidates, 15).map(item => item.releaseNumber),
    [3, 1]
  );
});

test('retains every candidate at low zoom levels', () => {
  const candidates = [
    { releaseNumber: 2, size: 100 },
    { releaseNumber: 1, size: 100 }
  ];

  assert.deepEqual(filterDuplicateCandidates(candidates, 10), candidates);
});
