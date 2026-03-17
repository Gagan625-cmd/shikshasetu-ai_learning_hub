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
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Gamepad2, Bird, Brain, Lock, Trophy, Zap, ChevronRight, Star, X, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/app-context';
import { useTheme } from '@/contexts/theme-context';
import { getRandomGKQuestions, GKQuestion } from '@/constants/gk-questions';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type GameScreen = 'home' | 'pacman' | 'flappy' | 'gk-quiz';

const GRID_SIZE = 15;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 48) / GRID_SIZE);
const PACMAN_MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,0,1,0,0,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
  [1,0,1,0,1,1,0,1,0,1,0,0,0,0,1],
  [1,0,1,0,0,0,0,1,0,1,0,1,1,0,1],
  [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,1,0,1,1,0,1,0,1,0,1,1,0,1,1],
  [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1],
  [1,0,1,1,0,0,0,0,0,0,0,1,1,0,1],
  [1,0,0,0,0,1,0,1,0,1,0,0,0,0,1],
  [1,0,1,0,0,1,0,0,0,1,0,0,1,0,1],
  [1,0,1,0,0,0,0,1,0,0,0,0,1,0,1],
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

const FLAPPY_GRAVITY = 0.5;
const FLAPPY_JUMP = -8;
const PIPE_WIDTH = 50;
const PIPE_GAP = 150;
const BIRD_SIZE = 30;
const GAME_HEIGHT = 400;
const GAME_WIDTH = SCREEN_WIDTH - 48;

function PacmanGame({ onFinish, colors: themeColors }: { onFinish: (won: boolean) => void; colors: any }) {
  const [pacPos, setPacPos] = useState({ row: 1, col: 1 });
  const [ghostPos, setGhostPos] = useState({ row: 7, col: 7 });
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

  const movePacman = useCallback((dr: number, dc: number) => {
    if (gameOver) return;
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
  }, [gameOver, dots, onFinish]);

  useEffect(() => {
    ghostInterval.current = setInterval(() => {
      if (gameOver) return;
      setGhostPos(prev => {
        const directions = [
          { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
          { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
        ];
        const valid = directions.filter(d => {
          const nr = prev.row + d.dr;
          const nc = prev.col + d.dc;
          return nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && PACMAN_MAZE[nr][nc] === 0;
        });
        if (valid.length === 0) return prev;
        const move = valid[Math.floor(Math.random() * valid.length)];
        return { row: prev.row + move.dr, col: prev.col + move.dc };
      });
    }, 500);
    return () => { if (ghostInterval.current) clearInterval(ghostInterval.current); };
  }, [gameOver]);

  useEffect(() => {
    if (pacPos.row === ghostPos.row && pacPos.col === ghostPos.col && !gameOver) {
      setGameOver(true);
      onFinish(false);
    }
  }, [pacPos, ghostPos, gameOver, onFinish]);

  const mazeWidth = GRID_SIZE * CELL_SIZE;

  return (
    <View style={pacStyles.container}>
      <View style={pacStyles.scoreRow}>
        <Text style={[pacStyles.scoreText, { color: themeColors.text }]}>Score: {score}/{TOTAL_DOTS}</Text>
        {gameOver && (
          <View style={[pacStyles.gameOverBadge, { backgroundColor: score === TOTAL_DOTS ? '#10b981' : '#ef4444' }]}>
            <Text style={pacStyles.gameOverText}>{score === TOTAL_DOTS ? 'You Win!' : 'Game Over'}</Text>
          </View>
        )}
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
                  backgroundColor: cell === 1 ? '#1e40af' : '#0a0a2e',
                },
              ]}
            >
              {cell === 0 && dots.has(`${r}-${c}`) && (
                <View style={pacStyles.dot} />
              )}
            </View>
          ))
        )}
        <View
          style={[
            pacStyles.pacman,
            {
              left: pacPos.col * CELL_SIZE + CELL_SIZE / 2 - 10,
              top: pacPos.row * CELL_SIZE + CELL_SIZE / 2 - 10,
            },
          ]}
        />
        <View
          style={[
            pacStyles.ghost,
            {
              left: ghostPos.col * CELL_SIZE + CELL_SIZE / 2 - 10,
              top: ghostPos.row * CELL_SIZE + CELL_SIZE / 2 - 10,
            },
          ]}
        />
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

