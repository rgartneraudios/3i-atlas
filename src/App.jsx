import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(0); 

  // --- ESTADO FÍSICO ---
  const [player, setPlayer] = useState({ x: 50, y: 85, vx: 0, vy: 0 });
  const [enemies, setEnemies] = useState([]);

  // --- REFS ---
  const keysPressed = useRef({});
  const playerRef = useRef(player);
  const enemiesRef = useRef(enemies);
  const gameOverRef = useRef(gameOver);
  const audioRef = useRef(null); // Ref para el audio

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { enemiesRef.current = enemies; }, [enemies]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);

  // --- INICIALIZACIÓN DE AUDIO ---
  useEffect(() => {
    // Creamos el objeto de audio una sola vez
    audioRef.current = new Audio(`${import.meta.env.BASE_URL}space.mp3`);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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

      if (x < 0) { x = 0; vx = 0; }
      if (x > 92) { x = 92; vx = 0; }
      if (y < 0) { y = 0; vy = 0; }
      if (y > 90) { y = 90; vy = 0; } 

      setPlayer({ x, y, vx, vy });

      // Multiplicador por altura
      let currentMult = 0;
      if (y > 85) currentMult = 0;
      else if (y > 65) currentMult = 1;
      else if (y > 50) currentMult = 3;
      else if (y > 35) currentMult = 5;
      else if (y > 15) currentMult = 7;
      else currentMult = 10;
      
      setMultiplier(currentMult);
      setScore(s => s + currentMult);

      if (Math.random() < 0.06) { 
        setEnemies(prev => [...prev, {
          id: Date.now() + Math.random(),
          x: Math.random() * 95,
          y: -15, 
          speed: 0.6 + Math.random() * 1.2
        }]);
      }

      setEnemies(prev => prev.map(e => ({ ...e, y: e.y + e.speed }))
                             .filter(e => e.y < 120));

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
          // Opcional: bajar volumen al morir
          if (audioRef.current) audioRef.current.volume = 0.1;
        }
      });

    }, 20);

    return () => clearInterval(loop);
  }, [gameStarted, gameOver]);

  const getRiskColor = (m) => {
    if (m === 0) return '#e879f9'; // Fucsia (Safe)
    if (m === 1) return '#ffffff';
    if (m === 3) return '#d946ef';
    if (m === 5) return '#06b6d4';
    if (m === 7) return '#4FFF14';
    return '#ff0000';
  };
  
  // --- ESTILOS DINÁMICOS ---
  const styles = {
    container: {
  position: 'relative', width: '100vw', height: '100vh',
  backgroundColor: 'black', overflow: 'hidden', cursor: 'none',
  filter: 'contrast(1.0) brightness(0.8)' // <--- Añade esto para negros más puros
},
    videoBackground: {
  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
  objectFit: 'cover', zIndex: 0, 
  opacity: 0.6 // <--- Bajado de 0.6 a 0.3 (Mucho más oscuro)
},
    // NUEVA CAPA DE NEBULOSA ROTATORIA
   nebulaLayer: {
    position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
    // Bajamos el 0.08 a 0.03 para que sea casi imperceptible
    backgroundImage: 'radial-gradient(circle, rgba(217, 70, 239, 0.03) 0%, transparent 60%)', 
    zIndex: 1, pointerEvents: 'none', animation: 'rotateNebula 80s linear infinite'
},
    player: {
      position: 'absolute', left: `${player.x}%`, top: `${player.y}%`,
      width: '45px', height: 'auto', zIndex: 10,
      transform: `rotate(${player.vx * 2}deg)`,
      filter: `drop-shadow(0 0 ${10 + multiplier}px ${getRiskColor(multiplier)})`,
      transition: 'filter 0.3s'
    },
    enemy: (x, y) => ({
      position: 'absolute', left: `${x}%`, top: `${y}%`,
      width: '12px', height: '40px',   
      background: 'linear-gradient(180deg, #fff 10%, rgba(200,200,255,0.3) 100%)', 
      borderRadius: '20px',
      boxShadow: '0 0 15px white', zIndex: 5
    }),
    uiContainer: {
      position: 'absolute', top: '20px', left: '20px',
      display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 20
    },
    score: {
      color: 'white', textShadow: '0 0 10px black',
      fontSize: '24px', fontFamily: 'monospace', fontWeight: 'black',
    },
    multiplier: {
      fontSize: '16px', fontFamily: 'monospace', fontWeight: 'bold',
      color: getRiskColor(multiplier), textShadow: '0 0 10px black'
    },
    // LA NUEVA SAFE ZONE (NEBULOSA)
    safeZone: {
  position: 'absolute', bottom: 0, width: '100%', height: '12%', 
  // Bajamos el 0.2 a 0.05
  background: 'linear-gradient(to top, rgba(232, 121, 249, 0.05), transparent)', 
  borderTop: '1px solid rgba(232, 121, 249, 0.2)', // Línea más tenue
  display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
  paddingBottom: '15px', color: 'rgba(232, 121, 249, 0.5)', // Texto más apagado
  fontWeight: 'black',
  fontSize: '10px', letterSpacing: '10px', zIndex: 2, opacity: 0.6
},
    menu: {
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: 'white', zIndex: 100
    },
    instructions: {
      marginTop: '30px', fontFamily: 'monospace', color: '#888',
      textAlign: 'center', fontSize: '12px', letterSpacing: '1px',
      border: '1px solid #222', padding: '20px', borderRadius: '15px',
      background: 'rgba(0,0,0,0.6)'
    },
    button: {
      marginTop: '20px', padding: '15px 50px', fontSize: '20px',
      backgroundColor: 'white', color: 'black', border: 'none', cursor: 'pointer',
      fontFamily: 'monospace', fontWeight: 'black', transform: 'skewX(-15deg)',
      boxShadow: '0 0 20px rgba(255,255,255,0.4)', transition: 'all 0.2s'
    }
  };

  return (
    <div style={styles.container}>
      
      {/* INYECTAMOS KEYFRAMES CSS PARA LAS ANIMACIONES */}
      <style>{`
        @keyframes rotateNebula { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        button:hover { background: #e879f9 !important; color: white !important; transform: skewX(-15deg) scale(1.1) !important; box-shadow: 0 0 30px #e879f9 !important; }
      `}</style>
      
      <video src={`${import.meta.env.BASE_URL}space.mp4`} autoPlay loop muted playsInline style={styles.videoBackground}/>
      
      <div style={styles.nebulaLayer}></div>

      {!gameOver && <img src={`${import.meta.env.BASE_URL}atlas.png`} alt="Player" style={styles.player}/>}

      {enemies.map(e => <div key={e.id} style={styles.enemy(e.x, e.y)} />)}

      <div style={styles.uiContainer}>
        <div style={styles.score}>SCORE: {score}</div>
        <div style={styles.multiplier}>
          {multiplier === 0 ? "CORE STABLE (0x)" : multiplier === 10 ? "CRITICAL RISK (10x) 🔥" : `RISK LEVEL: ${multiplier}x`}
        </div>
      </div>

      <div style={styles.safeZone}>S E N S O R S : O N</div>

      {(!gameStarted || gameOver) && (
        <div style={styles.menu}>
          <h1 style={{ fontSize: '70px', fontStyle: 'italic', fontWeight: '900', background: '-webkit-linear-gradient(#e879f9, #3b82f6)', WebkitBackgroundClip: 'text', WebkitFillColor: 'transparent', margin: 0, letterSpacing: '-4px' }}>
            3i-ATLAS
          </h1>
          
          {gameOver && (
            <div style={{textAlign:'center'}}>
                <h2 style={{ color: '#ff4444', fontWeight:'bold', letterSpacing:'2px' }}>IMPACT DETECTED</h2>
                <p style={{fontSize:'30px', fontWeight:'black'}}>RESULT: {score}</p>
            </div>
          )}
          
          <button 
            style={styles.button}
            onClick={() => {
              setGameStarted(true); setGameOver(false); setScore(0);
              setPlayer({ x: 50, y: 85, vx: 0, vy: 0 }); setEnemies([]);
              keysPressed.current = {};
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.volume = 0.4;
                audioRef.current.play();
              }
            }}
          >
            {gameOver ? "RE-LAUNCH" : "IGNITION"}
          </button>

          <div style={styles.instructions}>
            <p style={{margin:0, color:'#e879f9', fontWeight:'bold', marginBottom:'10px', fontSize:'14px'}}>FLIGHT CONTROLS</p>
            USE ARROW KEYS ⌨️<br/>
            <span style={{fontSize:'20px', color:'white'}}>⬅️ ⬇️ ⬆️ ➡️</span><br/><br/>
            ASCEND TO MULTIPLY ENERGY<br/>
            <span style={{color: '#3b82f6'}}>HIGH ALTITUDE = HIGH REWARD</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;