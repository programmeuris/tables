import type { PointerEvent } from "react";
import { Delete, Equal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NumpadProps {
  onDigit: (digit: number) => void;
  onClear: () => void;
  onBackspace: () => void;
  onSubmit: () => void;
  className?: string;
}

const DIGIT_ROWS = [
  [7, 8, 9],
  [4, 5, 6],
  [1, 2, 3],
];

// A vivid pink press state, driven imperatively from pointer events rather than
// CSS :active (which iOS applies unreliably), so a tap is unmistakable.
const KEY_CLASS =
  "h-full min-h-0 w-full text-2xl font-semibold sm:text-3xl " +
  "data-[pressed]:scale-[0.94] data-[pressed]:bg-pink-500 " +
  "data-[pressed]:text-white data-[pressed]:border-pink-500";

// Toggle a data-pressed attribute for the duration of the touch/click. Done
// imperatively (no React state) so a burst of rapid taps stays responsive.
function press(event: PointerEvent<HTMLButtonElement>) {
  event.currentTarget.dataset.pressed = "true";
}
function release(event: PointerEvent<HTMLButtonElement>) {
  delete event.currentTarget.dataset.pressed;
}

const pressHandlers = {
  onPointerDown: press,
  onPointerUp: release,
  onPointerLeave: release,
  onPointerCancel: release,
};

/**
 * A calculator-style numpad: digits 7-9 / 4-6 / 1-3, then Clear / 0 / Delete,
 * with a full-width submit ("=") key beneath. The grid stretches to fill the
 * height of its container so the keys grow with the available screen space.
 */
export function Numpad({
  onDigit,
  onClear,
  onBackspace,
  onSubmit,
  className,
}: NumpadProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-3 grid-rows-[repeat(5,minmax(0,1fr))] gap-2 sm:gap-3",
        className
      )}
    >
      {DIGIT_ROWS.flat().map((digit) => (
        <Button
          key={digit}
          type="button"
          variant="secondary"
          onClick={() => onDigit(digit)}
          className={KEY_CLASS}
          aria-label={`Digit ${digit}`}
          {...pressHandlers}
        >
          {digit}
        </Button>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={onClear}
        className={cn(KEY_CLASS, "text-lg")}
        aria-label="Clear"
        {...pressHandlers}
      >
        C
      </Button>

      <Button
        type="button"
        variant="secondary"
        onClick={() => onDigit(0)}
        className={KEY_CLASS}
        aria-label="Digit 0"
        {...pressHandlers}
      >
        0
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={onBackspace}
        className={KEY_CLASS}
        aria-label="Delete"
        {...pressHandlers}
      >
        <Delete className="!size-7" />
      </Button>

      <Button
        type="button"
        onClick={onSubmit}
        className={cn(KEY_CLASS, "col-span-3 font-bold")}
        aria-label="Submit answer"
        {...pressHandlers}
      >
        <Equal className="!size-8" />
      </Button>
    </div>
  );
}