function FlappyBirdGame({ onFinish, colors: themeColors }: { onFinish: (won: boolean) => void; colors: any }) {
  const [birdY, setBirdY] = useState(GAME_HEIGHT / 2);
  const [velocity, setVelocity] = useState(0);
  const [pipes, setPipes] = useState<Array<{ x: number; gapY: number }>>([
    { x: GAME_WIDTH, gapY: 150 },
    { x: GAME_WIDTH + 200, gapY: 200 },
    { x: GAME_WIDTH + 400, gapY: 120 },
  ]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const TARGET_SCORE = 5;

  const gameLoop = useRef<ReturnType<typeof setInterval> | null>(null);

  const jump = useCallback(() => {
    if (gameOver) return;
    if (!started) setStarted(true);
    setVelocity(FLAPPY_JUMP);
  }, [gameOver, started]);

  useEffect(() => {
    if (!started || gameOver) return;
    gameLoop.current = setInterval(() => {
      setVelocity(v => v + FLAPPY_GRAVITY);
      setBirdY(y => {
        const newY = y + velocity;
        if (newY <= 0 || newY >= GAME_HEIGHT - BIRD_SIZE) {
          setGameOver(true);
          onFinish(false);
          return y;
        }
        return newY;
      });

      setPipes(prevPipes => {
        const newPipes = prevPipes.map(p => ({ ...p, x: p.x - 3 }));

        newPipes.forEach((pipe, idx) => {
          if (pipe.x + PIPE_WIDTH < 0) {
            newPipes[idx] = {
              x: GAME_WIDTH,
              gapY: 60 + Math.random() * (GAME_HEIGHT - PIPE_GAP - 120),
            };
          }
        });

        return newPipes;
      });
    }, 30);

    return () => { if (gameLoop.current) clearInterval(gameLoop.current); };
  }, [started, gameOver, velocity, onFinish]);

  useEffect(() => {
    if (gameOver) return;
    const birdLeft = 50;
    const birdRight = birdLeft + BIRD_SIZE;
    const birdTop = birdY;
    const birdBottom = birdY + BIRD_SIZE;

    for (const pipe of pipes) {
      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + PIPE_WIDTH;

      if (birdRight > pipeLeft && birdLeft < pipeRight) {
        if (birdTop < pipe.gapY || birdBottom > pipe.gapY + PIPE_GAP) {
          setGameOver(true);
          onFinish(false);
          return;
        }
      }

      if (Math.abs(pipe.x - birdLeft) < 4 && pipe.x < birdLeft) {
        setScore(s => {
          const ns = s + 1;
          if (ns >= TARGET_SCORE) {
            setGameOver(true);
            onFinish(true);
          }
          return ns;
        });
      }
    }
  }, [birdY, pipes, gameOver, onFinish]);

  return (
    <View style={flappyStyles.container}>
      <View style={flappyStyles.scoreRow}>
        <Text style={[flappyStyles.scoreText, { color: themeColors.text }]}>Score: {score}/{TARGET_SCORE}</Text>
        {gameOver && (
          <View style={[flappyStyles.gameOverBadge, { backgroundColor: score >= TARGET_SCORE ? '#10b981' : '#ef4444' }]}>
            <Text style={flappyStyles.gameOverText}>{score >= TARGET_SCORE ? 'You Win!' : 'Game Over'}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        activeOpacity={1}
        onPress={jump}
        style={[flappyStyles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}
      >
        <LinearGradient
          colors={['#87CEEB', '#4682B4', '#2E5090']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[flappyStyles.ground, { width: GAME_WIDTH }]} />

        {!started && !gameOver && (
          <View style={flappyStyles.tapPrompt}>
            <Text style={flappyStyles.tapText}>Tap to Start!</Text>
          </View>
        )}

        <View
          style={[
            flappyStyles.bird,
            { top: birdY, left: 50 },
          ]}
        >
          <Text style={flappyStyles.birdEmoji}>🐦</Text>
        </View>

        {pipes.map((pipe, i) => (
          <View key={i}>
            <View
              style={[
                flappyStyles.pipe,
                {
                  left: pipe.x,
                  top: 0,
                  height: pipe.gapY,
                  width: PIPE_WIDTH,
                },
              ]}
            />
            <View
              style={[
                flappyStyles.pipe,
                {
                  left: pipe.x,
                  top: pipe.gapY + PIPE_GAP,
                  height: GAME_HEIGHT - pipe.gapY - PIPE_GAP,
                  width: PIPE_WIDTH,
                },
              ]}
            />
          </View>
        ))}
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

export default function FunLearning() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recordGamePlay, recordGKQuiz, canPlayGame, userProgress } = useApp();
  const { colors } = useTheme();
  const [screen, setScreen] = useState<GameScreen>('home');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const hasPendingLoss = userProgress.funLearning.pendingXPLoss;
  const pacmanPlayed = !canPlayGame('pacman');
  const flappyPlayed = !canPlayGame('flappy');

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
        Alert.alert('Congratulations!', 'You completed Pacman! No XP lost.', [
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
        Alert.alert('Awesome!', 'You passed all the pipes! No XP lost.', [
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
            Alert.alert('Already Played', 'You already played Pacman today. Come back tomorrow!');
            return;
          }
          switchScreen('pacman');
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#fbbf24', '#f59e0b']}
          style={homeStyles.gameIconBg}
        >
          <Gamepad2 size={28} color="#fff" strokeWidth={2.5} />
        </LinearGradient>
        <View style={homeStyles.gameCardContent}>
          <Text style={[homeStyles.gameCardTitle, { color: colors.text }]}>Pacman</Text>
          <Text style={[homeStyles.gameCardDesc, { color: colors.textSecondary }]}>
            Eat all dots, avoid the ghost!
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
            Alert.alert('Already Played', 'You already played Flappy Bird today. Come back tomorrow!');
            return;
          }
          switchScreen('flappy');
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#38bdf8', '#0ea5e9']}
          style={homeStyles.gameIconBg}
        >
          <Bird size={28} color="#fff" strokeWidth={2.5} />
        </LinearGradient>
        <View style={homeStyles.gameCardContent}>
          <Text style={[homeStyles.gameCardTitle, { color: colors.text }]}>Flappy Bird</Text>
          <Text style={[homeStyles.gameCardDesc, { color: colors.textSecondary }]}>
            Tap to fly through 5 pipes!
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
          {screen === 'home' ? 'Fun with Learning' : screen === 'pacman' ? 'Pacman' : screen === 'flappy' ? 'Flappy Bird' : 'GK Quiz'}
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
            <FlappyBirdGame onFinish={handleFlappyFinish} colors={colors} />
          </ScrollView>
        )}
        {screen === 'gk-quiz' && (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}>
            <GKQuiz onFinish={handleGKFinish} colors={colors} />
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
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700' as const,
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
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#0a0a2e',
  },
  cell: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fbbf24',
  },
  pacman: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fbbf24',
    zIndex: 10,
  },
  ghost: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    zIndex: 10,
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
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
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
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700' as const,
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
  gameArea: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    height: 30,
    backgroundColor: '#8B4513',
  },
  tapPrompt: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 20,
  },
  tapText: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#fff',
  },
  bird: {
    position: 'absolute',
    width: BIRD_SIZE,
    height: BIRD_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  birdEmoji: {
    fontSize: 26,
  },
  pipe: {
    position: 'absolute',
    backgroundColor: '#22c55e',
    borderRadius: 4,
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
