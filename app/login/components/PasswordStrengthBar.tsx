const getPasswordStrength = (pw: string): 0 | 1 | 2 | 3 => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return 1;
  if (score === 2) return 2;
  return 3;
};

const PasswordStrengthBar = ({ password }: { password: string }) => {
  if (!password) return null;
  const strength = getPasswordStrength(password);
  const labels = ["", "Weak", "Fair", "Strong"];
  const colors = ["", "bg-red-500", "bg-amber-400", "bg-emerald-500"];
  const textColors = [
    "",
    "text-red-500 dark:text-red-400",
    "text-amber-500 dark:text-amber-400",
    "text-emerald-500 dark:text-emerald-400",
  ];
  return (
    <div className="-mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= strength ? colors[strength] : "bg-zinc-200 dark:bg-zinc-700"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${textColors[strength]}`}>{labels[strength]}</p>
    </div>
  );
};

export default PasswordStrengthBar;
