
import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { Shield, Lock, Fingerprint, Eye, Database, Zap } from 'lucide-react';

const ParallaxSecuritySpace: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Scroll Parallax
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scrollY = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const scrollRotate = useTransform(scrollYProgress, [0, 1], [-10, 10]);

  // Mouse Parallax Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const springConfig = { damping: 25, stiffness: 150 };
  const mouseX = useSpring(mousePos.x, springConfig);
  const mouseY = useSpring(mousePos.y, springConfig);

  // Layers movement
  const layer1X = useTransform(mouseX, (x) => x * 15);
  const layer1Y = useTransform(mouseY, (y) => y * 15);
  
  const layer2X = useTransform(mouseX, (x) => x * 40);
  const layer2Y = useTransform(mouseY, (y) => y * 40);

  const layer3X = useTransform(mouseX, (x) => x * 80);
  const layer3Y = useTransform(mouseY, (y) => y * 80);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-square md:aspect-video lg:aspect-square rounded-[3rem] overflow-hidden bg-white shadow-2xl border border-slate-100"
    >
      {/* Background Layer (Deep) */}
      <motion.div 
        style={{ x: layer1X, y: layer1Y }}
        className="absolute inset-0 opacity-40"
      >
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0)',
          backgroundSize: '40px 40px' 
        }} />
      </motion.div>

      {/* Midground Layer (Interactive elements) */}
      <motion.div 
        style={{ y: scrollY }}
        className="absolute inset-0"
      >
        <motion.div 
          style={{ x: layer2X, y: layer2Y }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="relative w-64 h-64">
            {/* Central Shield */}
            <motion.div 
              style={{ rotate: scrollRotate }}
              className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(250,204,21,0.4)] border border-white/20 z-20"
            >
              <Shield className="w-24 h-24 text-slate-900" />
            </motion.div>

            {/* Floating Satellites */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-12 -left-12 w-20 h-20 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-2xl z-10"
            >
              <Lock className="w-8 h-8 text-yellow-500" />
            </motion.div>

            <motion.div 
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -bottom-16 -right-8 w-24 h-24 bg-white rounded-3xl border border-slate-100 flex items-center justify-center shadow-2xl z-30"
            >
              <Fingerprint className="w-10 h-10 text-orange-500" />
            </motion.div>

            <motion.div 
              animate={{ x: [0, 15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-20 -right-20 w-16 h-16 bg-white/80 backdrop-blur-md rounded-xl border border-slate-100 flex items-center justify-center shadow-xl z-10"
            >
              <Database className="w-6 h-6 text-emerald-500" />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Foreground Layer (Atmosphere & Sharp elements) */}
      <motion.div 
        style={{ x: layer3X, y: layer3Y }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-10 left-10 p-4 bg-white/40 backdrop-blur-md rounded-2xl border border-slate-200 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Node Integrity : 100%</span>
        </div>

        <div className="absolute bottom-20 right-10 p-6 bg-yellow-500/10 backdrop-blur-lg rounded-3xl border border-yellow-500/20 max-w-[180px]">
           <Zap className="w-6 h-6 text-yellow-600 mb-3" />
           <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">Encryption active on 256-bit sovereign layer.</p>
        </div>

        {/* Light Leaks */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-400/5 rounded-full blur-[120px]" />
      </motion.div>

      {/* Glass Overlay for Depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-white/20 pointer-events-none" />
    </div>
  );
};

export default ParallaxSecuritySpace;
