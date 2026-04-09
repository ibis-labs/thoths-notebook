"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Moon, Sunrise, Stars } from "lucide-react";

const SESHAT_BUDS = [
  'path71', 'ellipse71', 'ellipse72', 'ellipse73', 'ellipse74', 'ellipse75',
  'ellipse76', 'ellipse77', 'ellipse78', 'ellipse79', 'ellipse80', 'ellipse81',
  'ellipse82', 'ellipse83', 'ellipse84', 'ellipse85', 'ellipse86', 'ellipse88',
  'ellipse87', 'ellipse89', 'ellipse90', 'ellipse91', 'ellipse92', 'ellipse93',
  'ellipse129','ellipse94', 'ellipse95', 'ellipse96', 'ellipse97', 'ellipse98',
  'ellipse99', 'ellipse100','ellipse101','ellipse102','ellipse103','ellipse104',
  'ellipse105','ellipse106','ellipse107','ellipse108','ellipse109','ellipse110',
  'ellipse111','ellipse112','ellipse113','ellipse114','ellipse115','ellipse116',
  'ellipse117','ellipse118','ellipse119','ellipse120','ellipse121','ellipse122',
  'ellipse123','ellipse124','ellipse125','ellipse126','ellipse127',
];

function CalcButton({ label, onClick, variant = "default", className = "" }: { label: string, onClick: (val: string) => void, variant?: "default" | "op" | "eq", className?: string }) {
  let colorStyles = "border-fuchsia-500/20 bg-fuchsia-950/10 text-fuchsia-400 hover:bg-fuchsia-500/5 hover:border-fuchsia-400/50";
  if (variant === "op") {
    colorStyles = "border-cyan-500/20 bg-cyan-950/10 text-cyan-400 hover:bg-cyan-500/5 hover:border-cyan-400/50";
  } else if (variant === "eq") {
    colorStyles = "border-fuchsia-500/50 bg-fuchsia-600/20 text-fuchsia-100 hover:bg-fuchsia-500/30 hover:border-fuchsia-400 shadow-[0_0_15px_rgba(185,21,204,0.4)]";
  }

  return (
    <motion.button
      whileTap={{ scale: 0.92, y: 2 }}
      onClick={() => onClick(label)}
      className={`h-16 flex items-center justify-center rounded-2xl border transition-all shadow-inner font-display text-xl ${colorStyles} ${className}`}
    >
      {label}
    </motion.button>
  );
}

function toEgyptian(valStr: string): string {
  const val = parseFloat(valStr);
  if (isNaN(val) || !isFinite(val)) return valStr;
  if (Number.isInteger(val)) return val.toString();

  let v = Math.abs(val);
  let result = [];
  let intPart = Math.floor(v);
  if (intPart > 0) {
    result.push(intPart.toString());
    v -= intPart;
  }

  let maxIterations = 10;
  while (v > 0.000001 && maxIterations > 0) {
    let dr = Math.ceil(1 / v);
    result.push(`1/${dr}`);
    v -= 1 / dr;
    maxIterations--;
  }
  
  let finalStr = result.length > 0 ? result.join(" + ") : "0";
  return val < 0 ? `-(${finalStr})` : finalStr;
}

type CalcMode = 'SIMPLE' | 'SCIENTIFIC' | 'EGYPTIAN';

