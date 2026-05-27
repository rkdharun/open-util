import { Action, ActionPanel, Form, showInFinder, showToast, Toast } from "@raycast/api";
import { execFileSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { basename, dirname, extname, join } from "path";
import { tmpdir } from "os";
import { useState } from "react";

type OutputFormat = "png" | "jpeg" | "webp" | "tiff" | "bmp" | "gif";

const FORMAT_EXT: Record<OutputFormat, string> = {
  png: "png",
  jpeg: "jpg",
  webp: "webp",
  tiff: "tiff",
  bmp: "bmp",
  gif: "gif",
};

const SVG_EXTS = new Set([".svg"]);
const RASTER_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".tiff", ".tif", ".bmp", ".gif"]);

function convert(inputPath: string, format: OutputFormat, quality: number): string {
  const ext = extname(inputPath).toLowerCase();
  let sourcePath = inputPath;

  if (SVG_EXTS.has(ext)) {
    const tmpDir = join(tmpdir(), `devutils-img-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    execFileSync("/usr/bin/qlmanage", ["-t", "-s", "2000", "-o", tmpDir, inputPath], {
      stdio: "pipe",
    });
    const rendered = join(tmpDir, `${basename(inputPath)}.png`);
    if (!existsSync(rendered)) {
      throw new Error("SVG rendering failed — QuickLook could not process the file");
    }
    sourcePath = rendered;
    if (format === "png") {
      const outPath = buildOutputPath(inputPath, ext, "png");
      execFileSync("/bin/cp", [sourcePath, outPath]);
      return outPath;
    }
  } else if (!RASTER_EXTS.has(ext)) {
    throw new Error(`Unsupported input format: ${ext}`);
  }

  const outPath = buildOutputPath(inputPath, ext, FORMAT_EXT[format]);

  const args: string[] = [];
  if (format === "jpeg" || format === "webp") {
    args.push("--setProperty", "formatOptions", String(quality));
  }
  args.push("--setProperty", "format", format, sourcePath, "--out", outPath);

  execFileSync("/usr/bin/sips", args, { stdio: "pipe" });
  return outPath;
}

function buildOutputPath(inputPath: string, inputExt: string, outExt: string): string {
  const base = basename(inputPath, inputExt);
  const dir = dirname(inputPath);
  let outPath = join(dir, `${base}.${outExt}`);
  // Avoid overwriting source when extension matches
  if (outPath === inputPath) {
    outPath = join(dir, `${base}-converted.${outExt}`);
  }
  return outPath;
}

export default function ImageConverter() {
  const [files, setFiles] = useState<string[]>([]);
  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState("85");
  const [lastOutput, setLastOutput] = useState<string | null>(null);

  const isLossy = format === "jpeg" || format === "webp";
  const inputExt = files[0] ? extname(files[0]).toLowerCase() : null;
  const isSvg = inputExt === ".svg";

  async function handleConvert() {
    if (files.length === 0) {
      await showToast({ style: Toast.Style.Failure, title: "Select an image file" });
      return;
    }

    const q = Math.min(100, Math.max(1, parseInt(quality, 10) || 85));
    const toast = await showToast({ style: Toast.Style.Animated, title: "Converting…" });

    try {
      const outputPath = convert(files[0], format, q);
      setLastOutput(outputPath);
      toast.style = Toast.Style.Success;
      toast.title = "Converted";
      toast.message = basename(outputPath);
    } catch (e) {
      toast.style = Toast.Style.Failure;
      toast.title = "Conversion failed";
      toast.message = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action title="Convert Image" onAction={handleConvert} shortcut={{ modifiers: ["cmd"], key: "return" }} />
          {lastOutput && (
            <Action
              title="Show in Finder"
              onAction={() => showInFinder(lastOutput!)}
              shortcut={{ modifiers: ["cmd"], key: "f" }}
            />
          )}
        </ActionPanel>
      }
    >
      <Form.FilePicker
        id="file"
        title="Input Image"
        allowMultipleSelection={false}
        value={files}
        onChange={setFiles}
      />
      <Form.Dropdown
        id="format"
        title="Output Format"
        value={format}
        onChange={(v) => setFormat(v as OutputFormat)}
      >
        <Form.Dropdown.Item value="png" title="PNG — lossless" />
        <Form.Dropdown.Item value="jpeg" title="JPEG — lossy, great for photos" />
        <Form.Dropdown.Item value="webp" title="WebP — modern, smaller size (macOS 12+)" />
        <Form.Dropdown.Item value="tiff" title="TIFF — high quality, uncompressed" />
        <Form.Dropdown.Item value="bmp" title="BMP — legacy bitmap" />
        <Form.Dropdown.Item value="gif" title="GIF — legacy animated format" />
      </Form.Dropdown>
      {isLossy && (
        <Form.TextField
          id="quality"
          title="Quality (1–100)"
          value={quality}
          onChange={setQuality}
          placeholder="85"
        />
      )}
      {isSvg && (
        <Form.Description
          title="SVG note"
          text="SVG is rendered at 2000px via QuickLook before converting. The result may differ from browser rendering."
        />
      )}
      <Form.Description
        title="Output location"
        text="Converted file is saved in the same folder as the source image."
      />
    </Form>
  );
}
