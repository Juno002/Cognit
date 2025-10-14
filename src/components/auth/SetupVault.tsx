
// src/components/auth/SetupVault.tsx
import React, { useState } from "react";
import { useVault } from "@/context/vault/VaultProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";

export const SetupVault: React.FC = () => {
  const { createVault } = useVault();
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const submit = async () => {
    setError(null);
    if (pass.length < 6) return setError("Usa al menos 6 caracteres (mejor: contraseña alfanumérica).");
    if (pass !== pass2) return setError("Las contraseñas no coinciden.");
    setLoading(true);
    try {
      await createVault(pass, { 
          cbtEntries: [],
          exposureState: { fearLadder: [], logs: [] },
          achievements: [],
          config: {
            crisisConfig: {
              copingPhrase: t('default_coping_phrase'),
              contacts: []
            },
            lastPrompt: '',
            ruminationCount: 0,
            tourCompleted: false,
          }
      });
      // success will be handled by the provider re-rendering the main app
    } catch (e: any) {
      setError(e.message || "Error creando la bóveda");
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>🔐 Protege tu Diario</CardTitle>
                <CardDescription>Elige una contraseña o PIN para cifrar tus datos. Esta clave nunca sale de tu dispositivo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm font-bold text-destructive">⚠️ Si olvidas esta contraseña, tus datos serán irrecuperables.</p>
                <Input type="password" placeholder="Contraseña o PIN (mín. 6 caracteres)" value={pass} onChange={e=>setPass(e.target.value)} />
                <Input type="password" placeholder="Repite la contraseña" value={pass2} onChange={e=>setPass2(e.target.value)} />
                {error && <div className="text-sm text-destructive">{error}</div>}
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={submit} disabled={loading}>{loading ? "Creando..." : "Crear y Proteger"}</Button>
            </CardFooter>
        </Card>
    </div>
  );
};
