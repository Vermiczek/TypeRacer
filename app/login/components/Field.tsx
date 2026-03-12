import { useForm } from "react-hook-form";

type FieldProps = {
  label: string;
  id: string;
  type: string;
  placeholder: string;
  autoComplete?: string;
  registration: ReturnType<ReturnType<typeof useForm>["register"]>;
  error?: string;
};

const Field = ({ label, id, type, placeholder, autoComplete, registration, error }: FieldProps) => {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        {...registration}
        className={`w-full rounded-lg border bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
          error ? "border-red-500 dark:border-red-600" : "border-zinc-300 dark:border-zinc-700"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default Field;
