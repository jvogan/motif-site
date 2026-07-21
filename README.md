<div align="center">

<img src="assets/img/favicon.svg" width="72" alt="Motif" />

# Motif

**A molecular-biology workbench for Claude Science.**

Plasmid maps, restriction digests, primer design, and assembly plans,
in a workbench you can open and read base by base.
Runs in your browser, with no Motif-hosted backend.

[Live site](https://jvogan.github.io/motif-site/) ·
[Source and installation](https://github.com/jvogan/motif) ·
[Current capabilities](https://github.com/jvogan/motif/blob/main/docs/CAPABILITIES.md) ·
[Security](https://github.com/jvogan/motif/blob/main/SECURITY.md)

<img src="assets/img/hero-workbench.webp" width="860" alt="The Motif workbench: a sequence inventory, a nucleotide sequence pane, and a circular pUC19 plasmid map, in sync." />

[![License: MIT](https://img.shields.io/badge/License-MIT-C0603C.svg)](LICENSE)
&nbsp;![Claude Science plugin](https://img.shields.io/badge/Claude_Science-plugin-262624)
&nbsp;![Runs in your browser](https://img.shields.io/badge/runs-in--browser-7F9270)

</div>

---

## Why Motif

Ask Claude Science for sequence work, and Motif opens the result as a record you
can read base by base.

- **Every step produces a record.** A map, a digest, a translated protein — each
  one opens in the workbench.
- **It runs in your browser.** The workbench is a single self-contained file, and
  Motif has no hosted service. What you give Claude Science stays under your
  Claude and organization data policies.
- **Records keep their parent.** A derived record stores where it came from and
  the transform that made it, so you can trace a protein back to its bases.

## What's in the workbench

| Read & inspect | Cut & clone | Analyze | Transform |
| --- | --- | --- | --- |
| Circular & linear maps | Restriction digest (154 enzymes) | Six-frame ORF detection | Translation |
| Feature annotations | Primer design (Tm / GC) | NCBI genetic-code selection | Reverse complement |
| Reading-frame overlays | Gibson & Golden Gate | Browser MSA | Derived protein records |
| Live GC & length stats | PCR simulation | IUPAC motif search | Parent & provenance notes |

Import and export FASTA, GenBank, and raw sequence. Restore a workspace from its
database JSON, or hand one off as a ZIP or a self-contained HTML file.

## Try it

Build the current workbench from the public source repository:

```bash
git clone https://github.com/jvogan/motif.git
cd motif
npm ci
npm run preview:motif
```

Open `preview/motif-artifact.html`. For Claude Science connector setup and the
public synthetic smoke record, follow the
[installation guide](https://github.com/jvogan/motif/blob/main/docs/CLAUDE_SCIENCE_QUICKSTART.md).

<div align="center">
<img src="assets/mascot/crab.webp" width="120" alt="Motif's lab-crab mascot" />

*Paste one of these after opening a Motif workbench:*
</div>

- `Open pUC19 and highlight the unique cutters.` → a map with single-cut enzymes flagged
- `Translate the lacZα region and save it as a protein.` → a protein record, parent recorded
- `Design primers to amplify the MCS, about 250 bp.` → a primer pair with Tm, GC, product size
- `Plan a Golden Gate assembly and flag internal BsaI sites.` → an ordered plan, Type IIS conflicts called out

## Run the landing page locally

This repo is the Motif landing site. It is static and has no build step; the
product source and distributable build live in `jvogan/motif`.

```bash
python3 -m http.server 4178
# open http://localhost:4178
```

`http.server` answers a Range request with the whole file, so the embedded
videos will not scrub locally. Any server that returns `206 Partial Content`
restores seeking, as GitHub Pages does in production.

The page is GitHub Pages ready: `.nojekyll` and relative paths throughout. The
plasmid map, codon translation, and ambient background are vanilla JS and honor
`prefers-reduced-motion`.

## Scope

Motif prepares and inspects sequence records. It computes each analysis
deterministically, shows the numbers behind it, flags likely mistakes such as
internal cut sites and impossible geometry, and records where every derived
record came from. Nothing it produces has been tested experimentally.

## License

[MIT](LICENSE).

---

<sub>Motif is an independent, community-built plugin. It is **not** affiliated with,
sponsored by, or endorsed by Anthropic. “Claude” and “Claude Science” are trademarks
of Anthropic. Banner illustrations and the mascot are original artwork. Motif is a
research and design tool, not a clinical or diagnostic device.</sub>
