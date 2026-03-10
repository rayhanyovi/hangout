# Hangout

Hangout adalah app fairness-first untuk membantu grup kecil menentukan titik temu, shortlist venue, lalu memutuskan tempat nongkrong tanpa debat lokasi yang panjang.

## Getting Started

Canonical package manager untuk root app ini adalah `npm`.

Jalankan development server:

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Core Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## Project References

- `docs/overview.md` untuk peta konteks teknikal dan produk
- `docs/to_dos.md` untuk tracking pekerjaan
- `docs/workflow_contract.md` untuk aturan kerja agent dan developer
- `docs/Project Hangout - Unified PRD + BRD.txt` untuk source requirement awal

## Notes

- Root app di repo ini adalah target production Next.js.
- Cutover dari prototype Lovable sudah selesai; repo ini sekarang hanya menyimpan app root yang aktif.
- Jangan gunakan `yarn`, `pnpm`, atau `bun` untuk root app kecuali keputusan tooling diubah secara eksplisit.
