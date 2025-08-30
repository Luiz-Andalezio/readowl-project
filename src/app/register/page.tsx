"use client";
import Image from "next/image";
import Link from "next/link";
import InputWithIcon from "@/components/ui/InputWithIcon";
import Button from "@/components/ui/Button";
import GoogleButton from "@/components/ui/GoogleButton";

import { useState } from "react";
import { signIn } from "next-auth/react";

function Register() {
    const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (form.password !== form.confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: form.username, email: form.email, password: form.password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao cadastrar");
            setSuccess("Cadastro realizado! Você já pode fazer login.");
            setForm({ username: "", email: "", password: "", confirmPassword: "" });
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Ocorreu um erro desconhecido.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-readowl-purple-extralight">
            <div className="bg-readowl-purple-medium rounded-xl shadow-lg p-8 w-full max-w-md mt-10 mb-10">
                <div className="flex flex-col items-center mb-6">
                    <Image src="/img/mascot/logo.png" alt="Readowl Logo" width={64} height={64} />
                    <span className="text-2xl font-bold text-white mt-2">Readowl</span>
                </div>
                <form onSubmit={handleSubmit}>
                    <InputWithIcon
                        placeholder="Nome de usuário"
                        icon={<Image src="/img/svg/auth/person.svg" alt="User icon" className="opacity-50" width={25} height={25}/>} 
                        name="username"
                        autoComplete="username"
                        value={form.username}
                        onChange={handleChange}
                    />
                    <InputWithIcon
                        placeholder="Email"
                        icon={<Image src="/img/svg/auth/mail.svg" alt="User icon" className="opacity-50" width={25} height={25}/>} 
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={handleChange}
                    />
                    <InputWithIcon
                        placeholder="Senha"
                        icon={<Image src="/img/svg/auth/key.svg" alt="User icon" className="opacity-50" width={25} height={25}/>} 
                        type="password"
                        name="password"
                        autoComplete="new-password"
                        value={form.password}
                        onChange={handleChange}
                    />
                    <InputWithIcon
                        placeholder="Confirmar senha"
                        icon={<Image src="/img/svg/auth/passkey.svg" alt="User icon" className="opacity-50" width={25} height={25}/>} 
                        type="password"
                        name="confirmPassword"
                        autoComplete="new-password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                    />
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <input id="remember" type="checkbox" className="mr-2 accent-readowl-purple" />
                            <label htmlFor="remember" className="text-white text-sm">Lembrar de mim</label>
                        </div>
                    </div>
                    {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
                    {success && <div className="text-green-400 text-sm mb-2">{success}</div>}
                    <Button type="submit" variant="secondary" className="w-full mb-2" disabled={loading}>{loading ? "Cadastrando..." : "Cadastrar"}</Button>
                    <GoogleButton onClick={() => signIn("google")}/>
                    <br />
                    <hr />
                </form>
                <div className="text-center mt-4">
                    <span className="text-white text-sm">Já tenho uma conta. </span>
                    <Link href="/login" className="text-readowl-purple-extralight underline hover:text-white text-sm">Fazer login</Link>
                </div>
                <div className="text-center mt-2">
                    <Link href="/landing" className="text-xs text-readowl-purple-extralight underline hover:text-white">← Voltar para a página inicial</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;