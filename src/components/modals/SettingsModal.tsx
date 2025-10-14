
"use client";

import React, { useState } from 'react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { CrisisConfig } from '@/hooks/use-cbt-journal';
import type { CrisisContact } from '@/types';
import { Trash2, KeyRound } from 'lucide-react';
import BreathingGuide from '../BreathingGuide';
import { useTranslation } from '@/hooks/use-translation.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVault } from '@/context/vault/VaultProvider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

interface SettingsModalProps {
    crisisConfig: CrisisConfig;
    updateCrisisConfig: (config: Partial<CrisisConfig>) => void;
    lastPrompt: string;
}


const SettingsModal: React.FC<SettingsModalProps> = ({ crisisConfig, updateCrisisConfig, lastPrompt }) => {
    const { t, locale, setLocale } = useTranslation();
    const { changePassword } = useVault();
    const { toast } = useToast();
    const [copingPhrase, setCopingPhrase] = useState(crisisConfig.copingPhrase);
    const [contacts, setContacts] = useState<CrisisContact[]>(crisisConfig.contacts);
    const [newContactName, setNewContactName] = useState('');
    const [newContactPhone, setNewContactPhone] = useState('');
    const [showBreathingGuide, setShowBreathingGuide] = useState(false);
    
    // State for changing password
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const handleSave = () => {
        updateCrisisConfig({ copingPhrase, contacts });
        toast({ title: t('settings_toast_saved') });
    };

    const addContact = () => {
        if (newContactName.trim() && newContactPhone.trim()) {
            const newContact: CrisisContact = {
                id: Date.now().toString(),
                name: newContactName.trim(),
                phone: newContactPhone.trim()
            };
            setContacts([...contacts, newContact]);
            setNewContactName('');
            setNewContactPhone('');
        } else {
            toast({ title: t('settings_toast_incomplete_contact_title'), description: t('settings_toast_incomplete_contact_desc'), variant: 'destructive' });
        }
    };

    const removeContact = (id: string) => {
        setContacts(contacts.filter(c => c.id !== id));
    };

    const handleChangePassword = async () => {
        if (newPassword.length < 6) {
            toast({ title: "Contraseña muy corta", description: "La nueva contraseña debe tener al menos 6 caracteres.", variant: 'destructive'});
            return;
        }
        if (newPassword !== confirmNewPassword) {
            toast({ title: "Las contraseñas no coinciden", description: "La nueva contraseña y la confirmación no son iguales.", variant: 'destructive'});
            return;
        }
        
        setIsChangingPassword(true);
        try {
            const success = await changePassword(currentPassword, newPassword);
            if (success) {
                toast({ title: "Contraseña cambiada con éxito" });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
            } else {
                toast({ title: "Error", description: "La contraseña actual es incorrecta.", variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: 'destructive' });
        } finally {
            setIsChangingPassword(false);
        }
    };

  if (showBreathingGuide) {
    return (
        <DialogContent className="max-w-lg">
            <BreathingGuide onStop={() => setShowBreathingGuide(false)} />
        </DialogContent>
    );
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{t('settings_title')}</DialogTitle>
        <DialogDescription>
            {t('settings_description')}
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
        
        <Accordion type="single" collapsible>
            <AccordionItem value="password">
                <AccordionTrigger>
                    <h3 className="font-semibold flex items-center gap-2"><KeyRound /> Cambiar Contraseña</h3>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4 pt-4">
                         <div className="space-y-2">
                            <Label htmlFor="currentPassword">Contraseña Actual</Label>
                            <Input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Nueva Contraseña (mín. 6 caracteres)</Label>
                            <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="confirmNewPassword">Confirmar Nueva Contraseña</Label>
                            <Input id="confirmNewPassword" type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} />
                        </div>
                        <Button onClick={handleChangePassword} disabled={isChangingPassword}>{isChangingPassword ? "Cambiando..." : "Confirmar Cambio"}</Button>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>

        <div className="space-y-2">
            <h3 className="font-semibold">{t('settings_language_title')}</h3>
            <Label htmlFor="language-select">{t('settings_language_label')}</Label>
            <Select value={locale} onValueChange={(value) => setLocale(value as 'es' | 'en')}>
                <SelectTrigger id="language-select">
                    <SelectValue placeholder={t('settings_language_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="space-y-2">
            <h3 className="font-semibold">{t('settings_daily_reminder_title')}</h3>
             <Label htmlFor="notificationTime">{t('settings_daily_reminder_time')}</Label>
             <Input id="notificationTime" type="time" defaultValue="21:00"/>
             <p className="text-sm text-muted-foreground">{t('settings_last_prompt')}:</p>
             <div className="text-sm italic text-muted-foreground p-3 bg-muted rounded-md">{lastPrompt || t('settings_no_recent_prompt')}</div>
             <p className="text-xs text-warning">{t('settings_notification_warning')}</p>
        </div>

        <div className="space-y-4">
            <h3 className="font-semibold">{t('settings_crisis_plan_title')}</h3>
            <p className="text-sm text-muted-foreground">{t('settings_crisis_plan_desc')}</p>
            
            <div className="space-y-2">
                <Label htmlFor="crisisPhrase">{t('settings_coping_phrase')}</Label>
                <Textarea 
                    id="crisisPhrase"
                    placeholder={t('settings_coping_phrase_placeholder')}
                    value={copingPhrase}
                    onChange={(e) => setCopingPhrase(e.target.value)}
                />
            </div>
            
            <div className="space-y-2">
                <Label>{t('settings_emergency_contacts')}</Label>
                <div className="flex gap-2">
                    <Input placeholder={t('settings_contact_name_placeholder')} value={newContactName} onChange={e => setNewContactName(e.target.value)} />
                    <Input placeholder={t('settings_contact_phone_placeholder')} value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)} />
                    <Button onClick={addContact}>{t('settings_add_contact_button')}</Button>
                </div>
                 <div className="space-y-2 rounded-md border p-2">
                    {contacts.length > 0 ? contacts.map(c => (
                        <div key={c.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted/50">
                           <span><strong>{c.name}:</strong> {c.phone}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeContact(c.id)} aria-label={t('settings_remove_contact_aria', { name: c.name })}>
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    )) : (
                        <p className="text-center text-xs text-muted-foreground p-4">{t('settings_no_contacts')}</p>
                    )}
                 </div>
            </div>

            <div className="space-y-2">
                <Label>{t('settings_containment_tool')}</Label>
                <Button variant="outline" className="w-full" onClick={() => setShowBreathingGuide(true)}>
                    {t('settings_try_breathing_guide')}
                </Button>
                 <p className="text-xs text-muted-foreground">{t('settings_breathing_guide_desc')}</p>
            </div>
        </div>
      </div>
       <DialogFooter>
        <DialogClose asChild>
            <Button variant="ghost">{t('cancel')}</Button>
        </DialogClose>
        <DialogClose asChild>
            <Button onClick={handleSave}>{t('settings_save_button')}</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
};

export default SettingsModal;
