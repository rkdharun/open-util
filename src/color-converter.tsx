import { Action, ActionPanel, Clipboard, Icon, List } from "@raycast/api";
import { colord, extend } from "colord";
import namesPlugin from "colord/plugins/names";
import hwbPlugin from "colord/plugins/hwb";
import cmykPlugin from "colord/plugins/cmyk";
import { useEffect, useMemo, useState } from "react";

extend([namesPlugin, hwbPlugin, cmykPlugin]);

interface ColorFormat {
  id: string;
  label: string;
  value: string;
}

function convertColor(input: string): { formats: ColorFormat[]; hex: string; error: string | null } {
  if (!input.trim()) return { formats: [], hex: "", error: null };

  try {
    const c = colord(input.trim());
    if (!c.isValid()) return { formats: [], hex: "", error: "Invalid color format" };

    const rgb = c.toRgb();
    const hsl = c.toHsl();
    const hsv = c.toHsv();
    const hex = c.toHex();
    const cmyk = c.toCmyk();

    // Android / Java color integer
    const androidInt = (rgb.a !== undefined ? Math.round(rgb.a * 255) : 255) * 16777216 + rgb.r * 65536 + rgb.g * 256 + rgb.b;

    const formats: ColorFormat[] = [
      { id: "hex", label: "HEX", value: hex },
      { id: "hex-upper", label: "HEX (uppercase)", value: hex.toUpperCase() },
      { id: "rgb", label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
      { id: "rgba", label: "RGBA", value: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a ?? 1})` },
      { id: "hsl", label: "HSL", value: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)` },
      { id: "hsla", label: "HSLA", value: `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%, ${hsl.a ?? 1})` },
      { id: "hsv", label: "HSV", value: `hsv(${Math.round(hsv.h)}, ${Math.round(hsv.s)}%, ${Math.round(hsv.v)}%)` },
      { id: "rgb-pct", label: "RGB (percent)", value: `rgb(${(rgb.r / 255 * 100).toFixed(1)}%, ${(rgb.g / 255 * 100).toFixed(1)}%, ${(rgb.b / 255 * 100).toFixed(1)}%)` },
      { id: "cmyk", label: "CMYK", value: `cmyk(${Math.round(cmyk.c)}%, ${Math.round(cmyk.m)}%, ${Math.round(cmyk.y)}%, ${Math.round(cmyk.k)}%)` },
      { id: "css-filter", label: "CSS (filter none)", value: hex },
      { id: "swift-uicolor", label: "Swift UIColor", value: `UIColor(red: ${(rgb.r/255).toFixed(3)}, green: ${(rgb.g/255).toFixed(3)}, blue: ${(rgb.b/255).toFixed(3)}, alpha: 1.0)` },
      { id: "swift-color", label: "Swift Color", value: `Color(red: ${(rgb.r/255).toFixed(3)}, green: ${(rgb.g/255).toFixed(3)}, blue: ${(rgb.b/255).toFixed(3)})` },
      { id: "objc", label: "Objective-C", value: `[UIColor colorWithRed:${(rgb.r/255).toFixed(3)}f green:${(rgb.g/255).toFixed(3)}f blue:${(rgb.b/255).toFixed(3)}f alpha:1.0f]` },
      { id: "android", label: "Android (Java)", value: `Color.argb(255, ${rgb.r}, ${rgb.g}, ${rgb.b})` },
      { id: "android-hex", label: "Android (HEX)", value: `#FF${hex.slice(1).toUpperCase()}` },
      { id: "dotnet", label: ".NET (C#)", value: `Color.FromArgb(255, ${rgb.r}, ${rgb.g}, ${rgb.b})` },
      { id: "css-var", label: "CSS Variable", value: `--color: ${hex};` },
      { id: "brightness", label: "Brightness", value: c.brightness().toFixed(4) },
      { id: "is-dark", label: "Is Dark?", value: c.isDark() ? "Yes" : "No" },
      { id: "is-light", label: "Is Light?", value: c.isLight() ? "Yes" : "No" },
    ];

    return { formats, hex, error: null };
  } catch (e) {
    return { formats: [], hex: "", error: e instanceof Error ? e.message : String(e) };
  }
}

export default function ColorConverter() {
  const [input, setInput] = useState("");

  useEffect(() => {
    Clipboard.readText().then((t) => {
      if (t && (t.trim().startsWith("#") || t.trim().startsWith("rgb") || t.trim().startsWith("hsl"))) {
        setInput(t.trim());
      }
    });
  }, []);

  const { formats, hex, error } = useMemo(() => convertColor(input), [input]);

  return (
    <List
      searchBarPlaceholder="Enter color: #ff0000, rgb(255,0,0), hsl(0,100%,50%)..."
      onSearchTextChange={setInput}
      searchText={input}
    >
      {error ? (
        <List.EmptyView title={error} icon={Icon.Warning} />
      ) : formats.length === 0 ? (
        <List.EmptyView title="Enter a color to convert" icon={Icon.EyeDropper} description="Supports HEX, RGB, RGBA, HSL, HSLA, HSV, named colors" />
      ) : (
        <>
          {hex && (
            <List.Section title={`Color: ${hex}`}>
              {formats.map((f) => (
                <List.Item
                  key={f.id}
                  title={f.value}
                  subtitle={f.label}
                  accessories={[{ text: f.label }]}
                  actions={
                    <ActionPanel>
                      <Action.CopyToClipboard title={`Copy ${f.label}`} content={f.value} />
                      <Action.CopyToClipboard
                        title="Copy All Formats"
                        content={formats.map((x) => `${x.label}: ${x.value}`).join("\n")}
                        shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                      />
                    </ActionPanel>
                  }
                />
              ))}
            </List.Section>
          )}
        </>
      )}
    </List>
  );
}
