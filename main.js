/*
Any-RTL runtime entry point.
Based on the bundled upstream release; maintained directly in this package.
See LICENSE and THIRD_PARTY_NOTICES.md for attribution.
*/

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => RtlPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// EditorPlugin.ts
var import_view = require("@codemirror/view");
var import_state = require("@codemirror/state");
var import_language = require("@codemirror/language");
var import_obsidian = require("obsidian");

function getCodeBlockRanges(state) {
  const ranges = [];
  const doc = state.doc;
  const tree = import_language.syntaxTree(state);

  tree?.iterate({
    enter(node) {
      const name = node.name.toLowerCase();
      if (name === "fencedcode" || name.includes("codeblock")) {
        const first = doc.lineAt(node.from);
        const last = doc.lineAt(Math.max(node.from, node.to - 1));
        ranges.push({
          from: first.from,
          to: last.to,
          nested: !/^ {0,3}(`{3,}|~{3,})/.test(first.text)
        });
        return false;
      }
    }
  });

  // Also protect root-level fences while background parsing is incomplete.
  let fence = null;
  for (let number = 1; number <= doc.lines; number++) {
    const line = doc.line(number);
    if (ranges.some(range => range.nested &&
        line.from >= range.from && line.from <= range.to)) continue;
    const match = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line.text);
    if (!match) continue;

    const marker = match[1];
    const tail = match[2];
    if (!fence) {
      if (marker[0] === "`" && tail.includes("`")) continue;
      fence = { marker: marker[0], length: marker.length, from: line.from };
    } else if (
      marker[0] === fence.marker &&
      marker.length >= fence.length &&
      /^[\t ]*$/.test(tail)
    ) {
      ranges.push({ from: fence.from, to: line.to });
      fence = null;
    }
  }
  if (fence) ranges.push({ from: fence.from, to: doc.length });
  return ranges;
}


function getEditorPlugin(rtlPlugin) {
  return import_view.ViewPlugin.fromClass(class {
    constructor(view) {
      this.view = view;
      this.rtlPlugin = rtlPlugin;
      this.rtlDec = import_view.Decoration.line({ attributes: { dir: "rtl" } });
      this.ltrDec = import_view.Decoration.line({
        attributes: {
          dir: "ltr",
          style: "direction: ltr !important; text-align: left !important;"
        }
      });
      this.emptyDirDec = import_view.Decoration.line({ attributes: { dir: "auto" } });
      this.frontmatterRange = null;
      const info = view.state.field(import_obsidian.editorInfoField, false);
      const file = info?.file;
      [this.direction] = rtlPlugin.getRequiredFileDirection(file);
      this.refreshFrontmatterRange(view.state);
      this.decorations = this.buildDecorations(view);
      if (info instanceof import_obsidian.MarkdownView && info.editMode?.cm === view) {
        rtlPlugin.adjustDirectionToView(info, this);
      }
      rtlPlugin.handleIframeEditor(view.dom, view, file, this);
    }
    update(update) {
      if (update.docChanged || update.viewportChanged ||
          import_language.syntaxTree(update.startState) !== import_language.syntaxTree(update.state)) {
        this.refreshFrontmatterRange(update.state);
        this.decorations = this.buildDecorations(update.view);
      }
    }
    refreshFrontmatterRange(state) {
      this.frontmatterRange = null;
      this.codeBlockRanges = getCodeBlockRanges(state);
      if (this.rtlPlugin.settings.preventRTLFrontmatter && this.checkFrontmatter(state)) {
        this.getFrontmatterRange(state);
      }
    }
    buildDecorations(view) {
      const builder = new import_state.RangeSetBuilder();
      if (!view?.state || !view.viewport) return builder.finish();
      let pos = view.viewport.from;
      while (pos <= view.viewport.to) {
        const line = view.state.doc.lineAt(pos);
        const protectedYaml = this.rtlPlugin.settings.preventRTLFrontmatter &&
          this.frontmatterRange && line.from <= this.frontmatterRange.to;
        let decoration = this.emptyDirDec;
        const protectedCode = this.codeBlockRanges.some(range =>
          line.from >= range.from && line.from <= range.to);
        if (protectedCode || protectedYaml || this.direction === "ltr") decoration = this.ltrDec;
        else if (this.direction === "rtl") decoration = this.rtlDec;
        else if (this.direction === "any-rtl") {
          decoration = this.containsRTLCharacter(line.text) ? this.rtlDec : this.ltrDec;
        }
        builder.add(line.from, line.from, decoration);
        pos = line.to + 1;
      }
      return builder.finish();
    }
    setDirection(direction, view) {
      this.direction = isTextDirection(direction) ? direction : "auto";
      this.refreshFrontmatterRange(view.state);
      this.decorations = this.buildDecorations(view);
    }
    containsRTLCharacter(text) {
      return RTL_SCRIPT_PATTERN.test(text);
    }
    checkFrontmatter(state) {
      return /^---[\t ]*$/.test(state.doc.line(1).text);
    }
    getFrontmatterRange(state) {
      this.frontmatterRange = null;
      for (let number = 2; number <= state.doc.lines; number++) {
        const line = state.doc.line(number);
        if (/^---[\t ]*$/.test(line.text)) {
          this.frontmatterRange = { from: 0, to: line.to };
          break;
        }
      }
    }
  }, { decorations: plugin => plugin.decorations });
}
// direction.util.ts
var LTR_CLASS = "is-ltr";
var RTL_CLASS = "is-rtl";
var AUTO_CLASS = "is-auto";
var ANY_RTL_CLASS = "is-any-rtl";

// MarkdownPostProcessor.ts

var READING_BLOCK_SELECTOR = "h1,h2,h3,h4,h5,h6,p,li,dt,dd,th,td,summary,figcaption,blockquote,.callout-title,.callout-title-inner";
var READING_EMBED_SELECTOR = ".markdown-embed,.internal-embed";
var EXCLUDED_READING_CONTAINER_SELECTOR = "pre,.math,.metadata-container,.mod-header,.mod-footer";
var CONTENT_RTL_CLASS = "anyrtl-content-rtl";
var CONTENT_LTR_CLASS = "anyrtl-content-ltr";
var RTL_SCRIPT_PATTERN = /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}\p{Script=Samaritan}\p{Script=Mandaic}]/u;
var DIRECTION_CLASSES = [
  LTR_CLASS,
  RTL_CLASS,
  AUTO_CLASS,
  ANY_RTL_CLASS,
  CONTENT_RTL_CLASS,
  CONTENT_LTR_CLASS,
  "anyrtl-protect-frontmatter"
];
var ORIGINAL_DIRECTION_STATES = new WeakMap();
var READING_VIEW_DIRECTIONS = new WeakMap();
var NOTE_VIEW_DIRECTIONS = new WeakMap();
var MANUAL_DIRECTION_VIEWS = new WeakSet();

var MODE_LABELS = {
  ltr: "LTR",
  rtl: "RTL",
  auto: "Auto",
  "any-rtl": "Any-RTL"
};

function isTextDirection(value) {
  return value === "ltr" || value === "rtl" || value === "auto" || value === "any-rtl";
}
function rememberDirectionState(element) {
  if (ORIGINAL_DIRECTION_STATES.has(element)) return;
  ORIGINAL_DIRECTION_STATES.set(element, {
    dir: element.getAttribute("dir"),
    hadClass: element.hasAttribute("class"),
    hadStyle: element.hasAttribute("style"),
    style: element.style.getPropertyValue("direction"),
    priority: element.style.getPropertyPriority("direction"),
    classes: DIRECTION_CLASSES.filter(name => element.classList.contains(name))
  });
}
function restoreDirectionState(element) {
  const original = ORIGINAL_DIRECTION_STATES.get(element);
  if (!original) return;
  if (original.dir === null) element.removeAttribute("dir");
  else element.setAttribute("dir", original.dir);
  element.style.removeProperty("direction");
  if (original.style) element.style.setProperty("direction", original.style, original.priority);
  element.classList.remove(...DIRECTION_CLASSES);
  original.classes.forEach(name => element.classList.add(name));
  if (!original.hadClass && !element.className) element.removeAttribute("class");
  if (!original.hadStyle && !element.style.cssText) element.removeAttribute("style");
  ORIGINAL_DIRECTION_STATES.delete(element);
}
function detectContentDirection(text) {
  return RTL_SCRIPT_PATTERN.test(text) ? "rtl" : "ltr";
}
function setContentDirection(element, direction) {
  rememberDirectionState(element);
  element.classList.toggle(CONTENT_RTL_CLASS, direction === "rtl");
  element.classList.toggle(CONTENT_LTR_CLASS, direction === "ltr");
  element.setAttribute("dir", direction);
  element.style.direction = direction;
}
function clearContentDirection(element) {
  restoreDirectionState(element);
}
function getReadingBlocks(root) {
  const blocks = root.matches(READING_BLOCK_SELECTOR) ? [root] : [];
  const sourceEmbed = root.closest(READING_EMBED_SELECTOR);
  return blocks.concat(Array.from(root.querySelectorAll(READING_BLOCK_SELECTOR)))
    .filter(block => block.closest(READING_EMBED_SELECTOR) === sourceEmbed);
}
function getDirectionalText(block) {
  function text(node) {
    if (node.nodeType === 3) return node.nodeValue || "";
    if (node.nodeType !== 1) return "";
    if (node.matches("pre,ul,ol," + READING_EMBED_SELECTOR)) return "";
    return Array.from(node.childNodes).map(text).join("");
  }
  return Array.from(block.childNodes).map(text).join("");
}
function protectReadingCode(root) {
  const sourceEmbed = root.closest(READING_EMBED_SELECTOR);
  const elements = root.matches("pre,pre code") ? [root] : [];
  elements.push(...root.querySelectorAll("pre,pre code"));
  for (const element of elements) {
    if (element.closest(READING_EMBED_SELECTOR) !== sourceEmbed) continue;
    rememberDirectionState(element);
    element.classList.remove("anyrtl-yaml-rtl", CONTENT_RTL_CLASS, CONTENT_LTR_CLASS);
    element.setAttribute("dir", "ltr");
    // Override inherited RTL and legacy YAML rules without changing styles.css.
    element.style.setProperty("direction", "ltr", "important");
  }
}
function markReadingBlockDirections(root, forcedDirection = null) {
  clearReadingBlockDirections(root);
  for (const block of getReadingBlocks(root)) {
    if (block.closest(EXCLUDED_READING_CONTAINER_SELECTOR)) continue;
    setContentDirection(block, forcedDirection || detectContentDirection(getDirectionalText(block)));
  }
  protectReadingCode(root);
}
function clearReadingBlockDirections(root) {
  const sourceEmbed = root.closest(READING_EMBED_SELECTOR);
  const selector = "." + CONTENT_RTL_CLASS + ",." + CONTENT_LTR_CLASS + ",pre,pre code";
  const elements = root.matches(selector) ? [root] : [];
  elements.push(...root.querySelectorAll(selector));
  for (const element of elements) {
    if (element.closest(READING_EMBED_SELECTOR) === sourceEmbed) clearContentDirection(element);
  }
}
function applyReadingDirection(root, direction) {
  if (direction === "auto") {
    clearReadingBlockDirections(root);
    protectReadingCode(root);
  } else {
    markReadingBlockDirections(root, direction === "any-rtl" ? null : direction);
  }
}
// main.ts
var import_state2 = require("@codemirror/state");

// settingsTab.ts
var import_obsidian2 = require("obsidian");
var DEFAULT_SETTINGS = {
  fileDirections: {},
  defaultDirection: "any-rtl",
  rememberPerFile: false,
  setNoteTitleDirection: true,
  preventRTLFrontmatter: false,
  statusBar: true
};
var RtlSettingsTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.settings = plugin.settings;
  }
  display() {
    let { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "RTL Settings" });
    new import_obsidian2.Setting(containerEl).setName("Remember text direction per file").setDesc("Store and remember the text direction used for each file individually.").addToggle((toggle) => toggle.setValue(this.settings.rememberPerFile).onChange((value) => {
      this.settings.rememberPerFile = value;
      this.plugin.saveSettings();
      this.plugin.refreshAllDirections();
    }));
    new import_obsidian2.Setting(containerEl).setName("Default text direction").setDesc("What should be the default text direction in Obsidian?").addDropdown((dropdown) => dropdown.addOption("ltr", "LTR").addOption("rtl", "RTL").addOption("auto", "Auto").addOption("any-rtl", "Any-RTL").setValue(this.settings.defaultDirection).onChange((value) => {
      this.settings.defaultDirection = value;
      this.plugin.saveSettings();
      this.plugin.refreshAllDirections();
    }));
    new import_obsidian2.Setting(containerEl).setName("Set note title direction").setDesc("In RTL notes, also set the direction of the note title.").addToggle((toggle) => toggle.setValue(this.settings.setNoteTitleDirection).onChange((value) => {
      this.settings.setNoteTitleDirection = value;
      this.plugin.saveSettings();
      this.plugin.refreshAllDirections();
    }));
    new import_obsidian2.Setting(containerEl).setName("Prevent raw YAML (Frontmatter) to be RTL-directioned in Editor").setDesc("Keep raw YAML frontmatter left-to-right in the editor.").addToggle((toggle) => {
      var _a;
      return toggle.setValue((_a = this.settings.preventRTLFrontmatter) != null ? _a : false).onChange((value) => {
        this.settings.preventRTLFrontmatter = value;
        this.plugin.saveSettings();
        this.plugin.refreshAllDirections();
      });
    });
    new import_obsidian2.Setting(containerEl).setName("Show status bar item").setDesc("Show a clickable status bar item showing the current direction.").addToggle((toggle) => {
      var _a;
      return toggle.setValue((_a = this.settings.statusBar) != null ? _a : true).onChange((value) => {
        this.settings.statusBar = value;
        this.plugin.saveSettings();
        this.plugin.refreshAllDirections();
      });
    });


  }
};

// main.ts
var RtlPlugin = class extends import_obsidian3.Plugin {
  constructor() {
    super(...arguments);
    this.sessionDirections = new Map();
    this.settings = null;
    this.statusBarItem = null;
    this.statusBarText = null;
  }

  async onload() {
    await this.convertLegacySettings();
    await this.loadSettings();
    await this.removeOldPlugin();
    this.addCommand({
      id: "switch-text-direction",
      name: "Switch text direction",
      icon: "arrow-left-right",
      hotkeys: [
        { modifiers: ["Ctrl", "Shift"], key: "ArrowLeft" },
        { modifiers: ["Ctrl", "Shift"], key: "ArrowRight" }
      ],
      callback: () => {
        const view = this.app.workspace.getActiveViewOfType(
          import_obsidian3.MarkdownView
        );

        if (view?.editor) {
          this.switchDocumentDirection(view.editor, view);
        }
      }
    });
    this.addCommand({
      id: "save-current-direction-to-frontmatter",
      name: "Save current text direction to YAML",
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(
          import_obsidian3.MarkdownView
        );

        if (!view?.file) return false;
        if (checking) return true;

        const file = view.file;
        const direction = this.getDocumentDirection(view.editor, view);

        if (!isTextDirection(direction)) return false;

        void this.app.fileManager.processFrontMatter(file, (frontmatter) => {
          frontmatter.direction = direction;
        }).then(() => {
          new import_obsidian3.Notice(
            `YAML direction set to ${MODE_LABELS[direction]}`
          );
        }).catch((error) => {
          console.error("Any-RTL: could not save YAML direction.", error);
          new import_obsidian3.Notice("Could not save direction to YAML.");
        });

        return true;
      }
    });
    this.statusBarItem = this.addStatusBarItem();
    const icon = import_obsidian3.getIcon("arrow-left-right");
    if (icon) this.statusBarItem.appendChild(icon);
    this.statusBarText = this.statusBarItem.createEl("span");
    this.statusBarText.style.marginLeft = "5px";
    this.statusBarItem.title = "Text direction";
    this.statusBarItem.addClass("mod-clickable");
    this.registerDomEvent(this.statusBarItem, "click", () => {
      const view = this.app.workspace.getActiveViewOfType(import_obsidian3.MarkdownView);
      if (view?.editor) this.switchDocumentDirection(view.editor, view);
    });
    this.editorPlugin = getEditorPlugin(this);
    this.registerEditorExtension(import_state2.Prec.lowest(this.editorPlugin));
    this.registerMarkdownPostProcessor((element, context) => {
      const preview = element.closest(".markdown-preview-view");
      const current = preview && READING_VIEW_DIRECTIONS.get(preview);
      const file = this.app.vault.getAbstractFileByPath(context.sourcePath);
      const direction = current && current.sourcePath === context.sourcePath
        ? current.direction : this.getRequiredFileDirection(file)[0];
      if (element.matches(".markdown-preview-view")) {
        this.setDocumentDirectionForReadingDiv(element, direction, context.sourcePath);
      } else {
        applyReadingDirection(element, direction);
      }
    });
    this.addSettingTab(new RtlSettingsTab(this.app, this));
    this.registerEvent(this.app.workspace.on("file-open", file => {
      if (file) {
        this.app.workspace.iterateAllLeaves(leaf => {
          if (leaf.view instanceof import_obsidian3.MarkdownView && leaf.view.file?.path === file.path) {
            this.adjustDirectionToView(leaf.view);
          }
        });
      }
      this.updateStatusBar();
    }));
    this.registerEvent(this.app.vault.on("delete", file => {
      if (file?.path && Object.prototype.hasOwnProperty.call(this.settings.fileDirections, file.path)) {
        delete this.settings.fileDirections[file.path];
        void this.saveSettings();
      }
    }));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      if (file?.path && Object.prototype.hasOwnProperty.call(this.settings.fileDirections, oldPath)) {
        this.settings.fileDirections[file.path] = this.settings.fileDirections[oldPath];
        delete this.settings.fileDirections[oldPath];
        void this.saveSettings();
      }
    }));
    this.registerEvent(this.app.workspace.on("active-leaf-change", leaf => {
      if (leaf?.view instanceof import_obsidian3.MarkdownView) this.updateStatusBar(leaf.view);
      else this.hideStatusBar();
    }));
    this.app.workspace.onLayoutReady?.(() => this.refreshAllDirections());
    this.updateStatusBar();
  }

  async removeOldPlugin() {
    const oldId = "obsidian-any-rtl";

    // Never delete the currently running plugin.
    if (this.manifest.id === oldId) return;

    const configDir = this.app.vault.configDir || ".obsidian";
    const oldFolder = `${configDir}/plugins/${oldId}`;
    const adapter = this.app.vault.adapter;

    try {
      if (!await adapter.exists(oldFolder)) return;

      const manager = this.app.plugins;

      if (typeof manager?.disablePluginAndSave !== "function") {
        new import_obsidian3.Notice(
          "Any-RTL: could not disable the old plugin automatically."
        );
        return;
      }

      await manager.disablePluginAndSave(oldId);
      await adapter.rmdir(oldFolder, true);

      new import_obsidian3.Notice(
        "Any-RTL: the old plugin was disabled and removed."
      );
    } catch (error) {
      console.error("Any-RTL: old plugin removal failed.", error);

      new import_obsidian3.Notice(
        "Any-RTL: could not remove the old plugin."
      );
    }
  }

  watchRenderedContent(view) {
    const root = view.containerEl;
    this.renderedContentObservers ||= new WeakMap();

    const existing = this.renderedContentObservers.get(root);
    if (existing) {
      existing.update();
      return;
    }

    const update = () => {
      const mode = NOTE_VIEW_DIRECTIONS.get(view) ||
        this.getRequiredFileDirection(view.file)[0];

      protectReadingCode(root);
      const sourceEmbed = root.closest(READING_EMBED_SELECTOR);

      for (const title of root.querySelectorAll(
        ".callout-title,.callout-title-inner"
      )) {
        if (
          title.closest(READING_EMBED_SELECTOR) !== sourceEmbed
        ) continue;

        if (mode === "auto") {
          clearContentDirection(title);
          continue;
        }

        const direction = mode === "any-rtl"
          ? detectContentDirection(title.textContent || "")
          : mode;

        if (
          title.getAttribute("dir") !== direction ||
          title.style.direction !== direction ||
          !title.classList.contains(
            direction === "rtl"
              ? CONTENT_RTL_CLASS
              : CONTENT_LTR_CLASS
          )
        ) {
          setContentDirection(title, direction);
        }
      }
    };

    const Observer =
      root.ownerDocument.defaultView?.MutationObserver;

    if (!Observer) {
      update();
      return;
    }

    const observer = new Observer(records => {
      const selector = ".callout-title,.callout-title-inner,pre";
      const relevant = records.some(record => {
        const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
        if (target?.closest(selector)) return true;
        return Array.from(record.addedNodes).some(node =>
          node.nodeType === 1 && (node.matches(selector) || node.querySelector(selector)));
      });
      if (relevant) update();
    });

    observer.observe(root, {
      childList: true,
      characterData: true,
      subtree: true
    });

    this.renderedContentObservers.set(root, { update });

    this.register(() => {
      observer.disconnect();

      for (const title of root.querySelectorAll(
        ".callout-title,.callout-title-inner"
      )) {
        if (
          title.closest(READING_EMBED_SELECTOR) ===
          root.closest(READING_EMBED_SELECTOR)
        ) {
          clearContentDirection(title);
        }
      }

      for (const code of root.querySelectorAll("pre,pre code")) {
        if (code.closest(READING_EMBED_SELECTOR) === root.closest(READING_EMBED_SELECTOR)) {
          restoreDirectionState(code);
        }
      }
      this.renderedContentObservers.delete(root);
    });

    update();
  }

  onunload() {
    this.app.workspace.iterateAllLeaves(leaf => {
      const view = leaf.view;
      if (!(view instanceof import_obsidian3.MarkdownView)) return;
      clearReadingBlockDirections(view.containerEl);
      for (const embed of view.containerEl.querySelectorAll(READING_EMBED_SELECTOR)) {
        clearReadingBlockDirections(embed);
      }
      const elements = Array.from(view.containerEl.querySelectorAll(
        ".cm-editor,.markdown-preview-view,.inline-title,pre > code.language-yaml,pre > code.language-yml"
      ));
      if (view.containerEl.matches(".cm-editor,.markdown-preview-view,.inline-title")) {
        elements.push(view.containerEl);
      }
      const header = view.containerEl.parentElement?.querySelector(".view-header-title-container");
      if (header) elements.push(header);
      for (const element of elements) {
        if (element.matches("pre > code.language-yaml,pre > code.language-yml")) {
          restoreDirectionState(element.parentElement);
        }
        if (element.matches(".cm-editor") && element.parentElement) {
          restoreDirectionState(element.parentElement);
        }
        restoreDirectionState(element);
        if (element.matches(".markdown-preview-view")) {
          READING_VIEW_DIRECTIONS.delete(element);
        }
      }
      NOTE_VIEW_DIRECTIONS.delete(view);
    });
  }
  adjustDirectionToView(view, editorPlugin) {
    if (!(view instanceof import_obsidian3.MarkdownView) || !view.file) {
      return;
    }

    const temporaryDirection = this.sessionDirections.get(view.file.path);
    const direction = temporaryDirection ??
      this.getRequiredFileDirection(view.file)[0];

    if (temporaryDirection !== undefined) {
      MANUAL_DIRECTION_VIEWS.add(view);
    } else {
      MANUAL_DIRECTION_VIEWS.delete(view);
    }

    this.setMarkdownViewDirection(
      view,
      view.editor,
      view.editor?.cm,
      direction,
      editorPlugin
    );
  }
  refreshAllDirections() {
    const view = this.app.workspace.getActiveViewOfType(
      import_obsidian3.MarkdownView
    );

    if (!view) {
      this.hideStatusBar();
      return;
    }

    this.adjustDirectionToView(view);
    this.refreshActiveReadingView();
    this.updateStatusBar(view);
  }
  getRequiredFileDirection(file) {
    const fallback = isTextDirection(this.settings.defaultDirection)
      ? this.settings.defaultDirection : DEFAULT_SETTINGS.defaultDirection;
    if (!(file instanceof import_obsidian3.TFile)) return [fallback, true];
    const frontmatter = this.getFrontMatterDirection(file);
    if (isTextDirection(frontmatter)) return [frontmatter, false];
    const saved = this.settings.fileDirections || {};
    if (this.settings.rememberPerFile &&
        Object.prototype.hasOwnProperty.call(saved, file.path) &&
        isTextDirection(saved[file.path])) {
      return [saved[file.path], false];
    }
    return [fallback, true];
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }


  refreshActiveReadingView() {
    const view = this.app.workspace.getActiveViewOfType(
      import_obsidian3.MarkdownView
    );

    view?.previewMode?.rerender?.(true);
  }
  async loadSettings() {
    let loaded;
    try {
      loaded = await this.loadData();
    } catch (error) {
      console.warn("Any-RTL: settings could not be read.", error);
      new import_obsidian3.Notice("Any-RTL: settings could not be read; defaults are being used.");
    }
    const data = loaded && typeof loaded === "object" && !Array.isArray(loaded) ? loaded : {};
    this.settings = { ...DEFAULT_SETTINGS, ...data, fileDirections: {} };
    const saved = data.fileDirections;
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      this.settings.fileDirections = Object.fromEntries(
        Object.entries(saved).filter(([, direction]) => isTextDirection(direction))
      );
    }
    if (!isTextDirection(this.settings.defaultDirection)) {
      this.settings.defaultDirection = DEFAULT_SETTINGS.defaultDirection;
    }
    for (const key of ["rememberPerFile", "setNoteTitleDirection", "preventRTLFrontmatter", "statusBar"]) {
      if (typeof this.settings[key] !== "boolean") this.settings[key] = DEFAULT_SETTINGS[key];
    }
    // Remove obsolete settings from earlier versions.
    delete this.settings.readingGranularity;
    delete this.settings.setYamlDirection;
  }

  async convertLegacySettings() {
    const adapter = this.app.vault.adapter;
    const configDir = this.app.vault.configDir || ".obsidian";
    const legacyPath = `${configDir}/rtl.json`;

    try {
      if (await this.loadData() != null) return;

      if (this.manifest?.id === "any-rtl") {
        const previousPath =
          `${configDir}/plugins/obsidian-any-rtl/data.json`;

        if (await adapter.exists(previousPath)) {
          const previous = JSON.parse(
            await adapter.read(previousPath)
          );

          if (
            !previous ||
            typeof previous !== "object" ||
            Array.isArray(previous)
          ) {
            throw new Error(
              "Previous plugin settings have an invalid format."
            );
          }

          await this.saveData(previous);

          new import_obsidian3.Notice(
            "Any-RTL: previous plugin settings imported."
          );
          return;
        }
      }

      if (!await adapter.exists(legacyPath)) return;

      const text = await adapter.read(legacyPath);
      if (!text.trim()) return;

      const data = JSON.parse(text);

      if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
      ) {
        throw new Error(
          "Legacy RTL settings have an invalid format."
        );
      }

      await this.saveData(data);
      await adapter.remove(legacyPath);

      new import_obsidian3.Notice(
        "Legacy RTL settings imported."
      );
    } catch (error) {
      console.warn(
        "Any-RTL: legacy settings could not be imported.",
        error
      );
      throw error;
    }
  }

  updateStatusBar(view) {
    if (!this.statusBarItem || !this.statusBarText) return;

    view ||= this.app.workspace.getActiveViewOfType(
      import_obsidian3.MarkdownView
    );

    if (
      !this.settings.statusBar ||
      !(view instanceof import_obsidian3.MarkdownView) ||
      !view.file
    ) {
      this.hideStatusBar();
      return;
    }

    const direction = this.getDocumentDirection(view.editor, view);
    const [required, usedDefault] = this.getRequiredFileDirection(view.file);

    const explicit = direction !== this.settings.defaultDirection;

    this.statusBarText.textContent = MODE_LABELS[direction];

    this.statusBarText.style.fontWeight = explicit ? "700" : "";
    this.statusBarItem.style.removeProperty("display");
  }

  
  hideStatusBar() {
    if (this.statusBarItem) this.statusBarItem.style.display = "none";
  }

  handleIframeEditor(editorDiv, editorView, file, editorPlugin) {
    if (!editorDiv?.closest(".mod-inside-iframe")) return;
    const [direction] = this.getRequiredFileDirection(file);
    this.adjustEditorPlugin(editorView, direction, editorPlugin);
    this.setDocumentDirectionForEditorDiv(editorDiv, direction);
  }
  setMarkdownViewDirection(view, editor, editorView, direction, editorPlugin) {
    if (!view) return;
    direction = isTextDirection(direction) ? direction : this.settings.defaultDirection;
    NOTE_VIEW_DIRECTIONS.set(view, direction);
    this.watchRenderedContent(view);
    if (editorView) this.adjustEditorPlugin(editorView, direction, editorPlugin);
    for (const element of view.contentEl.querySelectorAll(".cm-editor")) {
      if (element.closest(READING_EMBED_SELECTOR)) continue;
      this.setDocumentDirectionForEditorDiv(element, direction);
    }
    for (const element of view.contentEl.querySelectorAll(".markdown-preview-view")) {
      if (element.closest(READING_EMBED_SELECTOR)) continue;
      this.setDocumentDirectionForReadingDiv(element, direction, view.file?.path);
    }
    const titles = Array.from(view.containerEl.querySelectorAll(".inline-title"));
    const header = view.containerEl.parentElement?.querySelector(".view-header-title-container");
    if (header) titles.push(header);
    for (const title of titles) {
      if (!this.settings.setNoteTitleDirection) {
        restoreDirectionState(title);
        continue;
      }
      rememberDirectionState(title);
      if (direction === "ltr" || direction === "rtl") {
        title.style.direction = direction;
        title.setAttribute("dir", direction);
      } else {
        title.style.removeProperty("direction");
        title.setAttribute("dir", "auto");
      }
    }
    editor?.refresh?.();
    this.updateStatusBar(view);
  }
  adjustEditorPlugin(editorView, direction, editorPlugin) {
    if (!editorView) return;
    const supplied = !!editorPlugin;
    const plugin = editorPlugin || editorView.plugin(this.editorPlugin);
    if (plugin) {
      plugin.setDirection(direction, editorView);
      if (!supplied) editorView.dispatch();
    }
    const editor = this.app.workspace.activeEditor?.editor;
    const cellView = editor?.activeCM;
    if (editor?.inTableCell && editor.cm === editorView && cellView && cellView !== editorView) {
      const cellPlugin = cellView.plugin(this.editorPlugin);
      if (cellPlugin) {
        cellPlugin.setDirection(direction, cellView);
        cellView.dispatch();
      }
    }
  }
  setDocumentDirectionForEditorDiv(element, direction) {
    rememberDirectionState(element);

    element.style.direction =
      direction === "ltr" || direction === "rtl" ? direction : "";

    const container = element.parentElement || element;

    this.addDirectionClassToEl(container, direction);

    container.classList.toggle(
      "anyrtl-protect-frontmatter",
      this.settings.preventRTLFrontmatter
    );
  }
  setDocumentDirectionForReadingDiv(element, direction, sourcePath = null) {
    rememberDirectionState(element);
    READING_VIEW_DIRECTIONS.set(element, { direction, sourcePath });
    element.style.direction = direction === "ltr" || direction === "rtl" ? direction : "";
    this.addDirectionClassToEl(element, direction);
    element.classList.remove("rtl-yaml");
    applyReadingDirection(element, direction);
  }
  setPreviewDirectionByFileSettings(path, element) {
    const [direction] = this.getRequiredFileDirection(this.app.vault.getAbstractFileByPath(path));
    this.setDocumentDirectionForReadingDiv(element, direction, path);
  }
  addDirectionClassToEl(element, direction) {
    rememberDirectionState(element);
    element.classList.remove(LTR_CLASS, RTL_CLASS, AUTO_CLASS, ANY_RTL_CLASS);
    const name = { ltr: LTR_CLASS, rtl: RTL_CLASS, auto: AUTO_CLASS, "any-rtl": ANY_RTL_CLASS }[direction];
    element.classList.add(name || AUTO_CLASS);
  }
  switchDocumentDirection(editor, view) {
    let newDirection = this.getDocumentDirection(editor, view);
    if (newDirection === null) {
      new import_obsidian3.Notice("Obsidian RTL can't set the direction of this document");
      return;
    }
    const modes = ["ltr", "rtl", "any-rtl", "auto"];
    newDirection = modes[(modes.indexOf(newDirection) + 1) % modes.length];
    const displayName = MODE_LABELS[newDirection];
    if (view instanceof import_obsidian3.MarkdownView) {
      const editorView = view.editor.cm;
      if (view.file?.path) {
        this.sessionDirections.set(view.file.path, newDirection);
      }
      MANUAL_DIRECTION_VIEWS.add(view);
      this.setMarkdownViewDirection(view, editor, editorView, newDirection);
      if (this.settings.rememberPerFile && view.file && view.file.path) {
        this.settings.fileDirections[view.file.path] = newDirection;
        this.saveSettings();
      }
      new import_obsidian3.Notice(`Document direction set to ${displayName}`, 2e3);
      this.updateStatusBar();
    } else {
      const canvasView = this.getCanvasContext(view);
      if (canvasView) {
        if (view.file)
          new import_obsidian3.Notice("To change a canvas card direction, open the document separately and reload the canvas.");
        else
          new import_obsidian3.Notice("Can't change the direction of a card without a file.");
      }
    }
  }
  getCanvasContext(ctx) {
    if (ctx instanceof import_obsidian3.MarkdownView)
      return null;
    const possibleCanvasContainer = ctx == null ? void 0 : ctx.containerEl;
    if (possibleCanvasContainer && possibleCanvasContainer.hasClass("canvas-node-content"))
      return possibleCanvasContainer;
  }

  getDocumentDirection(_editor, view) {
    if (!(view instanceof import_obsidian3.MarkdownView)) return null;
    return NOTE_VIEW_DIRECTIONS.get(view) || this.getRequiredFileDirection(view.file)[0];
  }
  getFrontMatterDirection(file) {
    const fileCache = this.app.metadataCache.getFileCache(file);
    const frontMatter = fileCache == null ? void 0 : fileCache.frontmatter;
    if (frontMatter && (frontMatter == null ? void 0 : frontMatter.direction)) {
      try {
        const direction = frontMatter.direction;
        return direction;
      } catch (error) {
      }
    }
  }
};

