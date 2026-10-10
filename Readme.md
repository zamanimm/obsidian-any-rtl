exclude tables, code fenced, callouts
discription
manifest link
per-line and per-block for editing mode
per file and yaml dependent
yaml realtime action
status bar enable after seting


readme:

---

# Any-RTL
> Smart RTL support for mixed-language notes in Obsidian.

**Any-RTL** provides flexible right-to-left (RTL) and left-to-right (LTR) direction handling for Obsidian, with content-aware detection for mixed-language notes.
## ✨ Features
- 🔄 **Multiple direction modes**
    - **Auto** — follow Obsidian's automatic direction detection.
    - **Any-RTL** — use RTL when a line contains any RTL character; otherwise use LTR.
    - **LTR / RTL** — force a specific direction.
- 📄 **Per-file direction** — remember the selected direction for individual notes.
- 🏷️ **Frontmatter support** — control a note's direction directly from YAML frontmatter.
- 📝 **Mixed-language content** — handle Persian, Arabic, Hebrew, English, and other RTL/LTR content within the same note.
- 👁️ **Reading Mode support** — apply direction handling to rendered notes.
- 📏 **Flexible detection** — choose between per-line and per-block direction handling.

---
## 📦 Installation
### 🌐 Community Plugins
> [!NOTE]
> **Any-RTL is not yet available in the official Obsidian Community Plugins directory.**
> Community Plugin installation will be available after the plugin is officially approved.

Once available:
1. Open **Settings → Community plugins → Browse**.
2. Search for **Any-RTL**.
3. Click **Install**, then **Enable**.
### 🧪 BRAT
For the current development version:
1. Install **BRAT** from Community Plugins.
2. Open **Settings → BRAT → Beta Plugin List**.
3. Add `https://github.com/zamanimm/obsidian-any-rtl`
4. Install and enable **Any-RTL**.
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
5. Enable **Any-RTL** from **Settings → Community plugins**.

---
## 🎯 Direction Modes

| Mode        | RTL character present | No RTL character | Behavior                                |
| ----------- | :-------------------: | :--------------: | --------------------------------------- |
| **LTR**     |          LTR          |       LTR        | Force left-to-right                     |
| **RTL**     |          RTL          |       RTL        | Force right-to-left                     |
| **Auto**    |         RTL*          |       LTR*       | Use Obsidian's automatic detection      |
| **Any-RTL** |        **RTL**        |     **LTR**      | RTL if **any RTL character** is present |

* Based on Obsidian's built-in direction detection.

---
## 🔍 Any-RTL Detection
A line is treated as RTL if it contains **at least one RTL character**:
> 📝 Example
> ---
> 
> <div dir="rtl">سید علی</div>
> <div dir="rtl">سید ali</div>
> <div dir="rtl">seyed علی</div>
> <div dir="ltr">seyed ali</div>

This is particularly useful for mixed-language content where RTL and LTR text appear in the same line.

---
## 📝 Per-Note Direction
You can override the default direction for an individual note using YAML frontmatter:

```yaml
---
direction: rtl
---
```

Supported values:

```text
rtl
ltr
auto
any-rtl
```

---
## ⚙️ Settings
Configure Any-RTL from:
**Settings → Any-RTL**
Available options include direction mode, detection behavior, per-file direction, and Reading Mode handling.

---
## 🙏 Credits
Any-RTL builds on ideas and implementation patterns from these open-source Obsidian plugins:
- [Content RTL](https://github.com/SirwanAfifi/content-rtl) by Sirwan Afifi
- [RTL Support](https://github.com/esm7/obsidian-rtl) by ESM7 and contributors
Both projects are released under the MIT License. Their original copyright and license notices are retained where applicable.
Thank you to the authors and contributors of these projects for their open-source work. ❤️

---
## 📄 License
MIT License. See [[LICENSE]] for details.
