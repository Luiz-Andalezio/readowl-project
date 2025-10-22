"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import InputWithIcon from "@/components/ui/input/InputWithIcon";
import Button from "@/components/ui/button/Button";
import PasswordStrengthBar from "@/components/ui/PasswordStrengthBar";
import { Key, Eye, EyeOff } from "lucide-react";

function ResetPasswordInner() {
  const search = useSearchParams();
  const router = useRouter();
  const token = search?.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);

  // Fetch whose account is being reset (given the token)
  useEffect(() => {
    let active = true;
    (async () => {
      if (!token) return;
      try {
        const u = new URL("/api/auth/password/who", window.location.origin);
        u.searchParams.set("token", token);
        const res = await fetch(u.toString());
        if (!active) return;
        if (res.ok) {
          const j = (await res.json()) as { email?: string; name?: string };
          setAccountEmail(j.email ?? null);
          setAccountName(j.name ?? null);
        } else {
          setAccountEmail(null);
          setAccountName(null);
        }
      } catch {
        // ignore
      }
    })();
    return () => { active = false; };
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError("Senha muito curta (mín. 6)"); return; }
    if (password !== confirm) { setError("As senhas não coincidem"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/password/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    if (res.ok) { setOk(true); setTimeout(() => router.push("/reset-password/success"), 800); }
    else {
      const j: unknown = await res.json().catch(() => ({}));
      const err = typeof j === "object" && j && "error" in (j as Record<string, unknown>) ? (j as { error?: string }).error : undefined;
      setError(err ?? "Não foi possível redefinir a senha. Verifique o link e tente novamente.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-readowl-purple-medium shadow-lg p-8 w-full max-w-md text-white">
        <h1 className="text-2xl font-bold mb-1">Redefinir senha</h1>
        {accountEmail && (
          <p className="text-readowl-purple-extralight mb-3 text-sm">
            Conta: <span className="text-white">{accountName ? `${accountName} ` : ""}({accountEmail})</span>
          </p>
        )}
        {!token ? (
          <p className="text-readowl-purple-extralight">Link inválido ou ausente. Solicite uma nova redefinição.</p>
        ) : ok ? (
          <p className="text-readowl-purple-extralight">Senha redefinida! Redirecionando…</p>
        ) : (
          <form onSubmit={submit}>
            {error && <p className="text-red-300 mb-2">{error}</p>}
            <InputWithIcon
              placeholder="Nova senha"
              icon={<Key className="w-5 h-5" />}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              rightIcon={
                <span onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </span>
              }
            />
            <PasswordStrengthBar password={password} tipTextColor="text-white" showPercent />
            <InputWithIcon
              placeholder="Confirmar senha"
              icon={<Key className="w-5 h-5" />}
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              rightIcon={
                <span onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </span>
              }
            />
            <div className="flex justify-center">
              <Button type="submit" disabled={loading} className="md:w-1/2">{loading ? "Salvando...": "Salvar"}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
