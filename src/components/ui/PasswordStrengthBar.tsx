import React from "react";

interface Props {
  password: string;
  tipTextColor?: string;
  showPercent?: boolean;
}

const getStrength = (password: string) => {
  const checks = {
    min: password.length >= 6,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
    long: password.length >= 10,
  };
  if (!password) return { score: 0, checks };
  let score = 0;
  if (checks.min) score += 1;
  if (checks.upper) score += 1;
  if (checks.number) score += 1;
  if (checks.symbol) score += 1;
  if (checks.long) score += 1;
  return { score, checks };
};

const colors = [
  "bg-readowl-purple-extralight",
  "bg-readowl-purple-light",
  "bg-readowl-purple",
  "bg-readowl-purple-dark",
  "bg-readowl-purple-extradark",
];


const baseMessages = {
  start: "Comece digitando sua senha...",
  short: "Use pelo menos 6 caracteres para iniciar a jornada!",
  strong: "Senha digna de um guardião de livros! 🦉",
};

const buildTip = (password: string, score: number, checks: ReturnType<typeof getStrength>["checks"]) => {
  if (!password) return baseMessages.start;
  if (!checks.min) return baseMessages.short;
  if (score === 5) return baseMessages.strong;
  const missing: string[] = [];
  if (!checks.upper) missing.push("uma LETRA MAIÚSCULA");
  if (!checks.number) missing.push("um NÚMERO");
  if (!checks.symbol) missing.push("um SÍMBOLO");
  if (!checks.long) missing.push("mais COMPRIMENTO (10+)");
  if (missing.length === 0) return baseMessages.strong;
  return `Dica: adicione ${missing.slice(0, 2).join(" e ")}${missing.length > 2 ? "..." : ""}`;
};

const PasswordStrengthBar: React.FC<Props> = ({ password, tipTextColor, showPercent = true }) => {
  const { score, checks } = getStrength(password);
  const percent = Math.round((score / 5) * 100);
  const tip = buildTip(password, score, checks);
  return (
    <div className="w-full mt-1 mb-4">
      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden group" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Força da senha">
        <div
          className={`h-full transition-all duration-300 rounded-full ${colors[score - 1] || colors[0]} ${percent === 0 ? 'w-0' : ''}`}
          style={{ width: `${percent}%` }}
        />
        <div
          className={`absolute left-1/2 -translate-x-1/2 -top-10 bg-readowl-purple-dark px-4 py-2 rounded-lg shadow-lg z-10 whitespace-nowrap text-xs pointer-events-none opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition duration-200 ${tipTextColor || 'text-readowl-purple-extralight'}`}
          style={tipTextColor === 'text-white' ? { color: '#fff' } : {}}
        >
          {tip}
        </div>
      </div>
      {showPercent && (
        <div className="mt-1 text-[10px] tracking-wide text-readowl-purple-extradark/70 flex justify-between">
          <span className="text-white">Força da senha: {percent}%</span>
          {password && <span>{score}/5</span>}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthBar;