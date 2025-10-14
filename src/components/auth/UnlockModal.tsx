
// src/components/auth/UnlockModal.tsx
import React, { useState, useEffect } from "react";
import { useVault } from "@/context/vault/VaultProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const UnlockModal: React.FC = () => {
  const { locked, hasVault, unlock, attemptsLeft, lockedUntil, wipe } = useVault();
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!locked) setPass("");
  }, [locked]);

  if (!hasVault || !locked) return null;

  const tryUnlock = async () => {
    setError(null);
    if (!pass) return setError("Ingresa contraseña");
    if (lockedUntil && Date.now() < lockedUntil) {
      setError(`Bloqueado hasta ${new Date(lockedUntil).toLocaleTimeString()}`);
      return;
    }
    setLoading(true);
    const ok = await unlock(pass);
    setLoading(false);
    if (!ok) {
        if (attemptsLeft > 0) {
            setError(`Contraseña incorrecta. Intentos restantes: ${attemptsLeft}`);
        } else {
             setError(`Demasiados intentos fallidos. Bloqueado hasta ${new Date(lockedUntil!).toLocaleTimeString()}`);
        }
    }
  };
  
  const handleWipe = () => {
      if(confirm("¿Estás seguro de que quieres borrar todos tus datos locales? Esta acción es irreversible.")) {
          wipe();
      }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[100]">
      <Card className="w-full max-w-sm">
        <CardHeader>
            <CardTitle>Desbloquear Cognit λ</CardTitle>
            <CardDescription>Ingresa tu contraseña o PIN para continuar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Input type="password" placeholder="Contraseña / PIN" value={pass} onChange={(e)=>setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && tryUnlock()} autoFocus/>
            {error && <div className="text-sm text-destructive">{error}</div>}
        </CardContent>
        <CardFooter className="flex-col gap-2">
            <Button className="w-full" onClick={tryUnlock} disabled={loading}>{loading ? "Desbloqueando..." : "Desbloquear"}</Button>
            <Button variant="link" className="text-xs text-muted-foreground" onClick={handleWipe}>Olvidé mi contraseña (borrar datos)</Button>
        </CardFooter>
      </Card>
    </div>
  );
};
