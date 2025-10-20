
// src/components/auth/SetupVault.tsx
import React, { useState, useEffect } from "react";
import { useVault } from "@/context/vault/VaultProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { Separator } from "../ui/separator";

export const SetupVault: React.FC = () => {
  const { createVault } = useVault();
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const submit = async () => {
    setError(null);
    if (pass.length < 6) return setError(t('setup_vault_error_length'));
    if (pass !== pass2) return setError(t('setup_vault_error_mismatch'));
    setLoading(true);
    try {
      await createVault(pass, { 
          cbtEntries: [],
          exposureState: { fearLadder: [], logs: [] },
          activationState: { values: [], activities: [] },
          goals: [],
          gratitudeEntries: [],
          sleepEntries: [],
          achievements: [],
          config: {
            crisisConfig: {
              copingPhrase: t('default_coping_phrase'),
              contacts: []
            },
            lastPrompt: '',
            ruminationCount: 0,
            tourState: {
                journal: { seen: false },
                activation: { seen: false },
                goals: { seen: false },
                exposure: { seen: false },
                wellness: { seen: false },
            }
          }
      });
    } catch (e: any) {
      setError(e.message || t('setup_vault_error_generic'));
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>{t('setup_vault_title')}</CardTitle>
                <CardDescription>{t('setup_vault_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm font-bold text-destructive">{t('setup_vault_warning')}</p>
                <Input type="password" placeholder={t('setup_vault_placeholder_pass')} value={pass} onChange={e=>setPass(e.target.value)} />
                <Input type="password" placeholder={t('setup_vault_placeholder_confirm')} value={pass2} onChange={e=>setPass2(e.target.value)} />
                {error && <div className="text-sm text-destructive">{error}</div>}
            </CardContent>
            <CardFooter className="flex-col gap-4">
                <Button className="w-full" onClick={submit} disabled={loading}>{loading ? t('setup_vault_loading_button') : t('setup_vault_create_button')}</Button>
            </CardFooter>
        </Card>
    </div>
  );
};
