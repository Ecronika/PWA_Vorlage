import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const dir = 'public/icons';
mkdirSync(dir, { recursive: true });

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crcBuf]);
}

function makePng(size, [r, g, b]) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    const row = y * (1 + size * 3);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      raw[row + 1 + x * 3] = r;
      raw[row + 2 + x * 3] = g;
      raw[row + 3 + x * 3] = b;
    }
  }
  const idat = chunk('IDAT', deflateSync(raw));
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, chunk('IHDR', ihdr), idat, iend]);
}

const slate800 = [0x1e, 0x29, 0x3b];
writeFileSync(join(dir, 'icon-192.png'), makePng(192, slate800));
writeFileSync(join(dir, 'icon-512.png'), makePng(512, slate800));
writeFileSync(join(dir, 'icon-maskable-512.png'), makePng(512, slate800));
console.log('Placeholder icons written to', dir);
