
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ReflejoMode } from '@/lib/reflejo';

interface ReflejoAvatarProps {
    mode: ReflejoMode;
    size?: number;
    className?: string;
    showHalo?: boolean;
}

const ReflejoAvatar: React.FC<ReflejoAvatarProps> = ({ mode, size = 40, className, showHalo = true }) => {
    
    // Configuración visual según el modo
    const config = {
        mentor: {
            color: 'var(--lambda-mentor)',
            borderRadius: ["40% 60% 70% 30% / 40% 50% 60% 50%", "60% 40% 30% 70% / 50% 60% 40% 60%", "40% 60% 70% 30% / 40% 50% 60% 50%"],
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0],
            duration: 4
        },
        observer: {
            color: 'var(--lambda-observer)',
            borderRadius: ["30% 70% 70% 30% / 30% 30% 70% 70%", "70% 30% 30% 70% / 70% 70% 30% 30%", "30% 70% 70% 30% / 30% 30% 70% 70%"],
            scale: [1, 1.02, 1],
            rotate: 0,
            duration: 6
        },
        anchor: {
            color: 'var(--lambda-anchor)',
            borderRadius: "15%", // Casi un cuadrado para estabilidad
            scale: [1, 0.95, 1], // Pulso de contracción (respiración)
            rotate: 0,
            duration: 8 // Muy lento para calmar
        }
    };

    const current = config[mode];

    return (
        <div className={cn("relative flex items-center justify-center shrink-0", className)} style={{ width: size, height: size }}>
            {/* Halo exterior pulzante */}
            {showHalo && (
                <motion.div
                    className="absolute inset-0 rounded-full opacity-25 blur-md"
                    animate={{
                        scale: [1, 1.8, 1],
                        opacity: [0.1, 0.4, 0.1],
                    }}
                    transition={{
                        duration: current.duration,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{ backgroundColor: `hsl(${current.color})` }}
                />
            )}
            
            {/* Núcleo de Reflejo */}
            <motion.div
                className="relative z-10 w-full h-full shadow-xl overflow-hidden border border-white/20"
                animate={{
                    backgroundColor: `hsl(${current.color})`,
                    scale: current.scale,
                    borderRadius: current.borderRadius,
                    rotate: current.rotate,
                }}
                transition={{
                    duration: current.duration,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                {/* Símbolo Lambda interno */}
                <div className="absolute inset-0 flex items-center justify-center opacity-60 mix-blend-soft-light">
                    <span className="text-white font-bold select-none pointer-events-none" style={{ fontSize: size * 0.5 }}>λ</span>
                </div>
                
                {/* Brillo interno */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
            </motion.div>
        </div>
    );
};

export default ReflejoAvatar;
