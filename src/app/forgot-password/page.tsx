"use client";
import { useState } from "react";
import InputWithIcon from "@/components/ui/input/InputWithIcon";
import Button from "@/components/ui/button/Button";
import Link from "next/link";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/password/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-readowl-purple-medium shadow-lg p-8 w-full max-w-md text-white">
        <h1 className="text-2xl font-bold mb-4">Recuperar senha</h1>
        {sent ? (
          <div>
            <p className="text-readowl-purple-extralight mb-4">
              Se o email: <span className="text-white">{email}</span> existir e for compatível com o registrado na sua conta, enviaremos um link de redefinição em instantes. Confira também a caixa de spam.
            </p>
            <div className="flex justify-center">
              <Link href="/login" className="inline-block">
                <Button type="button" variant="secondary">Voltar ao login</Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p className="text-sm text-readowl-purple-extralight mb-2">Informe seu email para receber um link de redefinição. Por segurança, não indicamos se o email existe ou não.</p>
            <InputWithIcon
              placeholder="Seu email"
              icon={<Mail className="w-5 h-5" />}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="flex justify-center">
              <Button type="submit" disabled={loading} className="md:w-1/2">{loading ? "Enviando..." : "Enviar"}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
