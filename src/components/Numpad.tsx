import { Delete, Equal } from "lucide-react";

import { Button } from "@/components/ui/button";

interface NumpadProps {
  onDigit: (digit: number) => void;
  onClear: () => void;
  onBackspace: () => void;
  onSubmit: () => void;
}

const DIGIT_ROWS = [
  [7, 8, 9],
  [4, 5, 6],
  [1, 2, 3],
];

/**
 * A calculator-style numpad: digits 7-9 / 4-6 / 1-3, then Clear / 0 / Delete,
 * with a full-width submit ("=") key beneath.
 */
export function Numpad({
  onDigit,
  onClear,
  onBackspace,
  onSubmit,
}: NumpadProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {DIGIT_ROWS.flat().map((digit) => (
        <Button
          key={digit}
          type="button"
          variant="secondary"
          onClick={() => onDigit(digit)}
          className="h-16 text-2xl font-semibold sm:h-20"
          aria-label={`Digit ${digit}`}
        >
          {digit}
        </Button>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={onClear}
        className="h-16 text-base font-semibold sm:h-20"
        aria-label="Clear"
      >
        C
      </Button>

      <Button
        type="button"
        variant="secondary"
        onClick={() => onDigit(0)}
        className="h-16 text-2xl font-semibold sm:h-20"
        aria-label="Digit 0"
      >
        0
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={onBackspace}
        className="h-16 sm:h-20"
        aria-label="Delete"
      >
        <Delete className="!size-6" />
      </Button>

      <Button
        type="button"
        onClick={onSubmit}
        className="col-span-3 h-16 text-2xl font-bold sm:h-20"
        aria-label="Submit answer"
      >
        <Equal className="!size-7" />
      </Button>
    </div>
  );
}
