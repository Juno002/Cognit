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
import type { CrisisConfig, CrisisContact } from '@/types';
import { 
  Trash2, 
  Palette, 
  Check, 
  Sun, 
  Moon, 
  Zap, 
  FileText, 
  FileJson, 
  FileSpreadsheet, 
  HeartPulse, 
  Printer, 
  Upload, 
  Database, 
  ShieldAlert, 
  UserCog, 
  Settings2
} from 'lucide-react';
import BreathingGuide from '../BreathingGuide';
import { useTranslation } from '@/hooks/use-translation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVault } from '@/context/vault/VaultProvider';
import { Separator } from '../ui/separator';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useCbtJournal } from '@/hooks/use-cbt-journal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SettingsModalProps {
    crisisConfig: CrisisConfig;
    updateCrisisConfig: (config: Partial<CrisisConfig>) => void;
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onExportJson: () => void;
    onExportCsv: () => void;
    onExportReport: () => void;
    onExportL3Report: () => void;
    onAutoZip: () => void;
    onExportFhir: () => void;
    onPrintReport: () => void;
    isZipping: boolean;
    onReset: () => void;
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
        <div className="space-y-4 py-2">
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
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="text-base font-medium">{t('settings_theme_label')}</Label>
                <div className="flex gap-2">
                    {themes.map((tInfo) => (
                        <button
                            key={tInfo.name}
                            className={cn(
                                "h-10 w-10 rounded-full border-2 transition-all flex items-center justify-center shadow-sm hover:scale-110",
                                activeTheme === tInfo.name ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
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
            
            <div className="flex items-center justify-between">
                <Label className="text-base font-medium">{t('settings_dark_mode_label')}</Label>
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="rounded-full"
                >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
            </div>
        </div>
    );
};

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    crisisConfig, 
    updateCrisisConfig, 
    onImport,
    onExportJson,
    onExportCsv,
    onExportL3Report,
    onAutoZip,
    onExportFhir,
    onPrintReport,
    isZipping,
    onReset
}) => {
    const { t, locale, setLocale } = useTranslation();
    const { showTours, setShowTours, clinicalProfile, setClinicalProfile } = useCbtJournal();
    const { toast } = useToast();
    const [copingPhrase, setCopingPhrase] = useState(crisisConfig.copingPhrase);
    const [contacts, setContacts] = useState<CrisisContact[]>(crisisConfig.contacts);
    const [newContactName, setNewContactName] = useState('');
    const [newContactPhone, setNewContactPhone] = useState('');
    const [showBreathingGuide, setShowBreathingGuide] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><Settings2 className="w-5 h-5"/> {t('settings_title')}</DialogTitle>
        <DialogDescription>
            {t('settings_description')}
        </DialogDescription>
      </DialogHeader>

      <div className="py-2">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
                <Palette className="w-4 h-4 hidden sm:inline" />
                {t('settings_tab_general')}
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
                <Database className="w-4 h-4 hidden sm:inline" />
                {t('settings_tab_data')}
            </TabsTrigger>
            <TabsTrigger value="crisis" className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 hidden sm:inline" />
                {t('settings_tab_crisis')}
            </TabsTrigger>
            <TabsTrigger value="clinical" className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 hidden sm:inline" />
                {t('settings_tab_clinical')}
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
                <UserCog className="w-4 h-4 hidden sm:inline" />
                {t('settings_tab_account')}
            </TabsTrigger>
          </TabsList>

          <div className="max-h-[55vh] overflow-y-auto pr-2">
            <TabsContent value="general" className="space-y-6 pt-2">
                <ThemeSelector />
                
                <Separator />
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="language-select" className="text-base font-medium">{t('settings_language_label')}</Label>
                        <Select value={locale} onValueChange={(value) => setLocale(value as 'es' | 'en')}>
                            <SelectTrigger id="language-select" className="w-[180px]">
                                <SelectValue placeholder={t('settings_language_placeholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Español</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base font-medium">{t('settings_show_tours_label')}</Label>
                            <p className="text-sm text-muted-foreground">{t('settings_show_tours_desc')}</p>
                        </div>
                        <Switch checked={showTours} onCheckedChange={setShowTours} />
                    </div>
                </div>

            </TabsContent>

            <TabsContent value="data" className="space-y-6 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('settings_data_export_section')}</h4>
                        <Button variant="outline" className="w-full justify-start gap-3 h-11" onClick={onAutoZip} disabled={isZipping}>
                            <Zap className="h-4 w-4 text-primary" />
                            <span>{isZipping ? t('header_zipping') : t('header_autozip')}</span>
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-3 h-11" onClick={onExportL3Report}>
                            <FileText className="h-4 w-4 text-indigo-500" />
                            <span>{t('l3_report_title')}</span>
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-3 h-11" onClick={onPrintReport}>
                            <Printer className="h-4 w-4 text-slate-500" />
                            <span>{t('header_export_pdf')}</span>
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-3 h-11" onClick={onExportFhir}>
                            <HeartPulse className="h-4 w-4 text-rose-500" />
                            <span>{t('header_export_fhir')}</span>
                        </Button>
                    </div>

                    <div className="space-y-3">
                         <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('settings_data_mgmt_section')}</h4>
                         <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={onImport} />
                         <Button variant="outline" className="w-full justify-start gap-3 h-11" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="h-4 w-4 text-emerald-500" />
                            <span>{t('header_import')}</span>
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-3 h-11" onClick={onExportJson}>
                            <FileJson className="h-4 w-4 text-amber-500" />
                            <span>{t('header_export_json')}</span>
                        </Button>
                         <Button variant="outline" className="w-full justify-start gap-3 h-11" onClick={onExportCsv}>
                            <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                            <span>{t('header_export_csv')}</span>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                    <span>{t('header_reset')}...</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>{t('reset_dialog_title')}</AlertDialogTitle>
                                <AlertDialogDescription>{t('reset_dialog_desc')}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={onReset} className="bg-destructive hover:bg-destructive/90">
                                    {t('reset_dialog_confirm')}
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="crisis" className="space-y-4 pt-2">
                <div className="bg-destructive/5 p-4 rounded-lg border border-destructive/10">
                    <h3 className="font-semibold text-destructive flex items-center gap-2 mb-2"><ShieldAlert className="w-4 h-4"/>{t('settings_crisis_plan_title')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{t('settings_crisis_plan_desc')}</p>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="crisisPhrase">{t('settings_coping_phrase')}</Label>
                            <Textarea 
                                id="crisisPhrase"
                                className="bg-background"
                                placeholder={t('settings_coping_phrase_placeholder')}
                                value={copingPhrase}
                                onChange={(e) => setCopingPhrase(e.target.value)}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label>{t('settings_emergency_contacts')}</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input placeholder={t('settings_contact_name_placeholder')} value={newContactName} onChange={e => setNewContactName(e.target.value)} className="bg-background"/>
                                <Input placeholder={t('settings_contact_phone_placeholder')} value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)} className="bg-background"/>
                            </div>
                            <Button className="w-full mt-2" variant="outline" onClick={addContact}>{t('settings_add_contact_button')}</Button>
                            
                            <div className="space-y-2 rounded-md border bg-background/50 p-2 mt-2">
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

                        <div className="space-y-2 pt-2">
                            <Label>{t('settings_containment_tool')}</Label>
                            <Button variant="outline" className="w-full bg-background" onClick={() => setShowBreathingGuide(true)}>
                                {t('settings_try_breathing_guide')}
                            </Button>
                        </div>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="clinical" className="space-y-6 pt-2">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-base font-medium">{t('settings_clinical_profile_label')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings_clinical_profile_desc')}</p>
                        
                        <Select 
                            value={clinicalProfile || 'unspecified'} 
                            onValueChange={(value) => setClinicalProfile(value as any)}
                        >
                            <SelectTrigger className="w-full mt-2">
                                <SelectValue placeholder={t('settings_profile_unspecified')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="anxiety">{t('settings_profile_anxiety')}</SelectItem>
                                <SelectItem value="depression">{t('settings_profile_depression')}</SelectItem>
                                <SelectItem value="anger">{t('settings_profile_anger')}</SelectItem>
                                <SelectItem value="unspecified">{t('settings_profile_unspecified')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 flex gap-3 items-start">
                        <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">
                            {t('settings_clinical_disclaimer')}
                        </p>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="account" className="space-y-6 pt-2">
                <ChangePasswordForm />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <DialogFooter className="gap-2 sm:gap-0 mt-4">
        <DialogClose asChild>
            <Button variant="ghost">{t('cancel')}</Button>
        </DialogClose>
        <DialogClose asChild>
            <Button onClick={handleSave} className="px-8">{t('settings_save_button')}</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
};

export default SettingsModal;
