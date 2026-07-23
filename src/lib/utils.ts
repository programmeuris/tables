import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// iOS Safari does not implement the Vibration API. As a best-effort fallback we
// toggle a hidden native "switch" control, which produces a subtle system
// haptic on recent iOS when triggered inside a user gesture. Created lazily and
// reused. This is a progressive enhancement — it may do nothing on some
// devices, which is fine.
let iosHapticLabel: HTMLLabelElement | null = null;

function iosHapticTick() {
  if (typeof document === "undefined") return;
  try {
    if (!iosHapticLabel) {
      const label = document.createElement("label");
      label.setAttribute("aria-hidden", "true");
      label.style.cssText =
        "position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.setAttribute("switch", "");
      input.tabIndex = -1;
      label.appendChild(input);
      (document.body ?? document.documentElement).appendChild(label);
      iosHapticLabel = label;
    }
    iosHapticLabel.click();
  } catch {
    /* best-effort only */
  }
}

/**
 * Trigger a short haptic where supported. A single number is a duration in ms;
 * an array alternates vibrate/pause (Vibration API, mostly Android). Falls back
 * to an iOS best-effort tick, and silently no-ops where neither is available.
 * Must be called from within a user gesture.
 */
export function haptic(pattern: number | number[] = 10) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      if (navigator.vibrate(pattern)) return;
    } catch {
      /* fall through to the iOS fallback */
    }
  }
  iosHapticTick();
}
