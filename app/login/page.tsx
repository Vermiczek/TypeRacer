"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/app/components/ThemeToggle";
import Field from "./components/Field";
import Feedback from "./components/Feedback";
import SubmitButton from "./components/SubmitButton";
import PasswordStrengthBar from "./components/PasswordStrengthBar";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = signInSchema.extend({
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores"),
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;
type Mode = "signin" | "signup";

const LoginPage = () => {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("signin");
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
  });

  const activeForm = mode === "signin" ? signInForm : signUpForm;

  const switchMode = (next: Mode) => {
    setMode(next);
    setServerError(null);
    setSuccessMessage(null);
    signInForm.reset();
    signUpForm.reset();
  };

  const onSignIn = async (values: SignInValues) => {
    setServerError(null);
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setServerError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  };

  const onSignUp = async (values: SignUpValues) => {
    setServerError(null);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { username: values.username } },
    });
    if (error) {
      setServerError(error.message);
      return;
    }
    setSuccessMessage("Check your email to confirm your account.");
  };

  const isSubmitting = activeForm.formState.isSubmitting;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            TypeRacer
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Real-time typing competition
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-8 shadow-xl dark:shadow-none">
          {/* Mode toggle */}
          <div className="mb-6 flex rounded-lg bg-zinc-200 dark:bg-zinc-800 p-1">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                  mode === m
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {mode === "signin" ? (
            <form
              onSubmit={signInForm.handleSubmit(onSignIn)}
              className="space-y-4"
              noValidate
            >
              <Field
                label="Email"
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                registration={signInForm.register("email")}
                error={signInForm.formState.errors.email?.message}
              />
              <Field
                label="Password"
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                registration={signInForm.register("password")}
                error={signInForm.formState.errors.password?.message}
              />
              <Feedback error={serverError} success={successMessage} />
              <SubmitButton loading={isSubmitting} label="Sign in" />
            </form>
          ) : (
            <form
              onSubmit={signUpForm.handleSubmit(onSignUp)}
              className="space-y-4"
              noValidate
            >
              <Field
                label="Username"
                id="username"
                type="text"
                placeholder="speedster42"
                autoComplete="username"
                registration={signUpForm.register("username")}
                error={signUpForm.formState.errors.username?.message}
              />
              <Field
                label="Email"
                id="email-signup"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                registration={signUpForm.register("email")}
                error={signUpForm.formState.errors.email?.message}
              />
              <Field
                label="Password"
                id="password-signup"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                registration={signUpForm.register("password")}
                error={signUpForm.formState.errors.password?.message}
              />
              <PasswordStrengthBar password={signUpForm.watch("password") ?? ""} />
              <Feedback error={serverError} success={successMessage} />
              <SubmitButton loading={isSubmitting} label="Create account" />
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
