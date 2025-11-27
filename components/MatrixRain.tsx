import React, { useEffect, useRef } from 'react';

export const MatrixRain: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.parentElement?.clientWidth || window.innerWidth;
    let height = canvas.parentElement?.clientHeight || window.innerHeight;
    
    // Set canvas size to match parent
    canvas.width = width;
    canvas.height = height;

    // Configuration
    const fontSize = 14;
    const columns = Math.ceil(width / fontSize);
    const drops: number[] = new Array(columns).fill(1);
    
    // VS Code-ish palette for the rain
    // Using a mix of green (comments), blue (keywords), and generic code colors
    const colors = ['#6a9955', '#dcdcaa'];
    
    // Characters: Katakana + Numbers + Operators + FULLING
    const chars = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890<>{}[];:+-*/FULLING";
    const targetWord = "FULLING";

    // Track sequence progress for each column. -1 means no sequence active.
    const sequences: number[] = new Array(columns).fill(-1);

    const draw = () => {
      // Create fade effect
      // Use the VS Code background color (#1e1e1e) with high transparency
      ctx.fillStyle = 'rgba(30, 30, 30, 0.05)'; 
      ctx.shadowBlur = 0; // Reset shadow to prevent it affecting the background fade
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px 'Consolas', 'Monaco', monospace`;

      for (let i = 0; i < drops.length; i++) {
        let text = '';
        let isTarget = false;

        // Logic for "FULLING" sequence
        if (sequences[i] >= 0) {
           // We are in a sequence
           text = targetWord[sequences[i]];
           isTarget = true;
           sequences[i]++;
           if (sequences[i] >= targetWord.length) {
             sequences[i] = -1; // Sequence complete
           }
        } else {
           // Random character
           text = chars[Math.floor(Math.random() * chars.length)];
           
           // Chance to start a sequence
           // Adjust probability as needed. 0.005 is 0.5% chance per frame per column.
           if (Math.random() < 0.005) {
             sequences[i] = 0;
           }
        }

        // Pick a random color from our palette to make it look like syntax highlighted code
        if (isTarget) {
          ctx.fillStyle = '#ffffff'; // Bright white for the target word
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.shadowBlur = 0;
        }
        
        // Draw the character
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset drop to top randomly after it has crossed the screen
        // Randomness ensures drops don't fall in a perfect line
        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
          sequences[i] = -1; // Reset sequence if drop resets
        }

        drops[i]++;
      }
    };

    const intervalId = setInterval(draw, 33); // ~30FPS

    const handleResize = () => {
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      // Reset drops on resize to avoid gaps
      const newColumns = Math.ceil(width / fontSize);
      // Preserve existing drops if possible, or extend
      if (newColumns > drops.length) {
         const added = new Array(newColumns - drops.length).fill(1);
         drops.push(...added);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};