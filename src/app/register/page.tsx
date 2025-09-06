"use client";
import Image from "next/image";
import Link from "next/link";
import InputWithIcon from "@/components/ui/InputWithIcon";
import Button from "@/components/ui/Button";
import GoogleButton from "@/components/ui/GoogleButton";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PasswordStrengthBar from "@/components/ui/PasswordStrengthBar";
import MagicNotification, { MagicNotificationProps } from "@/components/ui/MagicNotification";
import { signIn } from "next-auth/react";

function Register() {
    const router = useRouter();
    // State for form fields
    const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
    // State for loading indicator
    const [loading, setLoading] = useState(false);
    // State for notification toasts
    const [toasts, setToasts] = useState<MagicNotificationProps[]>([]);
    // State for form errors
    const [error, setError] = useState<{ username?: string; email?: string; password?: string; confirmPassword?: string } | null>(null);
    // State for success message
    const [success, setSuccess] = useState("");
    // State to toggle password visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Handles input changes and resets errors
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError(null);
    };

    // Handles form submission and validation
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess("");
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
            // Show the first error message as a toast
            const first = Object.values(localError)[0];
            if (first) pushToast({ message: first, icon: '⚠️', bgClass: 'bg-red-500/80' });
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
                    if (first) pushToast({ message: String(first), icon: '🚫', bgClass: 'bg-red-600/80' });
                } else if (typeof data.error === "string") {
                    setError({ password: data.error });
                    pushToast({ message: data.error, icon: '🚫', bgClass: 'bg-red-600/80' });
                }
                return;
            }
            // Registration successful
            setSuccess("Cadastro realizado! Redirecionando...");
            pushToast({ message: 'Cadastro concluído! Faça login.', icon: '✅', bgClass: 'bg-green-600/80' });
            setForm({ username: "", email: "", password: "", confirmPassword: "" });
            // Redirect immediately to login page
            router.push("/login");
        } catch (err: unknown) {
            // Handle unexpected errors
            setError({ password: "Ocorreu um erro desconhecido." });
            pushToast({ message: 'Erro inesperado. Tente novamente.', icon: '💥', bgClass: 'bg-red-700/80' });
        } finally {
            setLoading(false);
        }
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
            <div className="bg-readowl-purple-medium rounded-xl shadow-lg p-8 w-full max-w-md mt-10 mb-10">
                {/* Logo and title */}
                <div className="flex flex-col items-center mb-6">
                    <Image src="/img/mascot/logo.png" alt="Readowl Logo" width={64} height={64} />
                    <span className="text-2xl font-bold text-white mt-2">Readowl</span>
                </div>

                {/* Google sign-in button */}
                <GoogleButton onClick={() => signIn("google", { callbackUrl: "/home" })}></GoogleButton>
                <hr />
                {/* Registration form */}
                <form onSubmit={handleSubmit} className="mt-4">
                    {/* Username input */}
                    <InputWithIcon
                        placeholder="Nome de usuário"
                        icon={<Image src="/img/svg/auth/person.svg" alt="User icon" className="opacity-50" width={25} height={25} />}
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
                        icon={<Image src="/img/svg/auth/mail.svg" alt="Mail icon" className="opacity-50" width={25} height={25} />}
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
                        icon={<Image src="/img/svg/auth/key.svg" alt="User icon" className="opacity-50" width={25} height={25} />}
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete="new-password"
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
                    {/* Password strength indicator */}
                    <PasswordStrengthBar password={form.password} tipTextColor="text-white" showPercent />
                    {/* Confirm password input with show/hide toggle */}
                    <InputWithIcon
                        placeholder="Confirmar senha"
                        icon={<Image src="/img/svg/auth/passkey.svg" alt="User icon" className="opacity-50" width={25} height={25} />}
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        autoComplete="new-password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        error={error?.confirmPassword}
                        hideErrorText
                        rightIcon={
                            <span onClick={() => setShowConfirmPassword(v => !v)}>
                                <Image src={showConfirmPassword ? "/img/svg/auth/eye-off.svg" : "/img/svg/auth/mystery.svg"} alt="Show password" width={22} height={22} />
                            </span>
                        }
                    />
                    {/* Toast notifications container */}
                    <div className="fixed top-4 right-4 flex flex-col gap-3 z-50 w-full max-w-sm">
                        {toasts.map(t => (
                            <MagicNotification key={t.id} {...t} onClose={removeToast} />
                        ))}
                    </div>
                    {/* Submit button */}
                    <div className="flex justify-center">
                        <Button type="submit" variant="secondary" className="md:w-1/2 text-center" disabled={loading}>
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