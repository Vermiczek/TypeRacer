interface GameInputProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  isIdle: boolean;
  controls?: React.ReactNode;
}

const GameInput = ({ inputRef, value, onChange, disabled, isIdle, controls }: GameInputProps) => (
  <div className="space-y-3">
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={isIdle ? "Start typing to begin…" : undefined}
      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 font-mono text-base text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
    />
    {controls && <div className="flex items-center justify-between gap-2">{controls}</div>}
  </div>
);

export default GameInput;