export function SeshatInterface() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [isRippleLocked, setIsRippleLocked] = useState(false);
  const rippleLockRef = useRef(false);

  const [mode, setMode] = useState<CalcMode>('SIMPLE');
  const [calcInput, setCalcInput] = useState("0");
  const [calcMemory, setCalcMemory] = useState("");

  // Load the SVG
  useEffect(() => {
    fetch("/images/SeshatAnimation.svg")
      .then((res) => res.text())
      .then((text) => {
        setSvgContent(text);
      })
      .catch((err) => console.error("Failed to load Seshat SVG:", err));
  }, []);

  // Setup Clock and Ripple effects
  useEffect(() => {
    if (!svgContent) return;

    const tick = () => {
      if (!containerRef.current) return;
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      const isQtr = now.getMinutes() % 15 === 0;
      const pastHalf = now.getMinutes() >= 30;
      const n = SESHAT_BUDS.length - 1;

      const mainIdx = Math.round((mins / 1440) * n);
      const halfMins = now.getHours() * 60 + 30;
      const halfIdx = Math.round((halfMins / 1440) * n);

      const getBud = (id: string) => containerRef.current?.querySelector(`#${id}`) as HTMLElement | null;

      SESHAT_BUDS.forEach((id) => {
        const el = getBud(id);
        if (el) {
          el.classList.remove("seshat-bud-on", "seshat-bud-dim");
        }
      });

      const mainEl = getBud(SESHAT_BUDS[mainIdx]);
      if (mainEl) mainEl.classList.add("seshat-bud-on");

      if (pastHalf && halfIdx !== mainIdx) {
        const halfEl = getBud(SESHAT_BUDS[halfIdx]);
        if (halfEl) halfEl.classList.add("seshat-bud-dim");
      }

      if (isQtr && !rippleLockRef.current) {
        rippleLockRef.current = true;
        setIsRippleLocked(true);
        SESHAT_BUDS.forEach((id, i) => {
          const el = getBud(id);
          if (el) {
            el.style.animation = `seshat-ripple 0.8s ${(i * 0.025).toFixed(3)}s ease-out forwards`;
          }
        });

        setTimeout(() => {
          SESHAT_BUDS.forEach((id) => {
            const el = getBud(id);
            if (el) {
              el.style.animation = "";
            }
          });
          rippleLockRef.current = false;
          setIsRippleLocked(false);
        }, 2600);
      } else if (!isQtr) {
        rippleLockRef.current = false;
        setIsRippleLocked(false);
      }
    };

    tick();
    const intervalId = setInterval(tick, 60_000);

    return () => clearInterval(intervalId);
  }, [svgContent]);

  const toggleMode = () => {
    if (mode === 'SIMPLE') setMode('SCIENTIFIC');
    else if (mode === 'SCIENTIFIC') setMode('EGYPTIAN');
    else setMode('SIMPLE');
  };

  const handleCalcClick = (val: string) => {
    if (window.navigator.vibrate) window.navigator.vibrate(40);
    if (val === "C") {
      setCalcInput("0");
      setCalcMemory("");
      return;
    }
    if (val === "RND") {
      const rand = Math.random().toString().slice(0, 7); // e.g., 0.1234
      if (calcInput === "0" || calcInput === "Error") {
        setCalcInput(rand);
      } else {
        setCalcInput(calcInput + rand);
      }
      return;
    }
    if (val === "=") {
      try {
        let evalStr = calcInput
          .replace(/sin\(/g, "Math.sin(")
          .replace(/cos\(/g, "Math.cos(")
          .replace(/tan\(/g, "Math.tan(")
          .replace(/log\(/g, "Math.log10(")
          .replace(/ln\(/g, "Math.log(")
          .replace(/sqrt\(/g, "Math.sqrt(")
          .replace(/\^/g, "**")
          .replace(/π/g, "Math.PI")
          .replace(/I\?/g, "Math.PI")
          .replace(/e/g, "Math.E");

        const result = new Function(`return ${evalStr}`)();
        setCalcMemory(calcInput);
        setCalcInput(String(result));
      } catch (e) {
        setCalcInput("Error");
      }
      return;
    }

    if (calcInput === "0" || calcInput === "Error") {
      setCalcInput(val);
    } else {
      setCalcInput(calcInput + val);
    }
  };

  const getDisplayText = () => {
    if (mode === 'EGYPTIAN') {
      const parsed = Number(calcInput);
      if (!isNaN(parsed) && calcInput !== "Error" && calcInput !== "") {
         return toEgyptian(calcInput);
      }
    }
    return calcInput;
  };

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-center p-6 gap-10">
      {/* BACKGROUND ANIMATION / SVG CONTAINER */}
      <div 
        id="seshat-button"
        className="w-full max-w-2xl h-auto drop-shadow-[0_0_25px_rgba(185,21,204,0.3)] animate-pulse-purple text-[#B915CC]"
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      
      {/* RIGHT COLUMN: DISPLAY & CALCULATOR */}
      <div className="relative z-10 w-full max-w-md flex flex-col gap-6">
        
        {/* Separate Display Box */}
        <div className="w-full bg-black/80 rounded-[2rem] border border-fuchsia-500/30 p-6 shadow-2xl text-right backdrop-blur-md">
          <div className="min-h-[24px] text-fuchsia-500/50 font-mono text-sm mb-2 break-all">{calcMemory}</div>
          <div className="text-3xl font-display text-fuchsia-300 tracking-wider break-all">{getDisplayText()}</div>
        </div>

        {/* CALCULATOR PANEL */}
        <div className="w-full rounded-[2.5rem] border border-fuchsia-500/30 bg-black/60 backdrop-blur-md shadow-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleMode}
                className="px-3 py-2 bg-fuchsia-500/20 rounded-xl hover:bg-fuchsia-500/40 transition-colors border border-fuchsia-500/30 active:scale-95"
              >
                <span className="font-display text-fuchsia-400 text-xs font-bold tracking-widest">{mode}</span>
              </button>
              <div>
                <h2 className="font-headline text-fuchsia-400 uppercase tracking-widest text-lg leading-tight">Seshat Interface</h2>
                <p className="text-fuchsia-300/50 text-[10px] uppercase tracking-widest">Cosmic Arithmetics</p>
              </div>
            </div>
            <Stars className="w-5 h-5 text-fuchsia-500/50 animate-pulse" />
          </div>

          {/* Keypad */}
          {mode === 'SCIENTIFIC' ? (
            <div className="grid grid-cols-5 gap-3">
              {["sin(", "cos(", "tan(", "C", "/"].map((btn) => (
                <CalcButton key={btn} label={btn} onClick={handleCalcClick} variant="op" className={btn.length > 1 && btn !== "C" ? "text-sm" : ""} />
              ))}
              {["log(", "7", "8", "9", "*"].map((btn) => (
                <CalcButton key={btn} label={btn} onClick={handleCalcClick} variant={["*", "/", "+", "-"].includes(btn) ? "op" : "default"} className={btn.length > 1 ? "text-sm" : ""} />
              ))}
              {["ln(", "4", "5", "6", "-"].map((btn) => (
                <CalcButton key={btn} label={btn} onClick={handleCalcClick} variant={["*", "/", "+", "-"].includes(btn) ? "op" : "default"} className={btn.length > 1 ? "text-sm" : ""} />
              ))}
              {["sqrt(", "1", "2", "3", "+"].map((btn) => (
                <CalcButton key={btn} label={btn} onClick={handleCalcClick} variant={["*", "/", "+", "-"].includes(btn) ? "op" : "default"} className={btn.length > 1 ? "text-xs" : ""} />
              ))}
              {["^", "0", ".", "π", "="].map((btn) => (
                <CalcButton 
                  key={btn} 
                  label={btn}
                  onClick={handleCalcClick} 
                  variant={btn === "=" ? "eq" : "default"}
                />
              ))}
              {["RND"].map((btn) => (
                <CalcButton 
                  key={btn} 
                  label={btn}
                  onClick={handleCalcClick} 
                  className="col-span-5 text-sm"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {["C", "(", ")", "/"].map((btn) => (
                <CalcButton key={btn} label={btn} onClick={handleCalcClick} variant="op" />
              ))}
              {["7", "8", "9", "*"].map((btn) => (
                <CalcButton key={btn} label={btn} onClick={handleCalcClick} variant={["*", "/", "+", "-"].includes(btn) ? "op" : "default"} />
              ))}
              {["4", "5", "6", "-"].map((btn) => (
                <CalcButton key={btn} label={btn} onClick={handleCalcClick} variant={["*", "/", "+", "-"].includes(btn) ? "op" : "default"} />
              ))}
              {["1", "2", "3", "+"].map((btn) => (
                <CalcButton key={btn} label={btn} onClick={handleCalcClick} variant={["*", "/", "+", "-"].includes(btn) ? "op" : "default"} />
              ))}
              {["0", ".", "RND", "="].map((btn) => (
                <CalcButton 
                  key={btn} 
                  label={btn}
                  onClick={handleCalcClick} 
                  variant={btn === "=" ? "eq" : "default"}
                  className={btn === "RND" ? "text-sm" : ""}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-purple {
            0%, 100% {
                filter: drop-shadow(0 0 10px #B915CC);
            }
            50% {
                filter: drop-shadow(0 0 30px #B915CC);
            }
        }
        .animate-pulse-purple {
            animation: pulse-purple 6s infinite ease-in-out;
        }
      `}} />
    </div>
  );
}
