
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl">📡</div>
        <h1 className="mb-4 text-3xl font-bold">
          Sin Conexión
        </h1>
        <p className="mb-6 text-muted-foreground">
          Parece que no tienes conexión a internet. No te preocupes, la aplicación está diseñada para funcionar sin conexión.
        </p>
        <div className="space-y-4">
          <a
            href="/"
            className="w-full inline-block text-center rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            🏠 Volver al Inicio
          </a>
        </div>
        <div className="mt-8 rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> Tus datos están seguros en tu dispositivo. Puedes seguir registrando sesiones.
          </p>
        </div>
      </div>
    </div>
  );
}
