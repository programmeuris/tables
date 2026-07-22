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

const KEY_CLASS =
  "h-full min-h-0 w-full text-2xl font-semibold sm:text-3xl active:brightness-90";

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
      >
        C
      </Button>

      <Button
        type="button"
        variant="secondary"
        onClick={() => onDigit(0)}
        className={KEY_CLASS}
        aria-label="Digit 0"
      >
        0
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={onBackspace}
        className={KEY_CLASS}
        aria-label="Delete"
      >
        <Delete className="!size-7" />
      </Button>

      <Button
        type="button"
        onClick={onSubmit}
        className={cn(KEY_CLASS, "col-span-3 font-bold")}
        aria-label="Submit answer"
      >
        <Equal className="!size-8" />
      </Button>
    </div>
  );
}
