"use client";
import Image from "next/image";
import Link from "next/link";
import InputWithIcon from "@/components/ui/input/InputWithIcon";
import Button from "@/components/ui/button/Button";
import GoogleButton from "@/components/ui/button/GoogleButton";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PasswordStrengthBar from "@/components/ui/PasswordStrengthBar";
import { signIn } from "next-auth/react";
import { User as UserIcon, Mail, Key, Eye, EyeOff } from "lucide-react";

function Register() {
    const router = useRouter();
    // State for form fields
    const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
    // State for loading indicator
    const [loading, setLoading] = useState(false);
    // Simple alert message (success or error)
    const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
    // State for form errors
    const [error, setError] = useState<{ username?: string; email?: string; password?: string; confirmPassword?: string } | null>(null);
    // State to toggle password visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Handles input changes and resets errors
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError(null);
        if (notice) setNotice(null);
    };

    // Handles form submission and validation
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
    setNotice(null);
        const localError: typeof error = {};
        // Validate required fields
        if (!form.username) localError.username = "Informe o nome de usuário.";
        if (!form.email) localError.email = "Informe o email.";
        if (!form.password) localError.password = "Informe a senha.";
        // Validate password length
        if (form.password && form.password.length < 6) localError.password = "A senha deve ter pelo menos 6 caracteres.";
        // Validate email format
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) localError.email = "Formato de email inválido.";
        // Validate password confirmation
        if (form.password !== form.confirmPassword) localError.confirmPassword = "As senhas não coincidem.";
        // If there are validation errors, show the first one as a toast
        if (Object.keys(localError).length > 0) {
            setError(localError);
            const first = Object.values(localError)[0];
            if (first) setNotice({ type: "error", message: String(first) });
            return;
        }
        setLoading(true);
        try {
            // Send registration request to API
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: form.username, email: form.email, password: form.password })
            });
            const data = await res.json();
            // Handle API errors
            if (!res.ok) {
                if (typeof data.error === "object" && data.error !== null) {
                    setError(data.error);
                    const first = Object.values(data.error)[0];
                    if (first) setNotice({ type: "error", message: String(first) });
                } else if (typeof data.error === "string") {
                    setError({ password: data.error });
                    setNotice({ type: "error", message: data.error });
                }
                return;
            }
            // Registration successful -> auto sign-in with the same credentials
            // Prefer non-redirect signIn to capture outcome, then route manually
            const result = await signIn("credentials", {
                redirect: false,
                email: form.email,
                password: form.password,
                // persist session similar to OAuth default
                remember: "true",
                callbackUrl: "/home",
            });
            if (result?.error) {
                // Fallback: if for algum motivo falhar o sign-in automático, direciona para login
                setNotice({ type: "success", message: "Cadastro concluído! Faça login." });
                router.push("/login");
                return;
            }
            // Go to home (or whatever URL NextAuth suggests)
            router.push(result?.url || "/home");
    } catch {
            // Handle unexpected errors
            setError({ password: "Ocorreu um erro desconhecido." });
            setNotice({ type: "error", message: "Erro inesperado. Tente novamente." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center">
            <div className="bg-readowl-purple-medium shadow-lg p-8 w-full max-w-md mt-10 mb-10">
                {/* Logo and title */}
                <div className="flex flex-col items-center mb-6">
                    <Image src="/icon.png" alt="Readowl Logo" width={64} height={64} />
                    <span className="text-2xl font-bold text-white mt-2">Readowl</span>
                </div>

                {/* Inline alert */}
                {notice && (
                    <div
                        role="alert"
                        aria-live="assertive"
                        className={`${notice.type === "success" ? "bg-green-600/80" : "bg-red-600/80"} text-white px-3 py-2 mb-3`}
                    >
                        {notice.message}
                    </div>
                )}

                {/* Google sign-in button */}
                <GoogleButton aria-label="Continuar com Google" onClick={() => signIn("google", { callbackUrl: "/home" })} />
                <hr />
                {/* Registration form */}
                <form onSubmit={handleSubmit} className="mt-4">
                    {/* Username input */}
                    <InputWithIcon
                        placeholder="Nome de usuário"
                        icon={<UserIcon className="opacity-50 w-6 h-6" />}
                        name="username"
                        autoComplete="username"
                        value={form.username}
                        onChange={handleChange}
                        error={error?.username}
                        hideErrorText
                    />
                    {/* Email input */}
                    <InputWithIcon
                        placeholder="Email"
                        icon={<Mail className="opacity-50 w-6 h-6" />}
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={handleChange}
                        error={error?.email}
                        hideErrorText
                    />
                    {/* Password input with show/hide toggle */}
                    <InputWithIcon
                        placeholder="Senha"
                        icon={<Key className="opacity-50 w-6 h-6" />}
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete="new-password"
                        value={form.password}
                        onChange={handleChange}
                        error={error?.password}
                        hideErrorText
                        rightIcon={
                            <span onClick={() => setShowPassword(v => !v)}>
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </span>
                        }
                    />
                    {/* Password strength indicator */}
                    <PasswordStrengthBar password={form.password} tipTextColor="text-white" showPercent />
                    {/* Confirm password input with show/hide toggle */}
                    <InputWithIcon
                        placeholder="Confirmar senha"
                        icon={<Key className="opacity-50 w-6 h-6" />}
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        autoComplete="new-password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        error={error?.confirmPassword}
                        hideErrorText
                        rightIcon={
                            <span onClick={() => setShowConfirmPassword(v => !v)}>
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </span>
                        }
                    />
                    {/* Submit button */}
                    <div className="flex justify-center">
                        <Button type="submit" variant="secondary" className="md:w-1/2 text-center" disabled={loading} aria-busy={loading}>
                            {loading ? "Cadastrando..." : "Cadastrar"}
                        </Button>
                    </div>
                </form>
                {/* Link to login page */}
                <div className="text-center mt-1">
                    <span className="text-white text-sm">Já tenho uma conta. </span>
                    <Link href="/login" className="text-readowl-purple-extralight underline hover:text-white text-sm">Fazer login</Link>
                </div>
                {/* Link to landing page */}
                <div className="text-center mt-2">
                    <Link href="/" className="text-xs text-readowl-purple-extralight underline hover:text-white">← Voltar para a página inicial</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;