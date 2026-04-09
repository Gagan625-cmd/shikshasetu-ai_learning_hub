import { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  Platform,
  Easing,
  PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Brain, Lock, Trophy, Zap, ChevronRight, Star, X, Check, Grid3x3, GraduationCap, PersonStanding } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/app-context';
import { useTheme } from '@/contexts/theme-context';
import { getRandomGKQuestions, getRandomToughGKQuestions, GKQuestion } from '@/constants/gk-questions';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type GameScreen = 'home' | 'pacman' | 'flappy' | 'tictactoe' | 'gk-quiz' | 'runner';

const GRID_SIZE = 15;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 48) / GRID_SIZE);
const PACMAN_MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
  [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],
  [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
  [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,1,0,1,0,0,0,1,0,0,0,1,0,1,1],
  [1,0,0,1,1,0,1,1,1,0,1,1,0,0,1],
  [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
  [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

function countDots(): number {
  let count = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (PACMAN_MAZE[r][c] === 0) count++;
    }
  }
  return count - 1;
}

const TOTAL_DOTS = countDots();

const FLAPPY_GRAVITY = 0.35;
const FLAPPY_JUMP = -7;
const PIPE_WIDTH = 54;
const PIPE_GAP = 160;
const BIRD_SIZE = 34;
const GAME_HEIGHT = 460;
const GAME_WIDTH = SCREEN_WIDTH - 32;

function PacmanGame({ onFinish, colors: _themeColors }: { onFinish: (won: boolean) => void; colors: any }) {
  const [pacPos, setPacPos] = useState({ row: 1, col: 1 });
  const [facingDir, setFacingDir] = useState<'left' | 'right' | 'up' | 'down'>('right');
  const [ghostPos, setGhostPos] = useState({ row: 7, col: 7 });
  const [ghost2Pos, setGhost2Pos] = useState({ row: 5, col: 11 });
  const [ghost3Pos, setGhost3Pos] = useState({ row: 11, col: 3 });
  const [dots, setDots] = useState<Set<string>>(() => {
    const d = new Set<string>();
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (PACMAN_MAZE[r][c] === 0 && !(r === 1 && c === 1)) {
          d.add(`${r}-${c}`);
        }
      }
    }
    return d;
  });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const ghostInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const leafAnim1 = useRef(new Animated.Value(0)).current;
  const leafAnim2 = useRef(new Animated.Value(0)).current;
  const foxBounce = useRef(new Animated.Value(1)).current;
  const firefly1 = useRef(new Animated.Value(0)).current;
  const firefly2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(leafAnim1, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(leafAnim1, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(leafAnim2, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(leafAnim2, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(firefly1, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(firefly1, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(firefly2, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(firefly2, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, [leafAnim1, leafAnim2, firefly1, firefly2]);

  const movePacman = useCallback((dr: number, dc: number) => {
    if (gameOver) return;
    if (dc > 0) setFacingDir('right');
    else if (dc < 0) setFacingDir('left');
    else if (dr < 0) setFacingDir('up');
    else if (dr > 0) setFacingDir('down');
    Animated.sequence([
      Animated.timing(foxBounce, { toValue: 1.2, duration: 80, useNativeDriver: true }),
      Animated.timing(foxBounce, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    setPacPos(prev => {
      const nr = prev.row + dr;
      const nc = prev.col + dc;
      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) return prev;
      if (PACMAN_MAZE[nr][nc] === 1) return prev;
      const key = `${nr}-${nc}`;
      if (dots.has(key)) {
        setDots(prevDots => {
          const nd = new Set(prevDots);
          nd.delete(key);
          if (nd.size === 0) {
            setGameOver(true);
            onFinish(true);
          }
          return nd;
        });
        setScore(s => s + 1);
      }
      return { row: nr, col: nc };
    });
  }, [gameOver, dots, onFinish, foxBounce]);

  const moveGhostSmart = useCallback((ghostPrev: { row: number; col: number }, target: { row: number; col: number }) => {
    const directions = [
      { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
      { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
    ];
    const valid = directions.filter(d => {
      const nr = ghostPrev.row + d.dr;
      const nc = ghostPrev.col + d.dc;
      return nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && PACMAN_MAZE[nr][nc] === 0;
    });
    if (valid.length === 0) return ghostPrev;
    if (Math.random() < 0.6) {
      valid.sort((a, b) => {
        const distA = Math.abs(ghostPrev.row + a.dr - target.row) + Math.abs(ghostPrev.col + a.dc - target.col);
        const distB = Math.abs(ghostPrev.row + b.dr - target.row) + Math.abs(ghostPrev.col + b.dc - target.col);
        return distA - distB;
      });
    }
    const move = valid[0];
    return { row: ghostPrev.row + move.dr, col: ghostPrev.col + move.dc };
  }, []);

  useEffect(() => {
    ghostInterval.current = setInterval(() => {
      if (gameOver) return;
      setGhostPos(prev => moveGhostSmart(prev, pacPos));
      setGhost2Pos(prev => {
        const directions = [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];
        const valid = directions.filter(d => {
          const nr = prev.row + d.dr; const nc = prev.col + d.dc;
          return nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && PACMAN_MAZE[nr][nc] === 0;
        });
        if (valid.length === 0) return prev;
        if (Math.random() < 0.45) {
          valid.sort((a, b) => {
            const distA = Math.abs(prev.row + a.dr - pacPos.row) + Math.abs(prev.col + a.dc - pacPos.col);
            const distB = Math.abs(prev.row + b.dr - pacPos.row) + Math.abs(prev.col + b.dc - pacPos.col);
            return distA - distB;
          });
        }
        return { row: prev.row + valid[0].dr, col: prev.col + valid[0].dc };
      });
      setGhost3Pos(prev => {
        const directions = [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];
        const valid = directions.filter(d => {
          const nr = prev.row + d.dr; const nc = prev.col + d.dc;
          return nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && PACMAN_MAZE[nr][nc] === 0;
        });
        if (valid.length === 0) return prev;
        const move = valid[Math.floor(Math.random() * valid.length)];
        return { row: prev.row + move.dr, col: prev.col + move.dc };
      });
    }, 350);
    return () => { if (ghostInterval.current) clearInterval(ghostInterval.current); };
  }, [gameOver, pacPos, moveGhostSmart]);

  useEffect(() => {
    if (gameOver) return;
    const hitGhost = (pacPos.row === ghostPos.row && pacPos.col === ghostPos.col) ||
      (pacPos.row === ghost2Pos.row && pacPos.col === ghost2Pos.col) ||
      (pacPos.row === ghost3Pos.row && pacPos.col === ghost3Pos.col);
    if (hitGhost) {
      setGameOver(true);
      onFinish(false);
    }
  }, [pacPos, ghostPos, ghost2Pos, ghost3Pos, gameOver, onFinish]);

  const mazeWidth = GRID_SIZE * CELL_SIZE;

  const leafTranslate1 = leafAnim1.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] });
  const leafTranslate2 = leafAnim2.interpolate({ inputRange: [0, 1], outputRange: [2, -2] });

  const foxRotation = facingDir === 'left' ? '180deg' : facingDir === 'up' ? '-90deg' : facingDir === 'down' ? '90deg' : '0deg';

  return (
    <View style={pacStyles.container}>
      <View style={pacStyles.forestHeader}>
        <Text style={pacStyles.forestTitle}>🌲 Forest Maze 🌲</Text>
        <View style={pacStyles.scoreRow}>
          <Text style={pacStyles.scoreText}>🍎 {score}/{TOTAL_DOTS}</Text>
          {gameOver && (
            <View style={[pacStyles.gameOverBadge, { backgroundColor: score === TOTAL_DOTS ? '#10b981' : '#ef4444' }]}>
              <Text style={pacStyles.gameOverText}>{score === TOTAL_DOTS ? '🎉 You Win!' : '💀 Game Over'}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={[pacStyles.maze, { width: mazeWidth, height: mazeWidth }]}>
        {PACMAN_MAZE.map((row, r) =>
          row.map((cell, c) => (
            <View
              key={`${r}-${c}`}
              style={[
                pacStyles.cell,
                {
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  left: c * CELL_SIZE,
                  top: r * CELL_SIZE,
                  backgroundColor: cell === 1 ? '#2d5a27' : '#1a3a15',
                },
              ]}
            >
              {cell === 1 && (
                <View style={pacStyles.treeTrunk}>
                  <View style={pacStyles.treeLeaves} />
                </View>
              )}
              {cell === 0 && dots.has(`${r}-${c}`) && (
                <View style={pacStyles.berry} />
              )}
            </View>
          ))
        )}

        <Animated.View style={[pacStyles.forestLeaf, { left: 20, top: 15, transform: [{ translateX: leafTranslate1 }], opacity: 0.6 }]}>
          <Text style={{ fontSize: 10 }}>🍃</Text>
        </Animated.View>
        <Animated.View style={[pacStyles.forestLeaf, { right: 25, top: 40, transform: [{ translateX: leafTranslate2 }], opacity: 0.5 }]}>
          <Text style={{ fontSize: 8 }}>🍂</Text>
        </Animated.View>
        <Animated.View style={[pacStyles.forestLeaf, { left: 50, bottom: 30, transform: [{ translateX: leafTranslate1 }], opacity: 0.4 }]}>
          <Text style={{ fontSize: 9 }}>🍃</Text>
        </Animated.View>

        <Animated.View style={[pacStyles.fireflyDot, { left: '30%', top: '20%', opacity: firefly1 }]} />
        <Animated.View style={[pacStyles.fireflyDot, { left: '70%', top: '60%', opacity: firefly2 }]} />
        <Animated.View style={[pacStyles.fireflyDot, { left: '50%', top: '80%', opacity: firefly1 }]} />

        <Animated.View
          style={[
            pacStyles.foxCharacter,
            {
              left: pacPos.col * CELL_SIZE + CELL_SIZE / 2 - 11,
              top: pacPos.row * CELL_SIZE + CELL_SIZE / 2 - 11,
              transform: [{ scale: foxBounce }, { rotate: foxRotation }],
            },
          ]}
        >
          <View style={pacStyles.foxMazeBody}>
            <View style={pacStyles.foxMazeEarL} />
            <View style={pacStyles.foxMazeEarR} />
            <View style={pacStyles.foxMazeEye} />
            <View style={pacStyles.foxMazeNose} />
            <View style={pacStyles.foxMazeTail} />
          </View>
        </Animated.View>

        <View
          style={[
            pacStyles.wolf,
            {
              left: ghostPos.col * CELL_SIZE + CELL_SIZE / 2 - 10,
              top: ghostPos.row * CELL_SIZE + CELL_SIZE / 2 - 10,
            },
          ]}
        >
          <Text style={pacStyles.wolfEmoji}>🐺</Text>
        </View>
        <View
          style={[
            pacStyles.wolf,
            {
              left: ghost2Pos.col * CELL_SIZE + CELL_SIZE / 2 - 10,
              top: ghost2Pos.row * CELL_SIZE + CELL_SIZE / 2 - 10,
            },
          ]}
        >
          <Text style={pacStyles.wolfEmoji}>🐍</Text>
        </View>
        <View
          style={[
            pacStyles.wolf,
            {
              left: ghost3Pos.col * CELL_SIZE + CELL_SIZE / 2 - 10,
              top: ghost3Pos.row * CELL_SIZE + CELL_SIZE / 2 - 10,
            },
          ]}
        >
          <Text style={pacStyles.wolfEmoji}>🦉</Text>
        </View>
      </View>
      {!gameOver && (
        <View style={pacStyles.controls}>
          <View style={pacStyles.controlRow}>
            <View style={pacStyles.emptyButton} />
            <TouchableOpacity style={pacStyles.controlBtn} onPress={() => movePacman(-1, 0)}>
              <Text style={pacStyles.controlText}>▲</Text>
            </TouchableOpacity>
            <View style={pacStyles.emptyButton} />
          </View>
          <View style={pacStyles.controlRow}>
            <TouchableOpacity style={pacStyles.controlBtn} onPress={() => movePacman(0, -1)}>
              <Text style={pacStyles.controlText}>◀</Text>
            </TouchableOpacity>
            <View style={pacStyles.emptyButton} />
            <TouchableOpacity style={pacStyles.controlBtn} onPress={() => movePacman(0, 1)}>
              <Text style={pacStyles.controlText}>▶</Text>
            </TouchableOpacity>
          </View>
          <View style={pacStyles.controlRow}>
            <View style={pacStyles.emptyButton} />
            <TouchableOpacity style={pacStyles.controlBtn} onPress={() => movePacman(1, 0)}>
              <Text style={pacStyles.controlText}>▼</Text>
            </TouchableOpacity>
            <View style={pacStyles.emptyButton} />
          </View>
        </View>
      )}
    </View>
  );
}

const CLOUD_POSITIONS = [
  { x: 20, y: 25, size: 44, opacity: 0.6 },
  { x: 120, y: 55, size: 34, opacity: 0.45 },
  { x: 220, y: 18, size: 38, opacity: 0.55 },
  { x: 80, y: 85, size: 30, opacity: 0.35 },
  { x: 170, y: 40, size: 26, opacity: 0.3 },
];

const FOREST_TREES_BG = [
  { x: 15, height: 120, width: 28, shade: '#1a4d1a' },
  { x: 60, height: 140, width: 32, shade: '#1e5c1e' },
  { x: 110, height: 100, width: 24, shade: '#174d17' },
  { x: 155, height: 130, width: 30, shade: '#1a5a1a' },
  { x: 200, height: 115, width: 26, shade: '#1b5218' },
  { x: 245, height: 145, width: 34, shade: '#1e5e1e' },
  { x: 290, height: 105, width: 25, shade: '#1a4e1a' },
];

const FOREST_TREES_MID = [
  { x: 35, height: 160, width: 36, shade: '#236b23' },
  { x: 95, height: 175, width: 40, shade: '#287028' },
  { x: 165, height: 150, width: 34, shade: '#216821' },
  { x: 230, height: 170, width: 38, shade: '#257025' },
  { x: 300, height: 155, width: 35, shade: '#236e23' },
];

const _FOREST_LEAVES = [
  { x: 40, y: 50, size: 12, rotation: '15deg', emoji: '\u{1F343}' },
  { x: 130, y: 80, size: 10, rotation: '-20deg', emoji: '\u{1F342}' },
  { x: 220, y: 35, size: 11, rotation: '45deg', emoji: '\u{1F343}' },
  { x: 80, y: 120, size: 9, rotation: '-10deg', emoji: '\u{1F342}' },
  { x: 190, y: 95, size: 13, rotation: '30deg', emoji: '\u{1F343}' },
  { x: 270, y: 60, size: 10, rotation: '-35deg', emoji: '\u{1F342}' },
];

const FOREST_FIREFLIES = [
  { x: 50, y: 70 },
  { x: 140, y: 110 },
  { x: 230, y: 55 },
  { x: 90, y: 160 },
  { x: 200, y: 140 },
  { x: 310, y: 90 },
  { x: 170, y: 200 },
  { x: 60, y: 250 },
  { x: 280, y: 170 },
  { x: 40, y: 190 },
];

const PIPE_CAP_HEIGHT = 20;
const PIPE_CAP_OVERHANG = 6;
const GROUND_HEIGHT = 40;

function JumpingFoxGame({ onFinish }: { onFinish: (won: boolean) => void; colors: any }) {
  const [birdY, setBirdY] = useState(GAME_HEIGHT / 2);
  const [velocity, setVelocity] = useState(0);
  const [pipes, setPipes] = useState<Array<{ x: number; gapY: number; scored: boolean }>>([
    { x: GAME_WIDTH, gapY: 150, scored: false },
    { x: GAME_WIDTH + 220, gapY: 200, scored: false },
    { x: GAME_WIDTH + 440, gapY: 120, scored: false },
  ]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const TARGET_SCORE = 5;
  const pendingGameOver = useRef<{ won: boolean } | null>(null);

  const birdRotation = useRef(new Animated.Value(0)).current;
  const birdBob = useRef(new Animated.Value(0)).current;
  const cloudAnim = useRef(new Animated.Value(0)).current;
  const scoreFlash = useRef(new Animated.Value(1)).current;
  const startPulse = useRef(new Animated.Value(1)).current;
  const gameLoop = useRef<ReturnType<typeof setInterval> | null>(null);

  const bgParallax = useRef(new Animated.Value(0)).current;
  const midParallax = useRef(new Animated.Value(0)).current;
  const fireflyGlow1 = useRef(new Animated.Value(0)).current;
  const fireflyGlow2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!started) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(birdBob, { toValue: -8, duration: 600, useNativeDriver: true }),
          Animated.timing(birdBob, { toValue: 8, duration: 600, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(startPulse, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(startPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [started, birdBob, startPulse]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(cloudAnim, { toValue: 1, duration: 20000, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.timing(bgParallax, { toValue: 1, duration: 30000, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.timing(midParallax, { toValue: 1, duration: 20000, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(fireflyGlow1, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(fireflyGlow1, { toValue: 0.1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(fireflyGlow2, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(fireflyGlow2, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [cloudAnim, bgParallax, midParallax, fireflyGlow1, fireflyGlow2]);

  const jump = useCallback(() => {
    if (gameOver) return;
    if (!started) {
      setStarted(true);
      birdBob.stopAnimation();
      startPulse.stopAnimation();
    }
    setVelocity(FLAPPY_JUMP);
    Animated.sequence([
      Animated.timing(birdRotation, { toValue: -30, duration: 70, useNativeDriver: true }),
      Animated.timing(birdRotation, { toValue: 0, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [gameOver, started, birdRotation, birdBob, startPulse]);

  const flashScore = useCallback(() => {
    scoreFlash.setValue(1.5);
    Animated.spring(scoreFlash, { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }).start();
  }, [scoreFlash]);

  useEffect(() => {
    if (!started || gameOver) return;
    gameLoop.current = setInterval(() => {
      setVelocity(v => v + FLAPPY_GRAVITY);
      setBirdY(y => {
        const newY = y + velocity;
        if (newY <= 0 || newY >= GAME_HEIGHT - BIRD_SIZE - GROUND_HEIGHT) {
          pendingGameOver.current = { won: false };
          return y;
        }
        return newY;
      });

      if (velocity > 1.5) {
        Animated.timing(birdRotation, { toValue: Math.min(velocity * 5, 55), duration: 80, useNativeDriver: true }).start();
      }

      setPipes(prevPipes => {
        const pipeSpeed = 2.6 + Math.min(score * 0.08, 0.8);
        const newPipes = prevPipes.map(p => ({ ...p, x: p.x - pipeSpeed }));
        newPipes.forEach((pipe, idx) => {
          if (pipe.x + PIPE_WIDTH < 0) {
            const minGapY = 65;
            const maxGapY = GAME_HEIGHT - PIPE_GAP - GROUND_HEIGHT - 65;
            newPipes[idx] = {
              x: GAME_WIDTH + 30,
              gapY: minGapY + Math.random() * (maxGapY - minGapY),
              scored: false,
            };
          }
        });
        return newPipes;
      });
    }, 28);

    return () => { if (gameLoop.current) clearInterval(gameLoop.current); };
  }, [started, gameOver, velocity, birdRotation, score]);

  useEffect(() => {
    if (gameOver) return;
    if (pendingGameOver.current) {
      setGameOver(true);
      onFinish(pendingGameOver.current.won);
      pendingGameOver.current = null;
      return;
    }
    const birdLeft = 50;
    const birdRight = birdLeft + BIRD_SIZE;
    const birdTop = birdY;
    const birdBottom = birdY + BIRD_SIZE;

    let shouldEndGame = false;
    let won = false;
    let newScore = score;

    for (const pipe of pipes) {
      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + PIPE_WIDTH;
      const hitboxShrink = 3;

      if (birdRight - hitboxShrink > pipeLeft + hitboxShrink && birdLeft + hitboxShrink < pipeRight - hitboxShrink) {
        if (birdTop + hitboxShrink < pipe.gapY || birdBottom - hitboxShrink > pipe.gapY + PIPE_GAP) {
          shouldEndGame = true;
          won = false;
          break;
        }
      }

      if (!pipe.scored && pipe.x + PIPE_WIDTH < birdLeft) {
        pipe.scored = true;
        flashScore();
        newScore = newScore + 1;
        if (newScore >= TARGET_SCORE) {
          shouldEndGame = true;
          won = true;
        }
      }
    }

    if (newScore !== score) {
      setScore(newScore);
    }

    if (shouldEndGame) {
      setGameOver(true);
      onFinish(won);
    }
  }, [birdY, pipes, gameOver, onFinish, flashScore, score]);

  const birdRotateInterp = birdRotation.interpolate({
    inputRange: [-30, 0, 55],
    outputRange: ['-30deg', '0deg', '55deg'],
  });

  const cloudTranslate = cloudAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -GAME_WIDTH],
  });

  const bgParallaxX = bgParallax.interpolate({ inputRange: [0, 1], outputRange: [0, -GAME_WIDTH * 0.3] });
  const midParallaxX = midParallax.interpolate({ inputRange: [0, 1], outputRange: [0, -GAME_WIDTH * 0.5] });

  return (
    <View style={flappyStyles.container}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={jump}
        style={[flappyStyles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}
        testID="flappy-game-area"
      >
        <LinearGradient
          colors={['#0a1f0a', '#0f2b0f', '#143814', '#1a4d1a', '#1e5c1e', '#2d7a2d']}
          locations={[0, 0.15, 0.3, 0.5, 0.7, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={flappyStyles.sunWrap}>
          <View style={flappyStyles.sunOuter}>
            <View style={flappyStyles.sunInner} />
          </View>
        </View>

        <Animated.View style={[flappyStyles.forestBgLayer, { transform: [{ translateX: bgParallaxX as any }] }]}>
          {FOREST_TREES_BG.map((tree, i) => (
            <View key={`bg-tree-${i}`} style={[
              flappyStyles.bgTree,
              {
                left: tree.x,
                bottom: GROUND_HEIGHT - 5,
                height: tree.height,
                width: tree.width,
              },
            ]}>
              <View style={[
                flappyStyles.bgTreeCanopy,
                { backgroundColor: tree.shade, width: tree.width * 2.2, height: tree.height * 0.6, borderRadius: tree.width * 1.1 },
              ]} />
              <View style={[
                flappyStyles.bgTreeTrunk,
                { width: tree.width * 0.3, height: tree.height * 0.5, backgroundColor: '#3d2b1f' },
              ]} />
            </View>
          ))}
        </Animated.View>

        <Animated.View style={[flappyStyles.forestMidLayer, { transform: [{ translateX: midParallaxX as any }] }]}>
          {FOREST_TREES_MID.map((tree, i) => (
            <View key={`mid-tree-${i}`} style={[
              flappyStyles.midTree,
              {
                left: tree.x,
                bottom: GROUND_HEIGHT - 3,
                height: tree.height,
                width: tree.width,
              },
            ]}>
              <View style={[
                flappyStyles.midTreeCanopy,
                { backgroundColor: tree.shade, width: tree.width * 2, height: tree.height * 0.55, borderRadius: tree.width },
              ]} />
              <View style={[
                flappyStyles.midTreeTrunk,
                { width: tree.width * 0.28, height: tree.height * 0.55, backgroundColor: '#4a3728' },
              ]} />
            </View>
          ))}
        </Animated.View>

        <View style={flappyStyles.mistLayer} />

        <Animated.View style={[flappyStyles.cloudLayer, { transform: [{ translateX: cloudTranslate }] }]}>
          {CLOUD_POSITIONS.map((cloud, i) => (
            <View key={i} style={[
              flappyStyles.cloud,
              { left: cloud.x, top: cloud.y, width: cloud.size, height: cloud.size * 0.55, opacity: cloud.opacity * 0.4 },
            ]} />
          ))}
          {CLOUD_POSITIONS.map((cloud, i) => (
            <View key={`dup-${i}`} style={[
              flappyStyles.cloud,
              { left: cloud.x + GAME_WIDTH, top: cloud.y, width: cloud.size, height: cloud.size * 0.55, opacity: cloud.opacity * 0.4 },
            ]} />
          ))}
        </Animated.View>

        {FOREST_FIREFLIES.slice(0, 4).map((ff, i) => (
          <Animated.View
            key={`ff-${i}`}
            style={[
              flappyStyles.firefly,
              {
                left: ff.x,
                top: ff.y,
                opacity: i % 2 === 0 ? fireflyGlow1 : fireflyGlow2,
              },
            ]}
          >
            <View style={flappyStyles.fireflyCore} />
          </Animated.View>
        ))}

        <View style={flappyStyles.scoreOverlay}>
          <View style={flappyStyles.scoreBadge}>
            <Text style={flappyStyles.scoreEmoji}>🌲</Text>
            <Animated.Text style={[flappyStyles.scoreOverlayText, { transform: [{ scale: scoreFlash }] }]}>
              {score}
            </Animated.Text>
            <Text style={flappyStyles.scoreTarget}>/{TARGET_SCORE}</Text>
          </View>
        </View>

        {pipes.map((pipe, i) => (
          <View key={i}>
            <LinearGradient
              colors={['#3d2b1f', '#5a3f2b', '#4a3728']}
              style={[
                flappyStyles.pipeBody,
                {
                  left: pipe.x,
                  top: 0,
                  height: Math.max(pipe.gapY - PIPE_CAP_HEIGHT, 0),
                  width: PIPE_WIDTH,
                },
              ]}
            />
            <View style={[
              flappyStyles.pipeCap,
              {
                left: pipe.x - PIPE_CAP_OVERHANG,
                top: pipe.gapY - PIPE_CAP_HEIGHT,
                width: PIPE_WIDTH + PIPE_CAP_OVERHANG * 2,
                height: PIPE_CAP_HEIGHT,
              },
            ]} />
            <View style={[
              flappyStyles.pipeCap,
              {
                left: pipe.x - PIPE_CAP_OVERHANG,
                top: pipe.gapY + PIPE_GAP,
                width: PIPE_WIDTH + PIPE_CAP_OVERHANG * 2,
                height: PIPE_CAP_HEIGHT,
              },
            ]} />
            <LinearGradient
              colors={['#4a3728', '#5a3f2b', '#3d2b1f']}
              style={[
                flappyStyles.pipeBody,
                {
                  left: pipe.x,
                  top: pipe.gapY + PIPE_GAP + PIPE_CAP_HEIGHT,
                  height: Math.max(GAME_HEIGHT - pipe.gapY - PIPE_GAP - PIPE_CAP_HEIGHT - GROUND_HEIGHT, 0),
                  width: PIPE_WIDTH,
                },
              ]}
            />
          </View>
        ))}

        <Animated.View
          style={[
            flappyStyles.bird,
            {
              top: started ? birdY : GAME_HEIGHT / 2 - BIRD_SIZE / 2,
              left: 50,
              transform: [
                { rotate: started ? birdRotateInterp as any : '0deg' },
                { translateY: started ? 0 : (birdBob as any) },
              ],
            },
          ]}
        >
          <View style={flappyStyles.foxBody}>
            <View style={flappyStyles.foxEarLeft} />
            <View style={flappyStyles.foxEarRight} />
            <View style={flappyStyles.foxTail} />
            <View style={flappyStyles.foxEye}>
              <View style={flappyStyles.foxPupil} />
            </View>
            <View style={flappyStyles.foxNose} />
          </View>
        </Animated.View>

        <View style={[flappyStyles.groundLayer, { width: GAME_WIDTH * 2 }]}>
          <View style={[flappyStyles.grassBlade, { width: GAME_WIDTH * 2 }]} />
          <View style={[flappyStyles.grassStripe, { width: GAME_WIDTH * 2 }]} />
          <View style={[flappyStyles.dirtLayer, { width: GAME_WIDTH * 2 }]} />
        </View>

        {!started && !gameOver && (
          <View style={flappyStyles.tapPrompt}>
            <View style={flappyStyles.startCard}>
              <Animated.View style={{ transform: [{ scale: startPulse }] }}>
                <View style={flappyStyles.startIconCircle}>
                  <Text style={{ fontSize: 28 }}>🦊</Text>
                </View>
              </Animated.View>
              <Text style={flappyStyles.startTitle}>Jumping Fox</Text>
              <Text style={flappyStyles.startSubtitle}>Jump through {TARGET_SCORE} forest trees to win!</Text>
              <View style={flappyStyles.tapIndicator}>
                <Text style={flappyStyles.tapText}>Tap anywhere to jump</Text>
              </View>
            </View>
          </View>
        )}

        {gameOver && (
          <View style={flappyStyles.gameOverOverlay}>
            <View style={flappyStyles.gameOverCard}>
              <Text style={flappyStyles.gameOverEmoji}>{score >= TARGET_SCORE ? '🏆' : '💥'}</Text>
              <Text style={flappyStyles.gameOverTitle}>
                {score >= TARGET_SCORE ? 'Amazing!' : 'Crashed!'}
              </Text>
              <View style={flappyStyles.gameOverScoreWrap}>
                <Text style={flappyStyles.gameOverScoreLabel}>Score</Text>
                <Text style={[
                  flappyStyles.gameOverScoreValue,
                  { color: score >= TARGET_SCORE ? '#10b981' : '#ef4444' },
                ]}>{score}/{TARGET_SCORE}</Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

function GKQuiz({ onFinish, colors: themeColors }: { onFinish: (score: number, total: number) => void; colors: any }) {
  const [questions] = useState<GKQuestion[]>(() => getRandomGKQuestions(5));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  const handleAnswer = useCallback((optionIdx: number) => {
    if (answered) return;
    setSelectedAnswer(optionIdx);
    setAnswered(true);
    if (optionIdx === questions[currentIdx].correctAnswer) {
      setQuizScore(s => s + 1);
    }
  }, [answered, currentIdx, questions]);

  const handleNext = useCallback(() => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      setFinished(true);
      const finalScore = selectedAnswer === questions[currentIdx].correctAnswer
        ? quizScore
        : quizScore;
      onFinish(finalScore, questions.length);
    }
  }, [currentIdx, questions, onFinish, quizScore, selectedAnswer]);

  if (finished) {
    return (
      <View style={gkStyles.resultContainer}>
        <LinearGradient
          colors={quizScore >= 3 ? ['#10b981', '#059669'] : ['#ef4444', '#dc2626']}
          style={gkStyles.resultGradient}
        >
          {quizScore >= 3 ? <Trophy size={48} color="#fff" /> : <X size={48} color="#fff" />}
          <Text style={gkStyles.resultScore}>{quizScore}/{questions.length}</Text>
          <Text style={gkStyles.resultText}>
            {quizScore >= 3 ? 'Great job! +1 XP reimbursed!' : 'Keep trying! Need 3+ to earn XP back.'}
          </Text>
        </LinearGradient>
      </View>
    );
  }

  const q = questions[currentIdx];

  return (
    <View style={gkStyles.container}>
      <View style={gkStyles.progressRow}>
        <Text style={[gkStyles.questionCount, { color: themeColors.textSecondary }]}>
          Question {currentIdx + 1} of {questions.length}
        </Text>
        <View style={[gkStyles.progressBar, { backgroundColor: themeColors.border }]}>
          <View style={[gkStyles.progressFill, { width: `${((currentIdx + 1) / questions.length) * 100}%` }]} />
        </View>
      </View>

      <View style={[gkStyles.questionCard, { backgroundColor: themeColors.cardBg }]}>
        <Brain size={24} color="#8b5cf6" />
        <Text style={[gkStyles.questionText, { color: themeColors.text }]}>{q.question}</Text>
      </View>

      <View style={gkStyles.optionsList}>
        {q.options.map((opt, idx) => {
          let optStyle = [gkStyles.optionBtn, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }] as any[];
          let textColor = themeColors.text;
          if (answered) {
            if (idx === q.correctAnswer) {
              optStyle = [...optStyle, gkStyles.optionCorrect];
              textColor = '#fff';
            } else if (idx === selectedAnswer && idx !== q.correctAnswer) {
              optStyle = [...optStyle, gkStyles.optionWrong];
              textColor = '#fff';
            }
          } else if (idx === selectedAnswer) {
            optStyle = [...optStyle, gkStyles.optionSelected];
          }

          return (
            <TouchableOpacity
              key={idx}
              style={optStyle}
              onPress={() => handleAnswer(idx)}
              disabled={answered}
              activeOpacity={0.7}
            >
              <View style={[gkStyles.optionLetter, answered && idx === q.correctAnswer ? { backgroundColor: 'rgba(255,255,255,0.3)' } : { backgroundColor: themeColors.surfaceElevated }]}>
                <Text style={[gkStyles.optionLetterText, answered && idx === q.correctAnswer ? { color: '#fff' } : { color: themeColors.textSecondary }]}>
                  {String.fromCharCode(65 + idx)}
                </Text>
              </View>
              <Text style={[gkStyles.optionText, { color: textColor }]}>{opt}</Text>
              {answered && idx === q.correctAnswer && <Check size={20} color="#fff" />}
              {answered && idx === selectedAnswer && idx !== q.correctAnswer && <X size={20} color="#fff" />}
            </TouchableOpacity>
          );
        })}
      </View>

      {answered && (
        <TouchableOpacity style={gkStyles.nextBtn} onPress={handleNext}>
          <Text style={gkStyles.nextBtnText}>
            {currentIdx < questions.length - 1 ? 'Next Question' : 'See Results'}
          </Text>
          <ChevronRight size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

type CellValue = 'X' | 'O' | null;
const WISDOM_QUOTES = [
  "Hmm, interesting move... but can you outthink me?",
  "A wise choice, but wisdom comes from experience!",
  "The student challenges the master... let's see!",
  "Every move teaches something. What will you learn?",
  "Patience is the companion of wisdom, young one.",
  "Knowledge speaks, but wisdom listens... to the board!",
  "You play well, but the Professor has seen many games.",
  "Think carefully... the wise move is not always obvious.",
];

function getWisdomQuote(): string {
  return WISDOM_QUOTES[Math.floor(Math.random() * WISDOM_QUOTES.length)];
}

function checkWinner(board: CellValue[]): CellValue {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function isBoardFull(board: CellValue[]): boolean {
  return board.every(cell => cell !== null);
}

function minimax(board: CellValue[], isMaximizing: boolean, depth: number): number {
  const winner = checkWinner(board);
  if (winner === 'O') return 10 - depth;
  if (winner === 'X') return depth - 10;
  if (isBoardFull(board)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'O';
        best = Math.max(best, minimax(board, false, depth + 1));
        board[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'X';
        best = Math.min(best, minimax(board, true, depth + 1));
        board[i] = null;
      }
    }
    return best;
  }
}

function getBestMove(board: CellValue[]): number {
  if (Math.random() < 0.15) {
    const empty = board.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
    if (empty.length > 0) return empty[Math.floor(Math.random() * empty.length)];
  }
  let bestScore = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = 'O';
      const score = minimax(board, false, 0);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

function TicTacToeGame({ onFinish, colors: themeColors }: { onFinish: (won: boolean) => void; colors: any }) {
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState<'win' | 'lose' | 'draw' | null>(null);
  const [professorQuote, setProfessorQuote] = useState("I am the Wisdom Professor. Let's play!");
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const scaleAnims = useRef(Array(9).fill(null).map(() => new Animated.Value(0))).current;
  const professorPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(professorPulse, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(professorPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, [professorPulse]);

  const animateCell = useCallback((index: number) => {
    scaleAnims[index].setValue(0);
    Animated.spring(scaleAnims[index], { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }).start();
  }, [scaleAnims]);

  const findWinLine = useCallback((b: CellValue[]): number[] | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const line of lines) {
      const [a, b2, c] = line;
      if (b[a] && b[a] === b[b2] && b[a] === b[c]) return line;
    }
    return null;
  }, []);

  const handleCellPress = useCallback((index: number) => {
    if (board[index] || !isPlayerTurn || gameOver) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    animateCell(index);

    const winner = checkWinner(newBoard);
    if (winner === 'X') {
      setGameOver(true);
      setResult('win');
      setWinLine(findWinLine(newBoard));
      setProfessorQuote("Impressive! You bested the Professor this time!");
      onFinish(true);
      return;
    }
    if (isBoardFull(newBoard)) {
      setGameOver(true);
      setResult('draw');
      setProfessorQuote("A draw! You matched the Professor's wisdom!");
      onFinish(false);
      return;
    }

    setIsPlayerTurn(false);
    setProfessorQuote(getWisdomQuote());

    setTimeout(() => {
      const aiMove = getBestMove([...newBoard]);
      if (aiMove >= 0) {
        newBoard[aiMove] = 'O';
        setBoard([...newBoard]);
        animateCell(aiMove);

        const aiWinner = checkWinner(newBoard);
        if (aiWinner === 'O') {
          setGameOver(true);
          setResult('lose');
          setWinLine(findWinLine(newBoard));
          setProfessorQuote("The Professor wins! Wisdom prevails!");
          onFinish(false);
          return;
        }
        if (isBoardFull(newBoard)) {
          setGameOver(true);
          setResult('draw');
          setProfessorQuote("A draw! You matched the Professor's wisdom!");
          onFinish(false);
          return;
        }
        setProfessorQuote("Your turn, young scholar...");
      }
      setIsPlayerTurn(true);
    }, 600);
  }, [board, isPlayerTurn, gameOver, onFinish, animateCell, findWinLine]);

  const cellSize = Math.floor((SCREEN_WIDTH - 80) / 3);

  return (
    <View style={tttStyles.container}>
      <Animated.View style={[tttStyles.professorCard, { transform: [{ scale: professorPulse }] }]}>
        <LinearGradient
          colors={['#1e3a5f', '#0f2744']}
          style={tttStyles.professorGradient}
        >
          <View style={tttStyles.professorAvatarWrap}>
            <Text style={tttStyles.professorEmoji}>🧙‍♂️</Text>
          </View>
          <View style={tttStyles.professorTextWrap}>
            <Text style={tttStyles.professorName}>Wisdom Professor</Text>
            <Text style={tttStyles.professorSpeech}>{professorQuote}</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <View style={tttStyles.statusRow}>
        <View style={[tttStyles.turnIndicator, { backgroundColor: isPlayerTurn ? '#10b981' : '#ef4444' }]}>
          <Text style={tttStyles.turnText}>
            {gameOver
              ? result === 'win' ? '🎉 You Win!' : result === 'draw' ? '🤝 Draw!' : '😔 Professor Wins!'
              : isPlayerTurn ? '🎯 Your Turn (X)' : '🧠 Professor Thinking...'}
          </Text>
        </View>
      </View>

      <View style={[tttStyles.board, { width: cellSize * 3 + 12, height: cellSize * 3 + 12 }]}>
        {board.map((cell, index) => {
          const row = Math.floor(index / 3);
          const col = index % 3;
          const isWinCell = winLine?.includes(index);
          return (
            <TouchableOpacity
              key={index}
              style={[
                tttStyles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  borderRightWidth: col < 2 ? 3 : 0,
                  borderBottomWidth: row < 2 ? 3 : 0,
                  borderColor: '#334155',
                  backgroundColor: isWinCell ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                },
              ]}
              onPress={() => handleCellPress(index)}
              activeOpacity={0.7}
              disabled={gameOver || !isPlayerTurn || !!cell}
            >
              {cell && (
                <Animated.View style={{ transform: [{ scale: scaleAnims[index] }] }}>
                  <Text style={[
                    tttStyles.cellText,
                    { color: cell === 'X' ? '#3b82f6' : '#ef4444' },
                    isWinCell && { textShadowColor: cell === 'X' ? '#3b82f6' : '#ef4444', textShadowRadius: 10 },
                  ]}>
                    {cell}
                  </Text>
                </Animated.View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={tttStyles.legendRow}>
        <View style={tttStyles.legendItem}>
          <Text style={[tttStyles.legendSymbol, { color: '#3b82f6' }]}>X</Text>
          <Text style={[tttStyles.legendLabel, { color: themeColors.textSecondary }]}>You</Text>
        </View>
        <Text style={[tttStyles.legendVs, { color: themeColors.textTertiary }]}>vs</Text>
        <View style={tttStyles.legendItem}>
          <Text style={[tttStyles.legendSymbol, { color: '#ef4444' }]}>O</Text>
          <Text style={[tttStyles.legendLabel, { color: themeColors.textSecondary }]}>Professor</Text>
        </View>
      </View>
    </View>
  );
}

const RUNNER_WIDTH = SCREEN_WIDTH - 32;
const RUNNER_HEIGHT = 520;
const LANE_COUNT = 3;
const LANE_WIDTH = Math.floor(RUNNER_WIDTH / LANE_COUNT);
const PLAYER_SIZE = 40;
const OBSTACLE_HEIGHT = 50;
const COIN_SIZE = 22;
const ROAD_LINE_HEIGHT = 30;

interface RunnerObstacle {
  id: number;
  lane: number;
  y: number;
  type: 'bus' | 'train' | 'barrier' | 'cone' | 'rock';
}

interface RunnerCoin {
  id: number;
  lane: number;
  y: number;
  collected: boolean;
}

const OBSTACLE_EMOJIS: Record<string, string> = {
  bus: '\u{1F68C}',
  train: '\u{1F682}',
  barrier: '\u{1F6A7}',
  cone: '\u{26D4}',
  rock: '\u{1FAA8}',
};

function ClassroomRunnerGame({ onFinish, onRevive }: { onFinish: (coins: number) => void; onRevive: () => void }) {
  const [playerLane, setPlayerLane] = useState(1);
  const [obstacles, setObstacles] = useState<RunnerObstacle[]>([]);
  const [coins, setCoins] = useState<RunnerCoin[]>([]);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [canRevive, setCanRevive] = useState(true);
  const [teacherY] = useState(RUNNER_HEIGHT + 60);

  const playerX = useRef(new Animated.Value(LANE_WIDTH * 1 + LANE_WIDTH / 2 - PLAYER_SIZE / 2)).current;
  const playerBounce = useRef(new Animated.Value(0)).current;
  const roadOffset = useRef(new Animated.Value(0)).current;
  const teacherBounce = useRef(new Animated.Value(0)).current;
  const startPulse = useRef(new Animated.Value(1)).current;
  const coinPulse = useRef(new Animated.Value(1)).current;
  const bgScroll = useRef(new Animated.Value(0)).current;

  const gameLoop = useRef<ReturnType<typeof setInterval> | null>(null);
  const obstacleIdRef = useRef(0);
  const coinIdRef = useRef(0);
  const speedRef = useRef(3.5);
  const frameRef = useRef(0);
  const playerLaneRef = useRef(1);
  const gameOverRef = useRef(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(playerBounce, { toValue: -4, duration: 300, useNativeDriver: true }),
        Animated.timing(playerBounce, { toValue: 4, duration: 300, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(teacherBounce, { toValue: -3, duration: 400, useNativeDriver: true }),
        Animated.timing(teacherBounce, { toValue: 3, duration: 400, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(coinPulse, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(coinPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.timing(roadOffset, { toValue: ROAD_LINE_HEIGHT * 2, duration: 400, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.timing(bgScroll, { toValue: 1, duration: 8000, useNativeDriver: true })
    ).start();
  }, [playerBounce, teacherBounce, coinPulse, roadOffset, bgScroll]);

  useEffect(() => {
    if (!started) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(startPulse, { toValue: 1.1, duration: 700, useNativeDriver: true }),
          Animated.timing(startPulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [started, startPulse]);

  const moveTo = useCallback((lane: number) => {
    if (gameOverRef.current) return;
    const clamped = Math.max(0, Math.min(2, lane));
    playerLaneRef.current = clamped;
    setPlayerLane(clamped);
    Animated.spring(playerX, {
      toValue: LANE_WIDTH * clamped + LANE_WIDTH / 2 - PLAYER_SIZE / 2,
      friction: 7,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }, [playerX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10 || Math.abs(gs.dy) > 10,
      onPanResponderRelease: (_, gs) => {
        if (!started && !gameOverRef.current) {
          setStarted(true);
          startPulse.stopAnimation();
          return;
        }
        if (Math.abs(gs.dx) > Math.abs(gs.dy)) {
          if (gs.dx > 20) {
            moveTo(playerLaneRef.current + 1);
          } else if (gs.dx < -20) {
            moveTo(playerLaneRef.current - 1);
          }
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!started || gameOver) return;

    gameLoop.current = setInterval(() => {
      if (gameOverRef.current) return;
      frameRef.current += 1;
      const frame = frameRef.current;

      speedRef.current = Math.min(3.5 + frame * 0.003, 8);
      const speed = speedRef.current;

      setDistance(d => d + 1);

      if (frame % 35 === 0) {
        const types: Array<'bus' | 'train' | 'barrier' | 'cone' | 'rock'> = ['bus', 'train', 'barrier', 'cone', 'rock'];
        const lane = Math.floor(Math.random() * 3);
        const type = types[Math.floor(Math.random() * types.length)];
        obstacleIdRef.current += 1;
        setObstacles(prev => [...prev, { id: obstacleIdRef.current, lane, y: -OBSTACLE_HEIGHT, type }]);
      }

      if (frame % 20 === 0) {
        const lane = Math.floor(Math.random() * 3);
        coinIdRef.current += 1;
        setCoins(prev => [...prev, { id: coinIdRef.current, lane, y: -COIN_SIZE, collected: false }]);
      }

      setObstacles(prev => {
        const updated = prev.map(o => ({ ...o, y: o.y + speed })).filter(o => o.y < RUNNER_HEIGHT + 60);
        for (const obs of updated) {
          const obsLeft = obs.lane * LANE_WIDTH + 10;
          const obsRight = obsLeft + LANE_WIDTH - 20;
          const obsTop = obs.y;
          const obsBottom = obs.y + OBSTACLE_HEIGHT;

          const pLane = playerLaneRef.current;
          const pLeft = pLane * LANE_WIDTH + LANE_WIDTH / 2 - PLAYER_SIZE / 2;
          const pRight = pLeft + PLAYER_SIZE;
          const pTop = RUNNER_HEIGHT - 120;
          const pBottom = pTop + PLAYER_SIZE;

          if (pRight > obsLeft + 5 && pLeft < obsRight - 5 && pBottom > obsTop + 5 && pTop < obsBottom - 5) {
            gameOverRef.current = true;
            setGameOver(true);
            if (gameLoop.current) clearInterval(gameLoop.current);
            return updated;
          }
        }
        return updated;
      });

      setCoins(prev => {
        return prev.map(c => {
          const newY = c.y + speed;
          if (c.collected || newY > RUNNER_HEIGHT + 30) return { ...c, y: newY };
          const cLane = c.lane;
          const pLane = playerLaneRef.current;
          const cCenterY = newY + COIN_SIZE / 2;
          const pTop = RUNNER_HEIGHT - 120;
          const pBottom = pTop + PLAYER_SIZE;
          if (cLane === pLane && cCenterY > pTop - 5 && cCenterY < pBottom + 5) {
            setScore(s => s + 1);
            return { ...c, y: newY, collected: true };
          }
          return { ...c, y: newY };
        }).filter(c => c.y < RUNNER_HEIGHT + 30 || !c.collected);
      });
    }, 25);

    return () => { if (gameLoop.current) clearInterval(gameLoop.current); };
  }, [started, gameOver]);

  const handleRevive = useCallback(() => {
    setCanRevive(false);
    onRevive();
  }, [onRevive]);

  const restartAfterRevive = useCallback(() => {
    gameOverRef.current = false;
    setGameOver(false);
    setObstacles([]);
    setStarted(true);
    frameRef.current = 0;
    speedRef.current = 3.5;
  }, []);

  const playerTop = RUNNER_HEIGHT - 120;

  const bgScrollY = bgScroll.interpolate({ inputRange: [0, 1], outputRange: [0, -200] });

  return (
    <View style={runnerStyles.container}>
      <View style={runnerStyles.scoreBar}>
        <View style={runnerStyles.scorePill}>
          <Text style={runnerStyles.coinEmoji}>🪙</Text>
          <Text style={runnerStyles.scoreNum}>{score}</Text>
        </View>
        <View style={runnerStyles.distPill}>
          <Text style={runnerStyles.distText}>{distance}m</Text>
        </View>
      </View>

      <View
        style={[runnerStyles.gameArea, { width: RUNNER_WIDTH, height: RUNNER_HEIGHT }]}
        {...panResponder.panHandlers}
      >
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={StyleSheet.absoluteFillObject}
        />

        <Animated.View style={[runnerStyles.bgPattern, { transform: [{ translateY: bgScrollY }] }]}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={`bg-${i}`} style={[runnerStyles.bgStar, { left: (i * 47) % RUNNER_WIDTH, top: i * 35 }]} />
          ))}
        </Animated.View>

        <View style={runnerStyles.road}>
          <LinearGradient
            colors={['#2d2d44', '#3a3a5c', '#2d2d44']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[runnerStyles.roadEdge, { left: 0 }]} />
          <View style={[runnerStyles.roadEdge, { right: 0 }]} />

          {[1, 2].map(i => (
            <View key={`lane-${i}`} style={[runnerStyles.laneDivider, { left: LANE_WIDTH * i - 1 }]}>
              <Animated.View style={{ transform: [{ translateY: roadOffset }] }}>
                {Array.from({ length: 20 }).map((_, j) => (
                  <View key={j} style={runnerStyles.dashLine} />
                ))}
              </Animated.View>
            </View>
          ))}
        </View>

        {obstacles.map(obs => (
          <View
            key={obs.id}
            style={[
              runnerStyles.obstacle,
              {
                left: obs.lane * LANE_WIDTH + 10,
                top: obs.y,
                width: LANE_WIDTH - 20,
                height: OBSTACLE_HEIGHT,
              },
            ]}
          >
            <LinearGradient
              colors={
                obs.type === 'bus' ? ['#dc2626', '#b91c1c'] :
                obs.type === 'train' ? ['#2563eb', '#1d4ed8'] :
                obs.type === 'barrier' ? ['#f59e0b', '#d97706'] :
                obs.type === 'cone' ? ['#ea580c', '#c2410c'] :
                ['#6b7280', '#4b5563']
              }
              style={runnerStyles.obstacleGradient}
            >
              <Text style={runnerStyles.obstacleEmoji}>{OBSTACLE_EMOJIS[obs.type]}</Text>
              <Text style={runnerStyles.obstacleLabel}>
                {obs.type === 'bus' ? 'BUS' : obs.type === 'train' ? 'TRAIN' : obs.type === 'barrier' ? 'STOP' : obs.type === 'cone' ? 'CONE' : 'ROCK'}
              </Text>
            </LinearGradient>
          </View>
        ))}

        {coins.filter(c => !c.collected).map(c => (
          <Animated.View
            key={c.id}
            style={[
              runnerStyles.coin,
              {
                left: c.lane * LANE_WIDTH + LANE_WIDTH / 2 - COIN_SIZE / 2,
                top: c.y,
                transform: [{ scale: coinPulse }],
              },
            ]}
          >
            <Text style={runnerStyles.coinText}>🪙</Text>
          </Animated.View>
        ))}

        <Animated.View
          style={[
            runnerStyles.player,
            {
              top: playerTop,
              transform: [{ translateX: playerX }, { translateY: playerBounce }],
            },
          ]}
        >
          <View style={runnerStyles.studentBody}>
            <View style={runnerStyles.studentHead}>
              <View style={runnerStyles.studentHair} />
              <View style={runnerStyles.studentFace}>
                <View style={runnerStyles.studentEyeL} />
                <View style={runnerStyles.studentEyeR} />
                <View style={runnerStyles.studentMouth} />
              </View>
            </View>
            <View style={runnerStyles.studentTorso}>
              <View style={runnerStyles.studentTie} />
            </View>
            <View style={runnerStyles.studentLegs}>
              <View style={runnerStyles.studentLegL} />
              <View style={runnerStyles.studentLegR} />
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            runnerStyles.teacher,
            {
              left: LANE_WIDTH * 1 + LANE_WIDTH / 2 - 22,
              top: teacherY - 80,
              transform: [{ translateY: teacherBounce }],
            },
          ]}
        >
          <Text style={runnerStyles.teacherEmoji}>{"\u{1F468}\u{200D}\u{1F3EB}"}</Text>
          <View style={runnerStyles.teacherSpeech}>
            <Text style={runnerStyles.teacherSpeechText}>Hey! Stop!</Text>
          </View>
        </Animated.View>

        {!started && !gameOver && (
          <View style={runnerStyles.startOverlay}>
            <View style={runnerStyles.startCard}>
              <Animated.View style={{ transform: [{ scale: startPulse }] }}>
                <View style={runnerStyles.startIconWrap}>
                  <Text style={{ fontSize: 36 }}>{"\u{1F3C3}"}</Text>
                </View>
              </Animated.View>
              <Text style={runnerStyles.startTitle}>Classroom Runner</Text>
              <Text style={runnerStyles.startDesc}>
                The student disturbed the teacher!{"\n"}Run! Dodge obstacles! Collect coins!
              </Text>
              <View style={runnerStyles.startHints}>
                <View style={runnerStyles.hintPill}>
                  <Text style={runnerStyles.hintText}>{"\u{1F448} Swipe Left"}</Text>
                </View>
                <View style={runnerStyles.hintPill}>
                  <Text style={runnerStyles.hintText}>{"Swipe Right \u{1F449}"}</Text>
                </View>
              </View>
              <View style={runnerStyles.tapStart}>
                <Text style={runnerStyles.tapStartText}>Swipe to Start</Text>
              </View>
            </View>
          </View>
        )}

        {gameOver && (
          <View style={runnerStyles.gameOverOverlay}>
            <View style={runnerStyles.gameOverCard}>
              <Text style={runnerStyles.gameOverEmoji}>{"\u{1F4A5}"}</Text>
              <Text style={runnerStyles.gameOverTitle}>Caught!</Text>
              <Text style={runnerStyles.gameOverDesc}>
                The teacher caught up! You collected {score} coins.
              </Text>
              <View style={runnerStyles.gameOverStats}>
                <View style={runnerStyles.goStatItem}>
                  <Text style={runnerStyles.goStatVal}>{score}</Text>
                  <Text style={runnerStyles.goStatLabel}>Coins</Text>
                </View>
                <View style={runnerStyles.goStatDivider} />
                <View style={runnerStyles.goStatItem}>
                  <Text style={runnerStyles.goStatVal}>{distance}m</Text>
                  <Text style={runnerStyles.goStatLabel}>Distance</Text>
                </View>
              </View>
              {canRevive ? (
                <TouchableOpacity style={runnerStyles.reviveBtn} onPress={handleRevive}>
                  <Text style={runnerStyles.reviveBtnText}>{"\u{1F4DA} Answer 5 GK Questions to Revive!"}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={runnerStyles.finishBtn}
                  onPress={() => onFinish(score)}
                >
                  <Text style={runnerStyles.finishBtnText}>Finish ({score} XP earned)</Text>
                </TouchableOpacity>
              )}
              {canRevive && (
                <TouchableOpacity
                  style={runnerStyles.skipBtn}
                  onPress={() => onFinish(score)}
                >
                  <Text style={runnerStyles.skipBtnText}>Skip & Finish</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {started && !gameOver && (
        <View style={runnerStyles.controlsRow}>
          <TouchableOpacity
            style={runnerStyles.controlBtn}
            onPress={() => moveTo(playerLaneRef.current - 1)}
            activeOpacity={0.6}
            testID="runner-move-left"
          >
            <LinearGradient colors={['#0f3460', '#1a4d8e']} style={runnerStyles.controlBtnGradient}>
              <Text style={runnerStyles.controlBtnArrow}>◀</Text>
            </LinearGradient>
          </TouchableOpacity>
          <View style={runnerStyles.controlCenter}>
            <Text style={runnerStyles.controlLaneText}>Lane {playerLane + 1}</Text>
          </View>
          <TouchableOpacity
            style={runnerStyles.controlBtn}
            onPress={() => moveTo(playerLaneRef.current + 1)}
            activeOpacity={0.6}
            testID="runner-move-right"
          >
            <LinearGradient colors={['#0f3460', '#1a4d8e']} style={runnerStyles.controlBtnGradient}>
              <Text style={runnerStyles.controlBtnArrow}>▶</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function RunnerReviveQuiz({ onResult }: { onResult: (passed: boolean) => void }) {
  const [questions] = useState<GKQuestion[]>(() => getRandomToughGKQuestions(5));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const { colors: themeColors } = useTheme();

  const handleAnswer = useCallback((optionIdx: number) => {
    if (answered) return;
    setSelectedAnswer(optionIdx);
    setAnswered(true);
    if (optionIdx === questions[currentIdx].correctAnswer) {
      setQuizScore(s => s + 1);
    }
  }, [answered, currentIdx, questions]);

  const handleNext = useCallback(() => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      setFinished(true);
      const finalScore = selectedAnswer === questions[currentIdx].correctAnswer
        ? quizScore : quizScore;
      onResult(finalScore >= 3);
    }
  }, [currentIdx, questions, onResult, quizScore, selectedAnswer]);

  if (finished) {
    return (
      <View style={gkStyles.resultContainer}>
        <LinearGradient
          colors={quizScore >= 3 ? ['#10b981', '#059669'] : ['#ef4444', '#dc2626']}
          style={gkStyles.resultGradient}
        >
          {quizScore >= 3 ? <Trophy size={48} color="#fff" /> : <X size={48} color="#fff" />}
          <Text style={gkStyles.resultScore}>{quizScore}/{questions.length}</Text>
          <Text style={gkStyles.resultText}>
            {quizScore >= 3 ? 'Revived! Continue running!' : 'Not enough correct answers. Game over!'}
          </Text>
        </LinearGradient>
      </View>
    );
  }

  const q = questions[currentIdx];

  return (
    <View style={gkStyles.container}>
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <LinearGradient colors={['#f59e0b', '#ef4444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '800' as const, fontSize: 14 }}>{"\u{1F4DA} REVIVE QUIZ - Answer 3/5 Correctly!"}</Text>
        </LinearGradient>
      </View>
      <View style={gkStyles.progressRow}>
        <Text style={[gkStyles.questionCount, { color: themeColors.textSecondary }]}>
          Question {currentIdx + 1} of {questions.length}
        </Text>
        <View style={[gkStyles.progressBar, { backgroundColor: themeColors.border }]}>
          <View style={[gkStyles.progressFill, { width: `${((currentIdx + 1) / questions.length) * 100}%` }]} />
        </View>
      </View>
      <View style={[gkStyles.questionCard, { backgroundColor: themeColors.cardBg }]}>
        <Brain size={24} color="#f59e0b" />
        <Text style={[gkStyles.questionText, { color: themeColors.text }]}>{q.question}</Text>
      </View>
      <View style={gkStyles.optionsList}>
        {q.options.map((opt, idx) => {
          let optStyle = [gkStyles.optionBtn, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }] as any[];
          let textColor = themeColors.text;
          if (answered) {
            if (idx === q.correctAnswer) {
              optStyle = [...optStyle, gkStyles.optionCorrect];
              textColor = '#fff';
            } else if (idx === selectedAnswer && idx !== q.correctAnswer) {
              optStyle = [...optStyle, gkStyles.optionWrong];
              textColor = '#fff';
            }
          }
          return (
            <TouchableOpacity key={idx} style={optStyle} onPress={() => handleAnswer(idx)} disabled={answered} activeOpacity={0.7}>
              <View style={[gkStyles.optionLetter, answered && idx === q.correctAnswer ? { backgroundColor: 'rgba(255,255,255,0.3)' } : { backgroundColor: themeColors.surfaceElevated }]}>
                <Text style={[gkStyles.optionLetterText, answered && idx === q.correctAnswer ? { color: '#fff' } : { color: themeColors.textSecondary }]}>
                  {String.fromCharCode(65 + idx)}
                </Text>
              </View>
              <Text style={[gkStyles.optionText, { color: textColor }]}>{opt}</Text>
              {answered && idx === q.correctAnswer && <Check size={20} color="#fff" />}
              {answered && idx === selectedAnswer && idx !== q.correctAnswer && <X size={20} color="#fff" />}
            </TouchableOpacity>
          );
        })}
      </View>
      {answered && (
        <TouchableOpacity style={gkStyles.nextBtn} onPress={handleNext}>
          <Text style={gkStyles.nextBtnText}>{currentIdx < questions.length - 1 ? 'Next Question' : 'See Results'}</Text>
          <ChevronRight size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function FunLearning() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recordGamePlay, recordGKQuiz, canPlayGame, userProgress, addXP } = useApp();
  const { colors } = useTheme();
  const [screen, setScreen] = useState<GameScreen>('home');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [runnerCoins, setRunnerCoins] = useState(0);
  const runnerGameRef = useRef<{ restart: () => void } | null>(null);
  const [showReviveQuiz, setShowReviveQuiz] = useState(false);

  const hasPendingLoss = userProgress.funLearning.pendingXPLoss;
  const pacmanPlayed = !canPlayGame('pacman');
  const flappyPlayed = !canPlayGame('flappy');
  const tictactoePlayed = !canPlayGame('tictactoe');
  const runnerPlayed = !canPlayGame('runner');

  const switchScreen = useCallback((to: GameScreen) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setScreen(to);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  const handlePacmanFinish = useCallback((won: boolean) => {
    recordGamePlay('pacman', won);
    if (!won) {
      setTimeout(() => {
        Alert.alert(
          'Game Over!',
          'You lost 1 XP. Take the GK Quiz (score 3+) to earn it back!',
          [
            { text: 'Take Quiz', onPress: () => switchScreen('gk-quiz') },
            { text: 'Later', style: 'cancel', onPress: () => switchScreen('home') },
          ]
        );
      }, 500);
    } else {
      setTimeout(() => {
        Alert.alert('Congratulations!', 'You collected all the berries! No XP lost.', [
          { text: 'OK', onPress: () => switchScreen('home') },
        ]);
      }, 500);
    }
  }, [recordGamePlay, switchScreen]);

  const handleTicTacToeFinish = useCallback((won: boolean) => {
    recordGamePlay('tictactoe', won);
    if (!won) {
      setTimeout(() => {
        Alert.alert(
          'The Professor Wins!',
          'You lost 1 XP. Take the GK Quiz (score 3+) to earn it back!',
          [
            { text: 'Take Quiz', onPress: () => switchScreen('gk-quiz') },
            { text: 'Later', style: 'cancel', onPress: () => switchScreen('home') },
          ]
        );
      }, 500);
    } else {
      setTimeout(() => {
        Alert.alert('Brilliant!', 'You defeated the Wisdom Professor! No XP lost.', [
          { text: 'OK', onPress: () => switchScreen('home') },
        ]);
      }, 500);
    }
  }, [recordGamePlay, switchScreen]);

  const handleFlappyFinish = useCallback((won: boolean) => {
    recordGamePlay('flappy', won);
    if (!won) {
      setTimeout(() => {
        Alert.alert(
          'Game Over!',
          'You lost 1 XP. Take the GK Quiz (score 3+) to earn it back!',
          [
            { text: 'Take Quiz', onPress: () => switchScreen('gk-quiz') },
            { text: 'Later', style: 'cancel', onPress: () => switchScreen('home') },
          ]
        );
      }, 500);
    } else {
      setTimeout(() => {
        Alert.alert('Awesome!', 'You cleared all the boulders! No XP lost.', [
          { text: 'OK', onPress: () => switchScreen('home') },
        ]);
      }, 500);
    }
  }, [recordGamePlay, switchScreen]);

  const handleGKFinish = useCallback((score: number, total: number) => {
    recordGKQuiz(score, total);
    setTimeout(() => {
      if (score >= 3) {
        Alert.alert('Well Done!', `You scored ${score}/${total}. Your XP has been reimbursed! (+1 XP)`, [
          { text: 'OK', onPress: () => switchScreen('home') },
        ]);
      } else {
        Alert.alert('Not Enough', `You scored ${score}/${total}. You need 3+ correct answers to reimburse XP.`, [
          { text: 'OK', onPress: () => switchScreen('home') },
        ]);
      }
    }, 800);
  }, [recordGKQuiz, switchScreen]);

  const handleRunnerFinish = useCallback((earnedCoins: number) => {
    setRunnerCoins(earnedCoins);
    recordGamePlay('runner', earnedCoins > 0);
    if (earnedCoins > 0) {
      addXP(earnedCoins, `Classroom Runner: ${earnedCoins} coins collected`);
    }
    setShowReviveQuiz(false);
    setTimeout(() => {
      if (earnedCoins > 0) {
        Alert.alert('Run Complete!', `You earned ${earnedCoins} XP from coins!`, [
          { text: 'OK', onPress: () => switchScreen('home') },
        ]);
      } else {
        Alert.alert('Game Over!', 'You lost 1 XP. Take the GK Quiz (score 3+) to earn it back!', [
          { text: 'Take Quiz', onPress: () => switchScreen('gk-quiz') },
          { text: 'Later', style: 'cancel', onPress: () => switchScreen('home') },
        ]);
      }
    }, 500);
  }, [recordGamePlay, addXP, switchScreen]);

  const handleRunnerRevive = useCallback(() => {
    setShowReviveQuiz(true);
  }, []);

  const handleReviveResult = useCallback((passed: boolean) => {
    setShowReviveQuiz(false);
    if (passed) {
      setTimeout(() => {
        Alert.alert('Revived!', 'You passed the quiz! But the game session is over. Your coins are saved!', [
          { text: 'OK', onPress: () => handleRunnerFinish(runnerCoins) },
        ]);
      }, 1200);
    } else {
      setTimeout(() => {
        Alert.alert('Failed to Revive', 'You did not pass. Game over!', [
          { text: 'OK', onPress: () => handleRunnerFinish(0) },
        ]);
      }, 1200);
    }
  }, [handleRunnerFinish, runnerCoins]);

  const renderHome = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[homeStyles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={homeStyles.heroSection}>
        <LinearGradient
          colors={['#f59e0b', '#f97316', '#ef4444']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={homeStyles.heroBanner}
        >
          <View style={homeStyles.heroIconWrap}>
            <Text style={homeStyles.heroEmoji}>🎮</Text>
          </View>
          <Text style={homeStyles.heroTitle}>Fun with Learning</Text>
          <Text style={homeStyles.heroSubtitle}>Play games, stay sharp, earn XP!</Text>
          <View style={homeStyles.heroRuleRow}>
            <View style={homeStyles.heroRulePill}>
              <Text style={homeStyles.heroRuleText}>1 game/day each</Text>
            </View>
            <View style={homeStyles.heroRulePill}>
              <Text style={homeStyles.heroRuleText}>Lose = -1 XP</Text>
            </View>
            <View style={homeStyles.heroRulePill}>
              <Text style={homeStyles.heroRuleText}>Quiz = +1 XP</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <Text style={[homeStyles.sectionLabel, { color: colors.text }]}>Choose a Game</Text>

      <TouchableOpacity
        style={[homeStyles.gameCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
        onPress={() => {
          if (pacmanPlayed) {
            Alert.alert('Already Played', 'You already played Fox in Forest today. Come back tomorrow!');
            return;
          }
          switchScreen('pacman');
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#2d5a27', '#3d8b37']}
          style={homeStyles.gameIconBg}
        >
          <Text style={{ fontSize: 24 }}>🦊</Text>
        </LinearGradient>
        <View style={homeStyles.gameCardContent}>
          <Text style={[homeStyles.gameCardTitle, { color: colors.text }]}>Fox in Forest</Text>
          <Text style={[homeStyles.gameCardDesc, { color: colors.textSecondary }]}>
            Collect berries, avoid predators!
          </Text>
        </View>
        {pacmanPlayed ? (
          <View style={homeStyles.playedBadge}>
            <Lock size={14} color="#94a3b8" />
            <Text style={homeStyles.playedText}>Played</Text>
          </View>
        ) : (
          <ChevronRight size={24} color={colors.textTertiary} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[homeStyles.gameCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
        onPress={() => {
          if (flappyPlayed) {
            Alert.alert('Already Played', 'You already played Jumping Fox today. Come back tomorrow!');
            return;
          }
          switchScreen('flappy');
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#F97316', '#EA580C']}
          style={homeStyles.gameIconBg}
        >
          <Text style={{ fontSize: 24 }}>🦊</Text>
        </LinearGradient>
        <View style={homeStyles.gameCardContent}>
          <Text style={[homeStyles.gameCardTitle, { color: colors.text }]}>Jumping Fox</Text>
          <Text style={[homeStyles.gameCardDesc, { color: colors.textSecondary }]}>
            Tap to jump over 5 boulders!
          </Text>
        </View>
        {flappyPlayed ? (
          <View style={homeStyles.playedBadge}>
            <Lock size={14} color="#94a3b8" />
            <Text style={homeStyles.playedText}>Played</Text>
          </View>
        ) : (
          <ChevronRight size={24} color={colors.textTertiary} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[homeStyles.gameCard, { backgroundColor: colors.cardBg, borderColor: colors.border, borderWidth: 2, borderLeftWidth: 4, borderLeftColor: '#1e3a5f' }]}
        onPress={() => {
          if (tictactoePlayed) {
            Alert.alert('Already Played', 'You already played Tic-Tac-Toe today. Come back tomorrow!');
            return;
          }
          switchScreen('tictactoe');
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#1e3a5f', '#0f2744']}
          style={homeStyles.gameIconBg}
        >
          <Grid3x3 size={28} color="#fff" strokeWidth={2.5} />
        </LinearGradient>
        <View style={homeStyles.gameCardContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[homeStyles.gameCardTitle, { color: colors.text }]}>Tic-Tac-Toe</Text>
            <View style={{ backgroundColor: '#f59e0b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ fontSize: 9, fontWeight: '800' as const, color: '#fff' }}>NEW</Text>
            </View>
          </View>
          <Text style={[homeStyles.gameCardDesc, { color: colors.textSecondary }]}>
            Challenge the Wisdom Professor!
          </Text>
        </View>
        {tictactoePlayed ? (
          <View style={homeStyles.playedBadge}>
            <Lock size={14} color="#94a3b8" />
            <Text style={homeStyles.playedText}>Played</Text>
          </View>
        ) : (
          <GraduationCap size={24} color="#1e3a5f" />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[homeStyles.gameCard, { backgroundColor: colors.cardBg, borderColor: colors.border, borderWidth: 2, borderLeftWidth: 4, borderLeftColor: '#0f3460' }]}
        onPress={() => {
          if (runnerPlayed) {
            Alert.alert('Already Played', 'You already played Classroom Runner today. Come back tomorrow!');
            return;
          }
          setShowReviveQuiz(false);
          setRunnerCoins(0);
          switchScreen('runner');
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#0f3460', '#16213e']}
          style={homeStyles.gameIconBg}
        >
          <Text style={{ fontSize: 24 }}>{"\u{1F3C3}"}</Text>
        </LinearGradient>
        <View style={homeStyles.gameCardContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[homeStyles.gameCardTitle, { color: colors.text }]}>Classroom Runner</Text>
            <View style={{ backgroundColor: '#ef4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ fontSize: 9, fontWeight: '800' as const, color: '#fff' }}>HOT</Text>
            </View>
          </View>
          <Text style={[homeStyles.gameCardDesc, { color: colors.textSecondary }]}>
            Dodge obstacles! Coins = XP!
          </Text>
        </View>
        {runnerPlayed ? (
          <View style={homeStyles.playedBadge}>
            <Lock size={14} color="#94a3b8" />
            <Text style={homeStyles.playedText}>Played</Text>
          </View>
        ) : (
          <PersonStanding size={24} color="#0f3460" />
        )}
      </TouchableOpacity>

      {hasPendingLoss && (
        <>
          <Text style={[homeStyles.sectionLabel, { color: colors.text, marginTop: 24 }]}>Reimburse XP</Text>
          <TouchableOpacity
            style={[homeStyles.quizCard, { borderColor: '#8b5cf6' }]}
            onPress={() => switchScreen('gk-quiz')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={homeStyles.quizCardGradient}
            >
              <View style={homeStyles.quizCardInner}>
                <Brain size={32} color="#fff" />
                <View style={{ flex: 1 }}>
                  <Text style={homeStyles.quizCardTitle}>GK Quiz Challenge</Text>
                  <Text style={homeStyles.quizCardDesc}>
                    Answer 5 questions. Score 3+ to get your XP back!
                  </Text>
                </View>
                <Zap size={24} color="#fbbf24" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}

      <View style={[homeStyles.rulesCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={[homeStyles.rulesTitle, { color: colors.text }]}>How it works</Text>
        <View style={homeStyles.ruleItem}>
          <Star size={16} color="#f59e0b" />
          <Text style={[homeStyles.ruleText, { color: colors.textSecondary }]}>
            Play each game once per day
          </Text>
        </View>
        <View style={homeStyles.ruleItem}>
          <Zap size={16} color="#ef4444" />
          <Text style={[homeStyles.ruleText, { color: colors.textSecondary }]}>
            Losing a game costs 1 XP
          </Text>
        </View>
        <View style={homeStyles.ruleItem}>
          <Brain size={16} color="#8b5cf6" />
          <Text style={[homeStyles.ruleText, { color: colors.textSecondary }]}>
            Take a GK Quiz (3+ correct) to reimburse 1 XP
          </Text>
        </View>
        <View style={homeStyles.ruleItem}>
          <Trophy size={16} color="#10b981" />
          <Text style={[homeStyles.ruleText, { color: colors.textSecondary }]}>
            Win the game to keep your XP safe!
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (screen !== 'home') {
              switchScreen('home');
            } else {
              router.back();
            }
          }}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>
          {screen === 'home' ? 'Fun with Learning' : screen === 'pacman' ? 'Fox in Forest' : screen === 'flappy' ? 'Jumping Fox' : screen === 'tictactoe' ? 'Tic-Tac-Toe' : screen === 'runner' ? 'Classroom Runner' : 'GK Quiz'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {screen === 'home' && renderHome()}
        {screen === 'pacman' && (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}>
            <PacmanGame onFinish={handlePacmanFinish} colors={colors} />
          </ScrollView>
        )}
        {screen === 'flappy' && (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}>
            <JumpingFoxGame onFinish={handleFlappyFinish} colors={colors} />
          </ScrollView>
        )}
        {screen === 'tictactoe' && (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}>
            <TicTacToeGame onFinish={handleTicTacToeFinish} colors={colors} />
          </ScrollView>
        )}
        {screen === 'gk-quiz' && (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}>
            <GKQuiz onFinish={handleGKFinish} colors={colors} />
          </ScrollView>
        )}
        {screen === 'runner' && !showReviveQuiz && (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}>
            <ClassroomRunnerGame
              onFinish={handleRunnerFinish}
              onRevive={handleRunnerRevive}
            />
          </ScrollView>
        )}
        {screen === 'runner' && showReviveQuiz && (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}>
            <RunnerReviveQuiz onResult={handleReviveResult} />
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700' as const,
  },
});

const homeStyles = StyleSheet.create({
  scrollContent: {
    padding: 16,
  },
  heroSection: {
    marginBottom: 24,
  },
  heroBanner: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroEmoji: {
    fontSize: 32,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 16,
  },
  heroRuleRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroRulePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  heroRuleText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 14,
  },
  gameIconBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameCardContent: {
    flex: 1,
  },
  gameCardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  gameCardDesc: {
    fontSize: 13,
  },
  playedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  playedText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#94a3b8',
  },
  quizCard: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 24,
  },
  quizCardGradient: {
    padding: 20,
  },
  quizCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  quizCardTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  quizCardDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  rulesCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginTop: 16,
    gap: 12,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ruleText: {
    fontSize: 14,
    flex: 1,
  },
});

const pacStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  forestHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  forestTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#2d5a27',
    marginBottom: 8,
    textShadowColor: 'rgba(45, 90, 39, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#4a2c0a',
  },
  gameOverBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gameOverText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  maze: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a3a15',
    borderWidth: 3,
    borderColor: '#2d5a27',
  },
  cell: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  treeTrunk: {
    width: 4,
    height: 8,
    backgroundColor: '#5a3a1a',
    borderRadius: 1,
    alignItems: 'center',
  },
  treeLeaves: {
    position: 'absolute',
    top: -5,
    width: 12,
    height: 10,
    backgroundColor: '#3d8b37',
    borderRadius: 6,
  },
  berry: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: '#b91c1c',
  },
  forestLeaf: {
    position: 'absolute',
    zIndex: 15,
  },
  fireflyDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fde68a',
    zIndex: 14,
  },
  foxCharacter: {
    position: 'absolute',
    width: 22,
    height: 22,
    zIndex: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foxMazeBody: {
    width: 20,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F97316',
    borderWidth: 1.5,
    borderColor: '#C2410C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  foxMazeEarL: {
    position: 'absolute',
    left: 1,
    top: -4,
    width: 6,
    height: 7,
    backgroundColor: '#F97316',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 1,
    transform: [{ rotate: '-10deg' }],
    borderWidth: 1,
    borderColor: '#C2410C',
  },
  foxMazeEarR: {
    position: 'absolute',
    right: 2,
    top: -4,
    width: 6,
    height: 7,
    backgroundColor: '#F97316',
    borderTopLeftRadius: 1,
    borderTopRightRadius: 4,
    transform: [{ rotate: '10deg' }],
    borderWidth: 1,
    borderColor: '#C2410C',
  },
  foxMazeEye: {
    position: 'absolute',
    right: 4,
    top: 4,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  foxMazeNose: {
    position: 'absolute',
    right: 1,
    top: 8,
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#1a1a2e',
  },
  foxMazeTail: {
    position: 'absolute',
    left: -7,
    bottom: 2,
    width: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EA580C',
    transform: [{ rotate: '-15deg' }],
  },
  wolf: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wolfEmoji: {
    fontSize: 16,
  },
  controls: {
    marginTop: 20,
    alignItems: 'center',
    gap: 4,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 4,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#2d5a27',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3d8b37',
  },
  controlText: {
    fontSize: 24,
    color: '#fff',
  },
  emptyButton: {
    width: 56,
    height: 56,
  },
});

const flappyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  _headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1a3a15',
  },
  headerSub: {
    fontSize: 13,
    color: '#4a7a44',
    marginTop: 2,
  },
  headerStats: {
    backgroundColor: 'rgba(45,90,39,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  headerStatsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  headerStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45,90,39,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  headerStatIcon: {
    fontSize: 12,
  },
  headerJumps: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#2d5a27',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 10,
    gap: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(45,90,39,0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(45,90,39,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(45,90,39,0.2)',
  },
  progressDotActive: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  progressDotCheck: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  progressDotNum: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  gameArea: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 20 },
      android: { elevation: 10 },
      web: { boxShadow: '0 6px 28px rgba(0,0,0,0.35)' },
    }),
  },
  scoreFlashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#10b981',
    zIndex: 14,
  },
  deathFlashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ef4444',
    zIndex: 14,
  },
  comboOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 16,
  },
  comboText: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: '#fbbf24',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  particle: {
    position: 'absolute',
    zIndex: 17,
  },
  sunRayLayer: {
    position: 'absolute',
    top: -60,
    right: -30,
    width: 160,
    height: 160,
    zIndex: 0,
  },
  sunRay1: {
    position: 'absolute',
    top: 70,
    left: 75,
    width: 4,
    height: 60,
    backgroundColor: 'rgba(255,236,130,0.12)',
    borderRadius: 2,
    transform: [{ rotate: '0deg' }],
  },
  sunRay2: {
    position: 'absolute',
    top: 70,
    left: 75,
    width: 4,
    height: 60,
    backgroundColor: 'rgba(255,236,130,0.08)',
    borderRadius: 2,
    transform: [{ rotate: '60deg' }],
  },
  sunRay3: {
    position: 'absolute',
    top: 70,
    left: 75,
    width: 4,
    height: 60,
    backgroundColor: 'rgba(255,236,130,0.06)',
    borderRadius: 2,
    transform: [{ rotate: '120deg' }],
  },
  sunRay4: {
    position: 'absolute',
    top: 70,
    left: 75,
    width: 4,
    height: 60,
    backgroundColor: 'rgba(255,236,130,0.05)',
    borderRadius: 2,
    transform: [{ rotate: '180deg' }],
  },
  sunWrap: {
    position: 'absolute',
    top: 12,
    right: 25,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunGlow: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 236, 130, 0.12)',
  },
  sunOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 236, 130, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sunInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 224, 102, 0.6)',
  },
  forestBgLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  bgTree: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bgTreeCanopy: {
    position: 'absolute',
    top: 0,
  },
  bgTreeTrunk: {
    borderRadius: 3,
  },
  forestMidLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  midTree: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  midTreeCanopy: {
    position: 'absolute',
    top: 0,
  },
  midTreeTrunk: {
    borderRadius: 3,
  },
  mistLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(200, 230, 200, 0.15)',
    zIndex: 3,
  },
  cloudLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: GAME_WIDTH * 2,
    height: 140,
    zIndex: 3,
  },
  cloud: {
    position: 'absolute',
    backgroundColor: 'rgba(200,230,200,0.3)',
    borderRadius: 20,
  },
  floatingLeaf: {
    position: 'absolute',
    top: -20,
    zIndex: 12,
  },
  firefly: {
    position: 'absolute',
    width: 8,
    height: 8,
    zIndex: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireflyCore: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#fde68a',
  },
  fireflyGlow: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(253, 230, 138, 0.3)',
  },
  scoreOverlay: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 15,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  scoreEmoji: {
    fontSize: 16,
  },
  scoreOverlayText: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  scoreTarget: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.6)',
  },
  pipeBody: {
    position: 'absolute',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  pipeVines: {
    position: 'absolute',
    height: 18,
    zIndex: 6,
    alignItems: 'center',
    overflow: 'hidden',
  },
  pipeVinesBottom: {
    position: 'absolute',
    height: 18,
    zIndex: 6,
    alignItems: 'center',
    overflow: 'hidden',
  },
  vineText: {
    fontSize: 10,
    letterSpacing: -2,
  },
  pipeCap: {
    position: 'absolute',
    backgroundColor: '#2d5a27',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1a4d1a',
    zIndex: 5,
  },
  pipeBark: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 1,
    zIndex: 5,
  },
  bird: {
    position: 'absolute',
    width: BIRD_SIZE + 4,
    height: BIRD_SIZE + 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  foxBody: {
    width: BIRD_SIZE,
    height: BIRD_SIZE,
    borderRadius: BIRD_SIZE / 2,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C2410C',
  },
  foxEarLeft: {
    position: 'absolute',
    left: 2,
    top: -7,
    width: 9,
    height: 11,
    backgroundColor: '#F97316',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 2,
    transform: [{ rotate: '-15deg' }],
    borderWidth: 1.5,
    borderColor: '#C2410C',
  },
  foxEarRight: {
    position: 'absolute',
    right: 3,
    top: -6,
    width: 9,
    height: 11,
    backgroundColor: '#F97316',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 7,
    transform: [{ rotate: '15deg' }],
    borderWidth: 1.5,
    borderColor: '#C2410C',
  },
  foxEarInner: {
    position: 'absolute',
    bottom: 1,
    left: 2,
    right: 2,
    height: 5,
    borderRadius: 2,
    backgroundColor: '#FDBA74',
  },
  foxTail: {
    position: 'absolute',
    left: -12,
    bottom: 2,
    width: 16,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EA580C',
  },
  foxTailTip: {
    position: 'absolute',
    left: 0,
    top: 1,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FEF3C7',
  },
  foxBelly: {
    position: 'absolute',
    right: 2,
    bottom: 3,
    width: 14,
    height: 10,
    borderRadius: 7,
    backgroundColor: '#FDBA74',
    opacity: 0.6,
  },
  foxEye: {
    position: 'absolute',
    right: 5,
    top: 7,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  foxPupil: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1a1a2e',
    marginLeft: 1,
  },
  foxEyeShine: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#fff',
  },
  foxNose: {
    position: 'absolute',
    right: -1,
    top: 13,
    width: 6,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1a1a2e',
  },
  foxShadow: {
    position: 'absolute',
    bottom: -4,
    width: BIRD_SIZE * 0.7,
    height: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'center',
  },
  foxEyeLeft: {
    position: 'absolute',
    left: 7,
    top: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  foxPupilLeft: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1a1a2e',
    marginRight: 1,
  },
  foxEyeShineLeft: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#fff',
  },
  foxCheek: {
    position: 'absolute',
    right: 8,
    top: 16,
    width: 5,
    height: 4,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 160, 100, 0.5)',
  },
  foxCheekLeft: {
    position: 'absolute',
    left: 9,
    top: 16,
    width: 5,
    height: 4,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 160, 100, 0.4)',
  },
  foxMouth: {
    position: 'absolute',
    right: 3,
    top: 19,
    width: 4,
    height: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: '#92400E',
  },
  foxWhiskerRight1: {
    position: 'absolute',
    right: -5,
    top: 14,
    width: 8,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    transform: [{ rotate: '-10deg' }],
  },
  foxWhiskerRight2: {
    position: 'absolute',
    right: -5,
    top: 17,
    width: 8,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
    transform: [{ rotate: '10deg' }],
  },
  groundLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: GROUND_HEIGHT,
    zIndex: 8,
  },
  grassTopHighlight: {
    height: 2,
    backgroundColor: '#66BB6A',
  },
  grassTop: {
    height: 3,
    backgroundColor: '#4CAF50',
  },
  grassBlade: {
    height: 4,
    backgroundColor: '#3d8b37',
  },
  grassStripe: {
    height: 6,
    backgroundColor: '#2d6a27',
  },
  dirtLayer: {
    flex: 1,
    backgroundColor: '#3d2b1f',
  },
  groundDetails: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mushroom: {
    position: 'absolute',
    top: -4,
    alignItems: 'center',
  },
  mushroomCap: {
    width: 8,
    height: 5,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: '#ef4444',
  },
  mushroomSpot: {
    position: 'absolute',
    top: 1,
    left: 2,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#fff',
  },
  groundFlower: {
    position: 'absolute',
    top: -6,
  },
  mushroomStem: {
    width: 3,
    height: 4,
    backgroundColor: '#fef3c7',
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
  },
  tapPrompt: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10,31,10,0.5)',
    zIndex: 20,
  },
  startCard: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    width: '80%',
    gap: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 10 },
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.3)' },
    }),
  },
  startCardDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
  },
  startDivider: {
    width: '60%',
    height: 1,
    backgroundColor: 'rgba(45,90,39,0.12)',
    marginVertical: 4,
  },
  startInfoIcon: {
    fontSize: 14,
    marginBottom: 2,
  },
  startIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2d5a27',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#3d8b37',
  },
  startTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#1a3a15',
    marginTop: 4,
  },
  startSubtitle: {
    fontSize: 14,
    color: '#4a7a44',
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  startInfoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  startInfoPill: {
    backgroundColor: 'rgba(45,90,39,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    gap: 2,
  },
  startInfoText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#2d5a27',
  },
  tapIndicator: {
    marginTop: 10,
    backgroundColor: '#2d5a27',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  tapText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10,31,10,0.55)',
    zIndex: 20,
  },
  gameOverCard: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    width: '80%',
    gap: 6,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 10 },
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.3)' },
    }),
  },
  gameOverTopStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
  },
  gameOverBonusRow: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  gameOverBonusText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#059669',
  },
  gameOverEmoji: {
    fontSize: 52,
    marginTop: 4,
  },
  gameOverTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#1a3a15',
  },
  gameOverSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  gameOverDivider: {
    width: '80%',
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  gameOverStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  gameOverStat: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  gameOverStatLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  gameOverStatValue: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#1a3a15',
  },
  gameOverStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#e2e8f0',
  },
  gameOverScoreWrap: {
    alignItems: 'center',
    marginTop: 4,
  },
  gameOverScoreLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  gameOverScoreValue: {
    fontSize: 36,
    fontWeight: '900' as const,
  },
});

const tttStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  professorCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 4,
  },
  professorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  professorAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  professorEmoji: {
    fontSize: 28,
  },
  professorTextWrap: {
    flex: 1,
  },
  professorName: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#fbbf24',
    marginBottom: 4,
  },
  professorSpeech: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  statusRow: {
    width: '100%',
    alignItems: 'center',
  },
  turnIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  turnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 12,
    backgroundColor: '#1e293b',
    padding: 6,
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 40,
    fontWeight: '900' as const,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSymbol: {
    fontSize: 20,
    fontWeight: '900' as const,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  legendVs: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
});

const gkStyles = StyleSheet.create({
  container: {
    gap: 16,
  },
  progressRow: {
    gap: 8,
  },
  questionCount: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 3,
  },
  questionCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    }),
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600' as const,
    textAlign: 'center',
    lineHeight: 26,
  },
  optionsList: {
    gap: 10,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  optionSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  optionCorrect: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  optionWrong: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLetterText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  resultContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 20,
  },
  resultGradient: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  resultScore: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: '#fff',
  },
  resultText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '600' as const,
  },
});

const runnerStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  scoreBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: RUNNER_WIDTH,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15,52,96,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  coinEmoji: {
    fontSize: 18,
  },
  scoreNum: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: '#f59e0b',
  },
  distPill: {
    backgroundColor: 'rgba(15,52,96,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  distText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#64748b',
  },
  gameArea: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20 },
      android: { elevation: 12 },
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
    }),
  },
  bgPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  bgStar: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  road: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  roadEdge: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#f59e0b',
    opacity: 0.6,
    zIndex: 2,
  },
  laneDivider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    overflow: 'hidden',
    zIndex: 2,
  },
  dashLine: {
    width: 2,
    height: ROAD_LINE_HEIGHT / 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: ROAD_LINE_HEIGHT / 2,
  },
  obstacle: {
    position: 'absolute',
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 5,
  },
  obstacleGradient: {
    flex: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  obstacleEmoji: {
    fontSize: 22,
  },
  obstacleLabel: {
    fontSize: 8,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 1,
    marginTop: 1,
  },
  coin: {
    position: 'absolute',
    width: COIN_SIZE,
    height: COIN_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 6,
  },
  coinText: {
    fontSize: 18,
  },
  player: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE + 16,
    zIndex: 10,
  },
  studentBody: {
    alignItems: 'center',
  },
  studentHead: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  studentHair: {
    position: 'absolute',
    top: -2,
    left: 2,
    right: 2,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#1a1a2e',
  },
  studentFace: {
    position: 'absolute',
    bottom: 2,
    width: 16,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentEyeL: {
    position: 'absolute',
    left: 2,
    top: 1,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1a1a2e',
  },
  studentEyeR: {
    position: 'absolute',
    right: 2,
    top: 1,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1a1a2e',
  },
  studentMouth: {
    position: 'absolute',
    bottom: 0,
    width: 6,
    height: 2,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: '#ef4444',
  },
  studentTorso: {
    width: 22,
    height: 18,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    marginTop: -2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  studentTie: {
    width: 4,
    height: 10,
    backgroundColor: '#ef4444',
    borderRadius: 2,
  },
  studentLegs: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 1,
  },
  studentLegL: {
    width: 7,
    height: 14,
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  studentLegR: {
    width: 7,
    height: 14,
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  teacher: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 4,
  },
  teacherEmoji: {
    fontSize: 40,
  },
  teacherSpeech: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 2,
  },
  teacherSpeechText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#ef4444',
  },
  startOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15,52,96,0.7)',
    zIndex: 20,
  },
  startCard: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    width: '85%',
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 10 },
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.3)' },
    }),
  },
  startIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1a4d8e',
  },
  startTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#0f3460',
  },
  startDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  startHints: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  hintPill: {
    backgroundColor: 'rgba(15,52,96,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#0f3460',
  },
  tapStart: {
    marginTop: 8,
    backgroundColor: '#0f3460',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  tapStartText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15,52,96,0.7)',
    zIndex: 20,
  },
  gameOverCard: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    width: '85%',
    gap: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 10 },
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.3)' },
    }),
  },
  gameOverEmoji: {
    fontSize: 48,
  },
  gameOverTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#0f3460',
  },
  gameOverDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  gameOverStats: {
    flexDirection: 'row',
    gap: 24,
    marginVertical: 8,
  },
  goStatItem: {
    alignItems: 'center',
  },
  goStatVal: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#0f3460',
  },
  goStatLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  goStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  reviveBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  reviveBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
    textAlign: 'center',
  },
  finishBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  finishBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  skipBtn: {
    marginTop: 8,
    paddingVertical: 10,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#94a3b8',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: RUNNER_WIDTH,
    marginTop: 14,
    gap: 16,
  },
  controlBtn: {
    width: 72,
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(26, 77, 142, 0.6)',
    ...Platform.select({
      ios: { shadowColor: '#0f3460', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 5 },
      web: { boxShadow: '0 3px 12px rgba(15, 52, 96, 0.3)' },
    }),
  },
  controlBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  controlBtnArrow: {
    fontSize: 26,
    color: '#ffffff',
    fontWeight: '700' as const,
  },
  controlCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 52, 96, 0.1)',
    borderRadius: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(15, 52, 96, 0.15)',
  },
  controlLaneText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#64748b',
    letterSpacing: 0.5,
  },
});
