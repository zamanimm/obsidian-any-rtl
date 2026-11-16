# Any-RTL

#### Smart RTL support for mixed-language notes and the Obsidian interface.

**Any-RTL** provides flexible right-to-left (RTL) and left-to-right (LTR) direction handling for Obsidian. It supports mixed-language content, per-note direction settings, and RTL-aware navigation in the Outline sidebar.

## ✨ Features

- 🔄 **Multiple direction modes**
  - **Auto** — follow Obsidian's native direction detection.
  - **Any-RTL** — detect RTL text and apply the appropriate direction to rendered content.
  - **LTR / RTL** — force a specific direction.
- 📄 **Per-note direction** — remember the selected direction for individual notes.
- 🏷️ **Frontmatter support** — set a note's direction through YAML.
- 📝 **Mixed-language content** — support Persian, Arabic, Hebrew, English, and other RTL/LTR scripts in the same note.
- ✍️ **Live Preview and Reading View** — apply direction handling while editing and when viewing rendered notes.
- 📏 **Per-block direction** — independently handle headings, paragraphs, list items, tables, blockquotes, and callout content.
- 🌳 **RTL-aware Outline sidebar** — mirror the Outline tree, including its indentation and hierarchy guides, while keeping each heading readable in its own direction.

---

## 📦 Installation

### 🌐 Community Plugins

1. Open **Settings → Community plugins → Browse**.
2. Search for **Any RTL**.
3. Click **Install**, then **Enable**.

### 🧪 BRAT

For the current development version:

1. Install **BRAT** from Community Plugins.
2. Open **Settings → BRAT → Beta Plugin List**.
3. Add `https://github.com/zamanimm/obsidian-any-rtl`.
4. Install and enable **Any RTL**.

### 🛠️ Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/zamanimm/obsidian-any-rtl/releases).
2. Create the plugin folder:

```text
.obsidian/plugins/any-rtl/
```

3. Place these files inside the folder:

```text
main.js
manifest.json
styles.css
```

4. Restart Obsidian or reload the plugins.
5. Enable **Any RTL** from **Settings → Community plugins**.

---

## 🎯 Direction Modes

| Mode | Behavior |
| --- | --- |
| **LTR** | Force left-to-right direction. |
| **RTL** | Force right-to-left direction. |
| **Auto** | Follow Obsidian's native automatic direction detection. |
| **Any-RTL** | For rendered content blocks, use RTL if the block contains an RTL character; otherwise use LTR. In Outline, choose the tree direction from the dominant script of its heading titles. |

---

## 🔍 Any-RTL Detection

A rendered text block is treated as RTL if it contains **at least one RTL character**. Otherwise, it is treated as LTR.

> 📝 Example
> ---
> 
> <div dir="rtl">سید علی</div>
> <div dir="rtl">سید ali</div>
> <div dir="rtl">seyed علی</div>
> <div dir="ltr">seyed ali</div>


This is useful when Persian, Arabic, Hebrew, and Latin text appear together in the same paragraph, list item, or quote.

---

## 🌳 Outline Sidebar

Any-RTL also supports the native Obsidian Outline sidebar.

The direction mode controls the overall tree layout:

| Mode | Outline behavior |
| --- | --- |
| **LTR** | Keep the tree left-to-right. |
| **RTL** | Mirror the tree to right-to-left. |
| **Auto** | Preserve Obsidian's native Outline layout. |
| **Any-RTL** | Choose the overall tree direction from the dominant script among the heading titles. |

---

## 📝 Per-Note Direction

Notes use the **Default text direction** unless a saved per-note direction or frontmatter override applies.

To remember a note's direction without modifying its Markdown file:

1. Enable **Remember text direction per file** in **Settings → Any-RTL**.
2. Open the note and click the status bar's direction indicator, or use the plugin's text-direction command, to cycle through **LTR → RTL → Any-RTL → Auto**.

Your selection is saved in the plugin's `data.json` and restored when the note is reopened. Disabling this setting makes notes use the default direction unless frontmatter specifies otherwise.

### 🏷️ Frontmatter Override

Set a note's direction explicitly using YAML frontmatter:

```yaml
---
direction: any-rtl
---
```

Supported values: `rtl`, `ltr`, `auto`, and `any-rtl`.

A valid frontmatter direction takes priority over saved per-note directions and the global default. UI changes do not modify frontmatter. With per-file remembering enabled, your selection is still saved, but frontmatter takes precedence when the note is reopened.

### Reset to Default

Close Obsidian and remove the note's entry from `fileDirections` in:

```text
<Vault>/.obsidian/plugins/any-rtl/data.json
```

Also remove any `direction` property from the note's frontmatter.

---

## ⚙️ Settings

Configure Any-RTL from:

**Settings → Any-RTL**

Available options include default direction, per-file memory, note title direction, YAML protection, and the status bar.

---

## 🙏 Credits

Any-RTL builds on ideas and implementation patterns from these open-source Obsidian plugins:

- [Content RTL](https://github.com/SirwanAfifi/content-rtl) by Sirwan Afifi
- [RTL Support](https://github.com/esm7/obsidian-rtl) by ESM 7 and contributors

Both projects are released under the MIT License. Their original copyright and license notices are retained where applicable.

Thank you to the authors and contributors of these projects for their open-source work. ❤️

---

## 📄 License

MIT License. See [License](License) for details.
