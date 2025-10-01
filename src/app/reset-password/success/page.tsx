export default function ResetSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-readowl-purple-medium shadow-lg p-8 w-full max-w-md text-white text-center">
        <h1 className="text-2xl font-bold mb-2">Senha redefinida</h1>
        <p className="text-readowl-purple-extralight mb-4">
          Sua senha foi alterada com sucesso! <br></br> Faça login novamente para continuar.
        </p>
        <a className="underline text-white" href="/login">Ir para o login →</a>
      </div>
    </div>
  );
}
