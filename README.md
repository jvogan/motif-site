<div align="center">

<img src="assets/img/favicon.svg" width="72" alt="Motif" />

# Motif

**A molecular-biology bench for Claude Science.**

Plasmid maps, restriction digests, primer design, and cloning plans,
as an artifact you can open and inspect down to the base pair.
Runs in your browser. Nothing leaves your device.

<img src="assets/img/hero-workbench.webp" width="860" alt="The Motif workbench: a sequence inventory, a nucleotide sequence pane, and a circular pUC19 plasmid map, in sync." />

[![License: MIT](https://img.shields.io/badge/License-MIT-C0603C.svg)](LICENSE)
&nbsp;![Claude Science plugin](https://img.shields.io/badge/Claude_Science-plugin-262624)
&nbsp;![Local-first](https://img.shields.io/badge/local--first-in--browser-7F9270)

</div>

---

## Why Motif

The interesting moment in agentic science isn't a paragraph describing a plasmid.
It's watching the agent change a real workspace, then being able to inspect every
result yourself.

- **Visible artifacts.** Every step lands as a record on the bench: a map, a
  digest, a translated protein, not a wall of text.
- **Local-first.** The whole workbench is a single self-contained file that runs
  in your browser. No cloud round-trip, no account.
- **Auditable lineage.** Derived records remember their parent and how they were
  made, so you can trace a protein back to the bases it came from.

## What's on the bench

| Read & inspect | Cut & clone | Analyze | Transform |
| --- | --- | --- | --- |
| Circular & linear maps | Restriction digest (153 enzymes) | Six-frame ORF detection | Translation |
| Feature annotations | Primer design (Tm / GC) | Codon optimization (*E. coli*, human, yeast) | Reverse complement |
| Reading-frame overlays | Gibson & Golden Gate | Needleman–Wunsch alignment | Reverse translation |
| Live GC & length stats | PCR simulation | IUPAC motif search | Parent & derivation notes |

Import and export FASTA, GenBank, and raw sequence, plus a portable self-contained
workspace snapshot.

## Try it

The whole workbench is one self-contained file that starts with **pUC19** loaded.
No install, no sign-in.

```bash
open assets/artifact/index.html      # or double-click it
```

<div align="center">
<img src="assets/mascot/crab.webp" width="120" alt="Motif's lab-crab mascot" />

*Not sure where to start? Paste one of these into Claude Science with Motif open:*
</div>

- `Open pUC19 and highlight the unique cutters.` → a map with single-cut enzymes flagged
- `Translate the lacZα region and save it as a protein.` → a protein record, parent recorded
- `Design primers to amplify the MCS, about 250 bp.` → a primer pair with Tm, GC, product size
- `Plan a Golden Gate assembly and flag internal BsaI sites.` → an ordered plan, Type IIS conflicts called out

## Run the landing page locally

This repo is the Motif landing site (a static, no-build site) plus the
self-contained artifact under `assets/`.

```bash
python3 -m http.server 4178
# open http://localhost:4178
```

It's GitHub-Pages ready (`.nojekyll`, relative paths). The interactive plasmid
map, codon-translation viz, and ambient field are vanilla JS and reduced-motion
aware.

## Scope

Motif is a **design and inspection bench, not a validation service.**

- **It does:** prepare, inspect, and explain sequence artifacts; compute analyses
  deterministically and show its work; flag likely mistakes (internal cut sites,
  impossible geometry); keep provenance so results can be traced.
- **It won't pretend:** that a proposed plan has been wet-lab validated; to be a
  clinical or diagnostic tool; to have changed a construct unless you can see and
  verify it; to replace review by a qualified scientist.

## License

[MIT](LICENSE).

---

<sub>Motif is an independent, community-built plugin. It is **not** affiliated with,
sponsored by, or endorsed by Anthropic. “Claude” and “Claude Science” are trademarks
of Anthropic. Banner illustrations and the mascot are original artwork. Motif is a
research and design tool, not a clinical or diagnostic device.</sub>
