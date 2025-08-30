"use client";
import Image from "next/image";
import Link from "next/link";
import InputWithIcon from "@/components/ui/InputWithIcon";
import Button from "@/components/ui/Button";
import GoogleButton from "@/components/ui/GoogleButton";

import { useState } from "react";
import { signIn } from "next-auth/react";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
    });
    if (res?.error) {
      setError("Usuário ou senha inválidos.");
    } else {
      window.location.href = "/home";
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-readowl-purple-extralight">
      <div className="bg-readowl-purple-medium rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Image src="/img/mascot/logo.png" alt="Readowl Logo" width={64} height={64} />
          <span className="text-2xl font-bold text-white mt-2">Readowl</span>
        </div>
        <form onSubmit={handleSubmit}>
          <InputWithIcon
            placeholder="Email"
            icon={<Image src="/img/svg/auth/person.svg" alt="User icon" className="opacity-50" width={25} height={25}/>} 
            name="email"
            autoComplete="username"
            value={form.email}
            onChange={handleChange}
          />
          <InputWithIcon
            placeholder="Senha"
            icon={<Image src="/img/svg/auth/key.svg" alt="Passkey icon" className="opacity-50" width={25} height={25} />} 
            type="password"
            name="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
          />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <input id="remember" type="checkbox" className="mr-2 accent-readowl-purple" />
              <label htmlFor="remember" className="text-white text-sm">Lembrar de mim</label>
            </div>
            <Link href="#" className="text-readowl-purple-extralight underline hover:text-white text-sm">Esqueci minha senha</Link>
          </div>
          {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
          <Button type="submit" variant="primary" className="w-full mb-2" disabled={loading}>{loading ? "Logando..." : "Logar"}</Button>
          <GoogleButton onClick={() => signIn("google")}/>
          <br />
          <hr />
        </form>
        <div className="text-center mt-4">
          <span className="text-white text-sm">Quero criar uma conta. </span>
          <Link href="/register" className="text-readowl-purple-extralight underline hover:text-white text-sm">Cadastrar</Link>
        </div>
        <div className="text-center mt-2">
          <Link href="/landing" className="text-xs text-readowl-purple-extralight underline hover:text-white">← Voltar para a página inicial</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;