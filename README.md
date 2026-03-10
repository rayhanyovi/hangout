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

Catatan:
`npm run dev` saat ini sengaja memakai webpack dev server. `npm run dev:turbo`
disediakan terpisah karena resolver Turbopack sempat salah membaca parent
folder workspace pada mesin ini.

## Core Scripts

- `npm run dev`
- `npm run dev:turbo`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run test:e2e:deployed` with `HANGOUT_SMOKE_BASE_URL=https://<preview-url>`

## Project References

- `docs/overview.md` untuk peta konteks teknikal dan produk
- `docs/to_dos.md` untuk tracking pekerjaan
- `docs/workflow_contract.md` untuk aturan kerja agent dan developer
- `docs/deployment_smoke.md` untuk langkah smoke test terhadap deployment preview/live
- `docs/Project Hangout - Unified PRD + BRD.txt` untuk source requirement awal

## Notes

- Root app di repo ini adalah target production Next.js.
- Cutover dari prototype Lovable sudah selesai; repo ini sekarang hanya menyimpan app root yang aktif.
- Jangan gunakan `yarn`, `pnpm`, atau `bun` untuk root app kecuali keputusan tooling diubah secara eksplisit.
