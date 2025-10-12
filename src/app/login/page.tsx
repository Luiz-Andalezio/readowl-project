"use client";
import Image from "next/image";
import Link from "next/link";
import InputWithIcon from "@/components/ui/input/InputWithIcon";
import Button from "@/components/ui/button/Button";
import GoogleButton from "@/components/ui/button/GoogleButton";

import { useState } from "react";
import MagicNotification, { MagicNotificationProps } from "@/components/ui/modal/MagicNotification";
import { signIn } from "next-auth/react";

function Login() {
  // State for form fields
  const [form, setForm] = useState({ email: "", password: "" });
  // State to indicate loading during authentication
  const [loading, setLoading] = useState(false);
  // State for error messages for each field
  const [error, setError] = useState<{ email?: string; password?: string } | null>(null);
  // State for toast notifications
  const [toasts, setToasts] = useState<MagicNotificationProps[]>([]);
  // State to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);
  // State to remember login
  const [remember, setRemember] = useState(false);

  // Handles input changes and resets error state
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  // Handles form submission and authentication logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // Attempt to sign in with credentials
    // Persist the remember preference in a cookie for server-side checks (Lax for CSRF safety)
    document.cookie = `rw_rem=${remember ? "yes" : "no"}; Path=/; SameSite=Lax; ${remember ? "Max-Age=2592000;" : ""}`;

    const res = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
      // Pass through for potential server-side use
      remember: remember ? "true" : "false",
    });
    if (res?.error) {
      // Show error if authentication fails
      setError({ email: "Usuário ou senha inválidos.", password: "Usuário ou senha inválidos." });
      pushToast({ message: 'Credenciais inválidas.', icon: '🔐', bgClass: 'bg-red-600/80' });
    } else {
      // Show success and redirect after short delay
      pushToast({ message: 'Login realizado!', icon: '✅', bgClass: 'bg-green-600/80' });
      setTimeout(() => { window.location.href = "/home"; }, 400); // Allows feedback to be shown
    }
    setLoading(false);
  };

  // Removes a toast notification by id
  const removeToast = (id: string) => setToasts(t => t.filter(n => n.id !== id));
  // Adds a new toast notification
  const pushToast = (partial: Omit<MagicNotificationProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, duration: 5000, ...partial, onClose: removeToast }]);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
  <div className="bg-readowl-purple-medium shadow-lg p-8 w-full max-w-md">
        {/* Logo and title */}
        <div className="flex flex-col items-center mb-6">
          <Image src="/icon.png" alt="Readowl Logo" width={64} height={64} />
          <span className="text-2xl font-bold text-white mt-2">Readowl</span>
        </div>
        {/* Google authentication button */}
        <GoogleButton
          onClick={() => {
            document.cookie = `rw_rem=${remember ? "yes" : "no"}; Path=/; SameSite=Lax; ${remember ? "Max-Age=2592000;" : ""}`;
            signIn("google", { callbackUrl: "/home" });
          }}
        />
        <hr />
        {/* Login form */}
        <form onSubmit={handleSubmit} className="mt-4">
          {/* Email input */}
          <InputWithIcon
            placeholder="Email"
            icon={<Image src="/img/svg/auth/person.svg" alt="User icon" className="opacity-50" width={25} height={25} />}
            name="email"
            autoComplete="username"
            value={form.email}
            onChange={handleChange}
            error={error?.email}
            hideErrorText
          />
          {/* Password input with show/hide toggle */}
          <InputWithIcon
            placeholder="Senha"
            icon={<Image src="/img/svg/auth/key.svg" alt="Passkey icon" className="opacity-50" width={25} height={25} />}
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            error={error?.password}
            hideErrorText
            rightIcon={
              <span onClick={() => setShowPassword(v => !v)}>
                <Image src={showPassword ? "/img/svg/auth/eye-off.svg" : "/img/svg/auth/mystery.svg"} alt="Show password" width={22} height={22} />
              </span>
            }
          />
          {/* Toast notifications container */}
          <div className="fixed top-4 right-4 flex flex-col gap-3 z-50 w-full max-w-sm">
            {toasts.map(t => (
              <MagicNotification key={t.id} {...t} onClose={removeToast} />
            ))}
          </div>
          {/* Remember me and forgot password */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="mr-2 accent-readowl-purple"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label htmlFor="remember" className="text-white text-sm">Lembrar de mim</label>
            </div>
            <Link href="/forgot-password" className="text-readowl-purple-extralight underline hover:text-white text-sm">Esqueci minha senha</Link>
          </div>
          {/* Submit button */}
          <div className="flex justify-center">
            <Button type="submit" variant="primary" className="md:w-1/2 text-center" disabled={loading}>
              {loading ? "Logando..." : "Logar"}
            </Button>
          </div>
        </form>
        {/* Registration link */}
        <div className="text-center mt-1">
          <span className="text-white text-sm">Quero criar uma conta. </span>
          <Link href="/register" className="text-readowl-purple-extralight underline hover:text-white text-sm">Cadastrar</Link>
        </div>
        {/* Back to landing page link */}
        <div className="text-center mt-1">
          <Link href="/" className="text-xs text-readowl-purple-extralight underline hover:text-white">← Voltar para a página inicial</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;