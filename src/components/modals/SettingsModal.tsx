"use client";

import React, { useState, useEffect } from 'react';
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
import type { CrisisConfig } from '@/types';
import type { CrisisContact } from '@/types';
import { Trash2, KeyRound, Palette, Check } from 'lucide-react';
import BreathingGuide from '../BreathingGuide';
import { useTranslation } from '@/hooks/use-translation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVault } from '@/context/vault/VaultProvider';
import { Separator } from '../ui/separator';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { arrayBufferToBase64 } from '@/lib/arraybuffer-utils';
import pako from 'pako';

interface SettingsModalProps {
    crisisConfig: CrisisConfig;
    updateCrisisConfig: (config: Partial<CrisisConfig>) => void;
    lastPrompt: string;
}

const ChangePasswordForm: React.FC = () => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { changePassword } = useVault();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setError('');
        if (newPassword.length < 6) {
            setError(t('change_password_error_length'));
            return;
        }
        if (newPassword !== confirmPassword) {
            setError(t('change_password_error_mismatch'));
            return;
        }

        setLoading(true);
        const success = await changePassword(currentPassword, newPassword);
        setLoading(false);

        if (success) {
            toast({ title: t('change_password_success_title') });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setError(t('change_password_error_current'));
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><KeyRound className="w-4 h-4"/>{t('change_password_title')}</h3>
            <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('change_password_current_label')}</Label>
                <Input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="newPassword">{t('change_password_new_label')}</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('change_password_confirm_label')}</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
                {loading ? t('change_password_loading') : t('change_password_button')}
            </Button>
        </div>
    )
}

const themes = [
    { name: 'default', label: 'Default', colorLight: 'hsl(210 40% 96.1%)', colorDark: 'hsl(217.2 32.6% 17.5%)' },
    { name: 'zen', label: 'Zen', colorLight: 'hsl(142 76% 36%)', colorDark: 'hsl(142 71% 45%)' },
    { name: 'sunrise', label: 'Sunrise', colorLight: 'hsl(24 95% 53%)', colorDark: 'hsl(38 92% 50%)' },
];

const ThemeSelector: React.FC = () => {
    const { t } = useTranslation();
    const { theme, setTheme, systemTheme } = useTheme();
    const [activeTheme, setActiveTheme] = useState('default');

    React.useEffect(() => {
        const currentThemeClass = Array.from(document.documentElement.classList).find(c => c.startsWith('theme-'));
        if (currentThemeClass) {
            setActiveTheme(currentThemeClass.replace('theme-', ''));
        } else {
            setActiveTheme('default');
        }
    }, []);

    const handleThemeChange = (newThemeName: string) => {
        themes.forEach(t => {
            if (t.name !== 'default') {
                document.documentElement.classList.remove(`theme-${t.name}`);
            }
        });
        
        if (newThemeName !== 'default') {
            document.documentElement.classList.add(`theme-${newThemeName}`);
        }
        
        setActiveTheme(newThemeName);
    }

    const currentMode = theme === 'system' ? systemTheme : theme;

    return (
        <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><Palette className="w-4 h-4" />{t('settings_appearance_title')}</h3>
            <Label>{t('settings_theme_label')}</Label>
            <div className="flex gap-3">
                {themes.map((tInfo) => (
                    <button
                        key={tInfo.name}
                        className={cn(
                            "h-8 w-8 rounded-full border-2 transition-all flex items-center justify-center",
                            activeTheme === tInfo.name ? 'border-ring' : 'border-transparent'
                        )}
                        style={{ backgroundColor: currentMode === 'dark' ? tInfo.colorDark : tInfo.colorLight }}
                        onClick={() => handleThemeChange(tInfo.name)}
                        aria-label={`${t('settings_select_theme_aria')} ${tInfo.label}`}
                    >
                        {activeTheme === tInfo.name && <Check className="h-5 w-5 text-white mix-blend-difference" />}
                    </button>
                ))}
            </div>
        </div>
    );
};

const SettingsModal: React.FC<SettingsModalProps> = ({ crisisConfig, updateCrisisConfig, lastPrompt }) => {
    const { t, locale, setLocale } = useTranslation();
    const { toast } = useToast();
    const [copingPhrase, setCopingPhrase] = useState(crisisConfig.copingPhrase);
    const [contacts, setContacts] = useState<CrisisContact[]>(crisisConfig.contacts);
    const [newContactName, setNewContactName] = useState('');
    const [newContactPhone, setNewContactPhone] = useState('');
    const [showBreathingGuide, setShowBreathingGuide] = useState(false);

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
        
        <ThemeSelector />

        <Separator />
        
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

        <Separator />
        
        <ChangePasswordForm />

        <Separator />

        <div className="space-y-2">
            <h3 className="font-semibold">{t('settings_daily_reminder_title')}</h3>
             <Label htmlFor="notificationTime">{t('settings_daily_reminder_time')}</Label>
             <Input id="notificationTime" type="time" defaultValue="21:00"/>
             <p className="text-sm text-muted-foreground">{t('settings_last_prompt')}:</p>
             <div className="text-sm italic text-muted-foreground p-3 bg-muted rounded-md">{lastPrompt || t('settings_no_recent_prompt')}</div>
             <p className="text-xs text-warning">{t('settings_notification_warning')}</p>
        </div>
        
        <Separator />

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
