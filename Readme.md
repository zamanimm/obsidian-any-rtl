# Any-RTL Support for Obsidian

**Any-RTL** is an Obsidian plugin focused on practical right-to-left (RTL) support for mixed Persian, Arabic, Hebrew, and English notes.

The plugin combines the document-level direction controls of **RTL Support** with the content-aware, per-line/per-block direction handling of **Content RTL**, while adding a more useful `Any-RTL` detection mode for mixed-language text.

> **Why another RTL plugin?**
>
> Obsidian already provides native bidirectional text handling, but mixed RTL/LTR content can still be awkward. A line such as `a b ث` is a good example: its first character is Latin, but the line actually contains RTL text and is often easier to read when the whole line flows right-to-left.

---

## ✨ Features

* 🧠 **Any-RTL detection** — switches a line/block to RTL when it contains **any** supported RTL-script character.
* ✍️ **Edit Mode support** — automatic direction handling while editing Markdown notes.
* 📖 **Reading Mode support** — automatic direction handling for rendered Markdown blocks.
* 🔀 **Mixed RTL/LTR support** — English-only content remains LTR while mixed content can become RTL.
* 🎛️ **Multiple text-direction modes** — `Auto`, `LTR`, `RTL`, and `Any-RTL`.
* 📄 **Per-file direction controls** — retain the useful note-level direction workflow from RTL Support.
* 🧩 **Content-focused behavior** — the goal is to change note content without unnecessarily forcing the entire Obsidian interface into RTL.
* 📱 Designed to work with Obsidian's editor and rendered Markdown views.

---

## Text Direction Modes

### Auto (Default Obsidian Behavior)

Decides on a per-line text direction according to its content based on the **first character**.

### LTR (Left-to-Right)

Forces all text to be left-to-right regardless of content.

### RTL (Right-to-Left)

Forces all text to be right-to-left regardless of content.

### Any-RTL (New!)

Smart detection: if a line contains **any** RTL character (Persian, Arabic, Hebrew, etc.), the entire line is rendered as RTL.

This is more intelligent for mixed-language text than `Auto`, which primarily follows the direction implied by the first character.

### Examples of Any-RTL Behavior

| Line Content | Auto Mode        | Any-RTL Mode                  |
| ------------ | ---------------- | ----------------------------- |
| `ا ب ث`      | RTL              | RTL                           |
| `a b c`      | LTR              | LTR                           |
| `ا b c`      | RTL (first char) | RTL (contains RTL char)       |
| `a b ث`      | LTR (first char) | **RTL** (contains RTL char) ✨ |
| `a ب c`      | LTR (first char) | **RTL** (contains RTL char) ✨ |

The key idea is simple:

> **If there is RTL text anywhere in the line, Any-RTL treats the whole line as RTL.**

---

## 🎯 Designed for Mixed-Language Notes

Any-RTL is especially useful for notes containing a mixture of Persian/Arabic and English, including:

* Persian text with English technical terms
* English sentences containing Persian or Arabic words
* Mixed-language headings
* Lists containing both RTL and LTR content
* Notes with code, mathematics, and technical notation alongside RTL prose

> ### 📝 Example
> <div dir='rtl'>سید علی</div>
> <div dir='rtl'>سید ali</div>
> <div dir='rtl'>seyed علی</div>
> <div dir='ltr'>seyed ali</div>

In `Any-RTL` mode, lines containing at least one RTL-script character are treated as RTL, while lines containing only Latin text remain LTR.

---

## ⚙️ Settings

The plugin is intended to expose a small set of practical controls instead of forcing a single RTL behavior on every note.

### Default Text Direction

Choose the default direction used by notes that do not have an explicit direction.

Available modes:

* `LTR`
* `RTL`
* `Auto`
* `Any-RTL`

For mixed Persian/English vaults, **Any-RTL** is recommended.

### Remember Text Direction Per File

