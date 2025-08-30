"use client";
import Image from "next/image";
import Link from "next/link";
import InputWithIcon from "@/components/ui/InputWithIcon";
import Button from "@/components/ui/Button";
import GoogleButton from "@/components/ui/GoogleButton";

function Register() {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-readowl-purple-extralight">
            <div className="bg-readowl-purple-medium rounded-xl shadow-lg p-8 w-full max-w-md mt-10 mb-10">
                <div className="flex flex-col items-center mb-6">
                    <Image src="/img/mascot/logo.png" alt="Readowl Logo" width={64} height={64} />
                    <span className="text-2xl font-bold text-white mt-2">Readowl</span>
                </div>
                <form>
                    <InputWithIcon
                        placeholder="Nome de usuário"
                        icon={
                            <Image src="/img/svg/login/person.svg" alt="User icon" className="opacity-50" width={25} height={25}/>
                        }
                        name="username"
                        autoComplete="username"
                    />
                    <InputWithIcon
                        placeholder="Email"
                        icon={
                            <Image src="/img/svg/login/mail.svg" alt="User icon" className="opacity-50" width={25} height={25}/>
                        }
                        type="email"
                        name="email"
                        autoComplete="email"
                    />
                    <InputWithIcon
                        placeholder="Senha"
                        icon={
                            <Image src="/img/svg/login/key.svg" alt="User icon" className="opacity-50" width={25} height={25}/>
                        }
                        type="password"
                        name="password"
                        autoComplete="new-password"
                    />
                    <InputWithIcon
                        placeholder="Confirmar senha"
                        icon={
                            <Image src="/img/svg/login/passkey.svg" alt="User icon" className="opacity-50" width={25} height={25}/>
                        }
                        type="password"
                        name="confirmPassword"
                        autoComplete="new-password"
                    />
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <input id="remember" type="checkbox" className="mr-2 accent-readowl-purple" />
                            <label htmlFor="remember" className="text-white text-sm">Lembrar de mim</label>
                        </div>
                    </div>
                    <Button type="submit" variant="secondary" className="w-full mb-2">Cadastrar</Button>
                    <GoogleButton />
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