const SubmitButton = ({ loading, label }: { loading: boolean; label: string }) => {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-2 w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Loading..." : label}
    </button>
  );
};

export default SubmitButton;
