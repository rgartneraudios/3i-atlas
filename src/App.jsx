import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(0); 

  // --- ESTADO FÍSICO ---
  const [player, setPlayer] = useState({ x: 50, y: 85, vx: 0, vy: 0 });
  const [enemies, setEnemies] = useState([]);

  // Refs
  const keysPressed = useRef({});
  const playerRef = useRef(player);
  const enemiesRef = useRef(enemies);
  const gameOverRef = useRef(gameOver);

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { enemiesRef.current = enemies; }, [enemies]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);

  // Detector de Teclado
  useEffect(() => {
    const handleKeyDown = (e) => { keysPressed.current[e.key] = true; };
    const handleKeyUp = (e) => { keysPressed.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // --- BUCLE DEL JUEGO ---
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const loop = setInterval(() => {
      // 1. FÍSICAS DE LA NAVE (Suaves y precisas)
      let { x, y, vx, vy } = playerRef.current;
      
      const acceleration = 0.9; 
      const friction = 0.65;    
      
      if (keysPressed.current['ArrowLeft']) vx -= acceleration;
      if (keysPressed.current['ArrowRight']) vx += acceleration;
      if (keysPressed.current['ArrowUp']) vy -= acceleration;
      if (keysPressed.current['ArrowDown']) vy += acceleration;

      vx *= friction;
      vy *= friction;
      x += vx;
      y += vy;

      // Límites
      if (x < 0) { x = 0; vx = 0; }
      if (x > 92) { x = 92; vx = 0; }
      if (y < 0) { y = 0; vy = 0; }
      if (y > 90) { y = 90; vy = 0; } 

      setPlayer({ x, y, vx, vy });

      // 2. SISTEMA DE PUNTOS (ACELERADOR)
      // Mientras más arriba estés, más puntos sumas CADA 20 MILISEGUNDOS
      let currentMult = 0;
      
      if (y > 85) {
        currentMult = 0; // SAFE (0 puntos)
      } else if (y > 65) {
        currentMult = 1; // BLANCO (+1 pto)
      } else if (y > 50) {
        currentMult = 3; // FUCSIA (+3 ptos)
      } else if (y > 35) {
        currentMult = 5; // CYAN (+5 ptos)
      } else if (y > 15) {
        currentMult = 7; // AMARILLO (+7 ptos)
      } else {
        currentMult = 10; // ORANGE MAX (+10 ptos por tick!)
      }
      
      setMultiplier(currentMult);
      setScore(s => s + currentMult);

      // 3. GENERAR ENEMIGOS
      if (Math.random() < 0.06) { 
        setEnemies(prev => [...prev, {
          id: Date.now() + Math.random(),
          x: Math.random() * 95,
          y: -15, 
          speed: 0.5 + Math.random() * 1.0
        }]);
      }

      // 4. MOVER ENEMIGOS
      setEnemies(prev => prev.map(e => ({ ...e, y: e.y + e.speed }))
                             .filter(e => e.y < 120));

      // 5. COLISIONES
      const pRect = { x: x + 1, y: y + 1, w: 3, h: 5 }; 
      enemiesRef.current.forEach(e => {
        const eRect = { x: e.x, y: e.y, w: 2, h: 8 };
        if (
          pRect.x < eRect.x + eRect.w &&
          pRect.x + pRect.w > eRect.x &&
          pRect.y < eRect.y + eRect.h &&
          pRect.y + pRect.h > eRect.y
        ) {
          setGameOver(true);
        }
      });

    }, 20);

    return () => clearInterval(loop);
  }, [gameStarted, gameOver]);

  // --- CONFIGURACIÓN DE COLORES ---
  const getRiskColor = (m) => {
    if (m === 0) return '#4ade80'; // Verde (Safe)
    if (m === 1) return '#ffffff'; // Blanco
    if (m === 3) return '#d946ef'; // Fucsia / Violeta
    if (m === 5) return '#06b6d4'; // Cyan
    if (m === 7) return '#4FFF14'; //Green
    return '#ff0000';              // NUEVO: Rojo Puro Peligro (Red)
  };
  
  // --- ESTILOS ---
  const styles = {
    container: {
      position: 'relative', width: '100vw', height: '100vh',
      backgroundColor: 'black', overflow: 'hidden', cursor: 'none'
    },
    videoBackground: {
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      objectFit: 'cover', zIndex: 0, opacity: 0.7 
    },
    player: {
      position: 'absolute', left: `${player.x}%`, top: `${player.y}%`,
      width: '40px', height: 'auto', zIndex: 10,
      transform: `rotate(${player.vx * 2}deg)`,
      transition: 'width 0.2s',
      filter: `drop-shadow(0 0 ${5 + multiplier}px ${getRiskColor(multiplier)})`
    },
    enemy: (x, y) => ({
      position: 'absolute', left: `${x}%`, top: `${y}%`,
      width: '14px', height: '45px',   
      background: 'linear-gradient(180deg, #fff 20%, rgba(200,200,255,0.5) 100%)', 
      borderRadius: '10px',
      boxShadow: '0 0 10px 2px rgba(255, 255, 255, 0.9), 0 0 20px 5px rgba(100, 150, 255, 0.4)', 
      zIndex: 5
    }),
    uiContainer: {
      position: 'absolute', top: '20px', left: '20px',
      display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 20
    },
    score: {
      color: 'white', textShadow: '0 0 10px black',
      fontSize: '28px', fontFamily: 'monospace', fontWeight: 'bold',
    },
    multiplier: {
      fontSize: '20px', fontFamily: 'monospace', fontWeight: 'bold',
      color: getRiskColor(multiplier), 
      textShadow: '0 0 10px black', transition: 'color 0.3s ease'
    },
    safeZone: {
      position: 'absolute', bottom: 0, width: '100%', height: '10%', 
      background: 'linear-gradient(to top, rgba(0,255,0,0.1), transparent)', 
      borderBottom: '4px solid #4ade80',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
      paddingBottom: '10px', color: '#4ade80', fontWeight: 'bold',
      fontSize: '12px', letterSpacing: '5px', zIndex: 2
    },
    menu: {
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: 'white', zIndex: 100
    },
    instructions: {
      marginTop: '30px', fontFamily: 'monospace', color: '#aaa',
      textAlign: 'center', lineHeight: '1.5', fontSize: '14px',
      border: '1px solid #333', padding: '15px', borderRadius: '10px',
      background: 'rgba(0,0,0,0.5)'
    },
    button: {
      marginTop: '20px', padding: '15px 40px', fontSize: '18px',
      backgroundColor: 'white', color: 'black', border: 'none', cursor: 'pointer',
      fontFamily: 'monospace', fontWeight: 'bold', transform: 'skewX(-10deg)',
      boxShadow: '0 0 15px white'
    }
  };

  return (
    <div style={styles.container}>
      
      <video src="/space.mp4" autoPlay loop muted playsInline style={styles.videoBackground}/>

      {!gameOver && <img src="/atlas.png" alt="Player" style={styles.player}/>}

      {enemies.map(e => <div key={e.id} style={styles.enemy(e.x, e.y)} />)}

      <div style={styles.uiContainer}>
        <div style={styles.score}>SCORE: {score}</div>
        <div style={styles.multiplier}>
          {multiplier === 0 ? "SAFE (0x)" : multiplier === 10 ? "MAXIMUM (10x) 🔥" : `RISK: ${multiplier}x`}
        </div>
      </div>

      <div style={styles.safeZone}>SAFE ZONE</div>

      {(!gameStarted || gameOver) && (
        <div style={styles.menu}>
          <h1 style={{ fontSize: '60px', fontStyle: 'italic', background: '-webkit-linear-gradient(#e879f9, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            3I ATLAS
          </h1>
          
          {gameOver && <h2 style={{ color: '#ff4444' }}>IMPACT CONFIRMED - SCORE: {score}</h2>}
          
          <button 
            style={styles.button}
            onClick={() => {
              setGameStarted(true); setGameOver(false); setScore(0);
              setPlayer({ x: 50, y: 85, vx: 0, vy: 0 }); setEnemies([]);
              keysPressed.current = {};
            }}
          >
            {gameOver ? "RETRY" : "LAUNCH"}
          </button>

          {/* INSTRUCCIONES */}
          <div style={styles.instructions}>
            <p style={{margin:0, color:'white', fontWeight:'bold', marginBottom:'10px'}}>CONTROLES</p>
            USA LAS FLECHAS ⌨️<br/>
            <span style={{fontSize:'24px'}}>⬅️ ⬇️ ⬆️ ➡️</span><br/><br/>
            SUBE PARA GANAR PUNTOS<br/>
            <span style={{color: '#ff6600'}}>MAYOR RIESGO = MAYOR PUNTAJE</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;