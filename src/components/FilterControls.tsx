
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SlidersHorizontal, X } from 'lucide-react';
import type { FilterState } from '@/types';
import { todayISO } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

interface FilterControlsProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({ filters, onFilterChange }) => {
    const { t } = useTranslation();
    const activeFilterCount = [
        filters.level !== 'all',
        filters.text,
        filters.dateMin,
        filters.dateMax !== todayISO(),
    ].filter(Boolean).length;

    const handleClearFilters = () => {
        onFilterChange({
            level: 'all',
            text: '',
            dateMin: '',
            dateMax: todayISO(),
        });
    };

    const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        onFilterChange({ ...filters, [key]: value });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5"/>
                    {t('filters_title')}
                    {activeFilterCount > 0 && <span className="text-sm font-bold text-primary">({activeFilterCount})</span>}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    <X className="w-4 h-4 mr-1"/>
                    {t('clear_filters_button')}
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select value={filters.level} onValueChange={(value) => handleFilterChange('level', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('all_levels_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('all_levels_option')}</SelectItem>
                            <SelectItem value="1">💙 L1</SelectItem>
                            <SelectItem value="2">💜 L2</SelectItem>
                            <SelectItem value="3">💛 L3</SelectItem>
                        </SelectContent>
                    </Select>
                     <Input
                        placeholder={t('search_placeholder')}
                        value={filters.text}
                        onChange={(e) => handleFilterChange('text', e.target.value)}
                    />
                </div>
                 <Accordion type="single" collapsible>
                    <AccordionItem value="advanced">
                        <AccordionTrigger>{t('advanced_filters_trigger')}</AccordionTrigger>
                        <AccordionContent>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="dateMin" className="text-sm font-medium text-muted-foreground">{t('date_from_label')}</label>
                                    <Input
                                        id="dateMin"
                                        type="date"
                                        value={filters.dateMin}
                                        onChange={(e) => handleFilterChange('dateMin', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="dateMax" className="text-sm font-medium text-muted-foreground">{t('date_to_label')}</label>
                                    <Input
                                        id="dateMax"
                                        type="date"
                                        value={filters.dateMax}
                                        onChange={(e) => handleFilterChange('dateMax', e.target.value)}
                                    />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
};

export default FilterControls;
