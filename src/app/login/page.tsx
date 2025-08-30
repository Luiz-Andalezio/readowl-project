"use client";
import Image from "next/image";
import Link from "next/link";
import InputWithIcon from "@/components/ui/InputWithIcon";
import Button from "@/components/ui/Button";
import GoogleButton from "@/components/ui/GoogleButton";

function Login() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-readowl-purple-extralight">
      <div className="bg-readowl-purple-medium rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Image src="/img/mascot/logo.png" alt="Readowl Logo" width={64} height={64} />
          <span className="text-2xl font-bold text-white mt-2">Readowl</span>
        </div>
        <form>
          <InputWithIcon
            placeholder="Nome de usuário ou email"
            icon={
              <Image src="/img/svg/login/person.svg" alt="User icon" className="opacity-50" width={25} height={25}/>
            }
            name="username"
            autoComplete="username"
          />
          <InputWithIcon
            placeholder="Senha"
            icon={
              // Lock icon
              <Image src="/img/svg/login/key.svg" alt="Passkey icon" className="opacity-50" width={25} height={25} />
            }
            type="password"
            name="password"
            autoComplete="current-password"
          />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <input id="remember" type="checkbox" className="mr-2 accent-readowl-purple" />
              <label htmlFor="remember" className="text-white text-sm">Lembrar de mim</label>
            </div>
            <Link href="#" className="text-readowl-purple-extralight underline hover:text-white text-sm">Esqueci minha senha</Link>
          </div>
          <Button type="submit" variant="primary" className="w-full mb-2">Logar</Button>
          <GoogleButton/>
          <br></br>
          <hr></hr>
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