When enabled, a note can keep its own selected direction instead of always following the global default.

This behavior comes from the original RTL Support workflow and is useful when a vault contains notes with different language conventions.

### Content RTL Controls

The Content RTL approach also provides independent control over where automatic content direction is applied:

* **Enable Content RTL**
* **Editing View**
* **Reading View**

This makes it possible to keep automatic direction handling limited to the views where it is actually wanted.

### Reading Granularity (New)

Choose how Any-RTL is applied in Reading Mode. Select 'Per block' for standard paragraph direction, or 'Per line' to strictly separate text by hard line breaks `<br>`, ensuring mixed-language lines within the same block are formatted independently.

---

## 🧩 How It Works

The plugin separates **document-level direction** from **content-level direction**.

```text
                     Obsidian Note
                           │
              ┌────────────┴────────────┐
              │                         │
          Document Direction       Content Direction
              │                         │
        LTR / RTL / Auto          Per line / block
              │                         │
          Editor behavior        Any-RTL detection
              │                         │
              └────────────┬────────────┘
                           │
                    Mixed RTL + LTR
```

### Edit Mode

The editor layer works at the line level so each line can independently become RTL or LTR without turning the entire editor into a single direction.

### Reading Mode

The reading layer works on rendered Markdown blocks, allowing headings, paragraphs, list items, table cells, and similar content blocks to receive an appropriate direction.

### Interface Preservation

The goal is to keep Obsidian UI elements, raw frontmatter, code, and other inherently LTR-oriented content from being accidentally flipped when only the note's prose needs RTL handling.

---

## 📦 Installation

### 🧩 Install with BRAT — Recommended

The easiest way to install **Any-RTL Support** is through [BRAT (Beta Reviewer's Auto-update Tool)](https://github.com/TfTHacker/obsidian42-brat).

1. Install **BRAT** from the Obsidian Community Plugins.

2. Open **Settings → BRAT → Add Beta Plugin**.

3. Enter this repository URL:

```text
https://github.com/zamanimm/obsidian-any-rtl
```

4. Add the plugin and wait for BRAT to download it.

5. Open **Settings → Community plugins**.

6. Enable **Any-RTL Support**.

BRAT can also keep the plugin updated automatically when new versions are released.

### 📥 Manual Installation

1. Download the latest release from the **Releases** page.

2. Create the plugin folder:

```text
<Vault>/.obsidian/plugins/any-rtl/
```

3. Copy these files into the folder:

```text
main.js
manifest.json
styles.css
```

4. Restart or reload Obsidian.

5. Open **Settings → Community plugins** and enable **Any-RTL Support**.

---

## 🙏 Credits & Inspirations

This project was built by combining ideas and implementation approaches from two excellent Obsidian plugins:

- **[Content RTL](https://github.com/SirwanAfifi/content-rtl)** focuses on automatic content-only direction detection, including per-line behavior in Editing/Live Preview and per-block behavior in Reading Mode.

- **[RTL Support](https://github.com/esm7/obsidian-rtl)** extends Obsidian's RTL handling with document-level direction controls, per-file direction, frontmatter-based direction, and related editor behavior.

A big thank-you to the authors and contributors of both projects for the groundwork that made this project possible.

---

## 📜 License

This project is released under the **MIT License**.

Please see [LICENSE](LICENSE) for the full license text.

Because this project builds on work from other open-source projects, their licenses and attribution requirements should be preserved when distributing derivative code.

---

## 💡 Why `Any-RTL`?

The name comes directly from the core idea of this plugin:

**Any RTL character → RTL direction.**

It is intentionally simple, predictable, and particularly useful for Persian and Arabic users writing notes that freely mix RTL and LTR text.

---

## ⭐ Feedback

Found a bug, a rendering edge case, or a case where mixed RTL/LTR text behaves unexpectedly?

Open an issue and include a small reproducible example. Mixed-language examples are especially helpful when diagnosing direction-detection problems.
