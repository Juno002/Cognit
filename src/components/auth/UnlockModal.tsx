
// src/components/auth/UnlockModal.tsx
import React, { useState, useEffect } from "react";
import { useVault } from "@/context/vault/VaultProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";

export const UnlockModal: React.FC = () => {
  const { t } = useTranslation();
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
    if (!pass) return setError(t('unlock_error_nopass'));
    if (lockedUntil && Date.now() < lockedUntil) {
      setError(t('unlock_error_locked', { time: new Date(lockedUntil).toLocaleTimeString() }));
      return;
    }
    setLoading(true);
    try {
      const result = await unlock(pass);
      if (result.success) return;

      if (attemptsLeft > 0) {
          setError(t('unlock_error_wrong_pass', { attempts: attemptsLeft }));
      } else {
           setError(t('unlock_error_locked', { time: new Date(lockedUntil!).toLocaleTimeString() }));
      }

    } catch (err: any) {
        console.error("Unlock error caught in component:", err);
        setError(err.message || t('unlock_error_unknown'));
    } finally {
        setLoading(false);
    }
  };
  
  const handleWipe = () => {
      if(confirm(t('unlock_wipe_confirm'))) {
          wipe();
      }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[100]">
      <Card className="w-full max-w-sm">
        <CardHeader>
            <CardTitle>{t('unlock_title')}</CardTitle>
            <CardDescription>{t('unlock_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Input type="password" placeholder={t('unlock_placeholder')} value={pass} onChange={(e)=>setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && tryUnlock()} autoFocus/>
            {error && <div className="text-sm text-destructive">{error}</div>}
        </CardContent>
        <CardFooter className="flex-col gap-2">
            <Button className="w-full" onClick={tryUnlock} disabled={loading}>{loading ? t('unlock_loading_button') : t('unlock_button')}</Button>
            <Button variant="link" className="text-xs text-muted-foreground" onClick={handleWipe}>{t('unlock_forgot_pass_button')}</Button>
        </CardFooter>
      </Card>
    </div>
  );
};
