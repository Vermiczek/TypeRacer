const Feedback = ({ error, success }: { error: string | null; success: string | null }) => {
  if (error)
    return (
      <p className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-600 dark:text-red-400">
        {error}
      </p>
    );
  if (success)
    return (
      <p className="rounded-lg border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/30 px-3 py-2 text-sm text-green-600 dark:text-green-400">
        {success}
      </p>
    );
  return null;
};

export default Feedback;
