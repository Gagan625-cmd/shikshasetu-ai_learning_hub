package com.rork.shikshasetu.ui.screens.student

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.shikshasetu.models.CompetitionEntry
import com.rork.shikshasetu.services.AppService
import com.rork.shikshasetu.services.AuthService
import org.koin.compose.koinInject
import kotlin.random.Random

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CompetitionScreen(
    onBack: () -> Unit,
    appService: AppService = koinInject(),
    authService: AuthService = koinInject()
) {
    val user by authService.user.collectAsState()
    val progress by appService.userProgress.collectAsState()

    var screen by remember { mutableStateOf("home") } // home, quiz, results
    var currentQ by remember { mutableStateOf(0) }
    var selected by remember { mutableStateOf(-1) }
    var score by remember { mutableStateOf(0) }
    var timeLeft by remember { mutableStateOf(30) }
    var showResult by remember { mutableStateOf(false) }

    val compQuestions = remember {
        listOf(
            CompQ("What is the chemical symbol for gold?", listOf("Ag", "Au", "Go", "Gd"), 1, "easy"),
            CompQ("Who painted the Mona Lisa?", listOf("Michelangelo", "Leonardo da Vinci", "Raphael", "Donatello"), 1, "easy"),
            CompQ("What is the powerhouse of the cell?", listOf("Nucleus", "Ribosome", "Mitochondria", "Golgi body"), 2, "easy"),
            CompQ("Which planet has the most moons?", listOf("Jupiter", "Saturn", "Uranus", "Neptune"), 1, "medium"),
            CompQ("What is the speed of light in vacuum?", listOf("3×10⁶ m/s", "3×10⁸ m/s", "3×10¹⁰ m/s", "3×10¹² m/s"), 1, "medium"),
            CompQ("Which element has the highest melting point?", listOf("Iron", "Gold", "Tungsten", "Platinum"), 2, "medium"),
            CompQ("What is the capital of Australia?", listOf("Sydney", "Melbourne", "Canberra", "Perth"), 2, "easy"),
            CompQ("Who developed the theory of general relativity?", listOf("Newton", "Einstein", "Maxwell", "Planck"), 1, "medium"),
            CompQ("What is the pH of pure water?", listOf("5", "7", "9", "14"), 1, "easy"),
            CompQ("Which country has the largest population?", listOf("USA", "India", "China", "Indonesia"), 1, "medium"),
            CompQ("What is the derivative of x²?", listOf("x", "2x", "2x²", "x³"), 1, "hard"),
            CompQ("Which gas is most abundant in Earth's atmosphere?", listOf("Oxygen", "Nitrogen", "CO2", "Argon"), 1, "medium"),
            CompQ("What is the largest organ in the human body?", listOf("Heart", "Brain", "Skin", "Liver"), 2, "medium"),
            CompQ("Who wrote 'Romeo and Juliet'?", listOf("Dickens", "Shakespeare", "Austen", "Hemingway"), 1, "easy"),
            CompQ("What is the atomic number of Carbon?", listOf("4", "6", "8", "12"), 1, "hard"),
            CompQ("Which is the longest river in the world?", listOf("Amazon", "Nile", "Yangtze", "Mississippi"), 1, "medium"),
            CompQ("What is the SI unit of electric current?", listOf("Volt", "Watt", "Ampere", "Ohm"), 2, "medium"),
            CompQ("Which vitamin is fat-soluble?", listOf("Vitamin B", "Vitamin C", "Vitamin D", "Vitamin B12"), 2, "hard"),
            CompQ("What is the capital of Brazil?", listOf("Rio", "Brasília", "São Paulo", "Salvador"), 1, "medium"),
            CompQ("Which element has the symbol 'Fe'?", listOf("Fluorine", "Iron", "Francium", "Fermium"), 1, "easy")
        ).shuffled().take(20)
    }

    // Timer
    LaunchedEffect(screen == "quiz" && !showResult) {
        timeLeft = 30
        while (timeLeft > 0 && !showResult) {
            kotlinx.coroutines.delay(1000)
            timeLeft--
            if (timeLeft <= 0 && currentQ < compQuestions.size - 1) {
                currentQ++; selected = -1; timeLeft = 30
            } else if (timeLeft <= 0) {
                showResult = true
            }
        }
    }

    // Mock leaderboard
    val leaderboard = remember {
        (1..30).map { rank ->
            CompetitionEntry(
                id = "$rank", userName = "Player $rank", email = "p$rank@test.com",
                board = "CBSE", score = (30 - rank).coerceAtLeast(1) + Random.nextInt(5),
                totalQuestions = 20, accuracy = (100f - rank * 3f).coerceAtLeast(10f),
                timeTaken = 120 + rank * 15, completedAt = "", rank = rank
            )
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (screen == "home") "Monthly Competition" else if (showResult) "Results" else "Competition Quiz", color = Color.White) },
                navigationIcon = { IconButton(onClick = { if (screen == "home") onBack() else { screen = "home"; showResult = false; currentQ = 0; score = 0 } }) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628))
            )
        },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        when {
            screen == "home" -> CompetitionHome(padding, leaderboard, user?.name ?: "You") { screen = "quiz" }
            showResult -> CompetitionResult(padding, score, compQuestions.size, leaderboard) { screen = "home"; showResult = false; currentQ = 0; score = 0 }
            else -> CompetitionQuiz(padding, compQuestions, currentQ, selected, score, timeLeft) { idx ->
                selected = idx
                if (idx == compQuestions[currentQ].correct) score++
                if (currentQ < compQuestions.size - 1) { currentQ++; selected = -1; timeLeft = 30 }
                else { showResult = true; appService.addXP(score * 3, "Monthly competition") }
            }
        }
    }
}

@Composable
private fun CompetitionHome(padding: PaddingValues, leaderboard: List<CompetitionEntry>, userName: String, onStart: () -> Unit) {
    Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp)) {
        // Hero card
        Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFf59e0b).copy(alpha = 0.1f))) {
            Column(Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text("\uD83C\uDFC6", fontSize = 48.sp)
                Spacer(Modifier.height(8.dp))
                Text("Monthly Competition", fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFFfbbf24))
                Text("Top 3 win 3-month Premium!", fontSize = 14.sp, color = Color(0xFFfcd34d))
                Spacer(Modifier.height(4.dp))
                Text("20 Questions • 30s each • CBSE/ICSE Syllabus", fontSize = 12.sp, color = Color(0xFF94a3b8))
                Spacer(Modifier.height(16.dp))
                Button(onClick = onStart, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFf59e0b)), shape = RoundedCornerShape(14.dp)) {
                    Text("Start Competition", fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(Modifier.height(20.dp))
        Text("\uD83C\uDFC6 Leaderboard", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Spacer(Modifier.height(8.dp))

        leaderboard.take(10).forEach { entry ->
            Card(Modifier.fillMaxWidth().padding(vertical = 3.dp), shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = if (entry.rank == 1) Color(0xFFf59e0b).copy(alpha = 0.1f) else Color(0xFF0c1f35))) {
                Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(when (entry.rank) { 1 -> "\uD83E\uDD47"; 2 -> "\uD83E\uDD48"; 3 -> "\uD83E\uDD49"; else -> "#${entry.rank}" },
                        fontSize = 18.sp, fontWeight = FontWeight.Bold, color = when (entry.rank) { 1 -> Color(0xFFfbbf24); 2 -> Color(0xFF94a3b8); 3 -> Color(0xFFcd7f32); else -> Color(0xFF94a3b8) })
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(entry.userName, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
                        Text("${entry.score}/${entry.totalQuestions}", fontSize = 12.sp, color = Color(0xFF64748b))
                    }
                    Text("${entry.accuracy.toInt()}%", fontWeight = FontWeight.Bold, color = Color(0xFF10b981))
                }
            }
        }
    }
}

@Composable
private fun CompetitionQuiz(padding: PaddingValues, questions: List<CompQ>, currentQ: Int, selected: Int, score: Int, timeLeft: Int, onAnswer: (Int) -> Unit) {
    Column(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
        // Timer bar
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            LinearProgressIndicator(
                progress = { timeLeft / 30f }, modifier = Modifier.weight(1f),
                color = if (timeLeft <= 10) Color(0xFFef4444) else Color(0xFFf59e0b), trackColor = Color(0xFF1e3a5f)
            )
            Spacer(Modifier.width(12.dp))
            Surface(shape = RoundedCornerShape(8.dp), color = Color(0xFF1e3a5f)) {
                Text("${timeLeft}s", modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                    fontWeight = FontWeight.Bold, color = if (timeLeft <= 10) Color(0xFFfca5a5) else Color(0xFFfcd34d))
            }
        }
        Spacer(Modifier.height(8.dp))
        Text("Q${currentQ + 1} / ${questions.size}  •  Score: $score", fontSize = 13.sp, color = Color(0xFF94a3b8))
        Spacer(Modifier.height(12.dp))
        Surface(shape = RoundedCornerShape(6.dp), color = when (questions[currentQ].difficulty) {
            "easy" -> Color(0xFF10b981); "medium" -> Color(0xFFf59e0b); else -> Color(0xFFef4444)
        }.copy(alpha = 0.15f)) {
            Text(questions[currentQ].difficulty.uppercase(), modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp),
                fontSize = 11.sp, fontWeight = FontWeight.Bold,
                color = when (questions[currentQ].difficulty) {
                    "easy" -> Color(0xFF6ee7b7); "medium" -> Color(0xFFfcd34d); else -> Color(0xFFfca5a5) })
        }
        Spacer(Modifier.height(8.dp))
        Text(questions[currentQ].question, fontSize = 19.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Spacer(Modifier.height(20.dp))
        questions[currentQ].options.forEachIndexed { idx, option ->
            Surface(
                onClick = { onAnswer(idx) },
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), shape = RoundedCornerShape(14.dp),
                color = if (selected == idx) Color(0xFFf59e0b).copy(alpha = 0.2f) else Color(0xFF0c1f35)
            ) {
                Text(option, modifier = Modifier.padding(16.dp), fontSize = 15.sp, color = if (selected == idx) Color(0xFFf59e0b) else Color(0xFF94a3b8))
            }
        }
    }
}

@Composable
private fun CompetitionResult(padding: PaddingValues, score: Int, total: Int, leaderboard: List<CompetitionEntry>, onDone: () -> Unit) {
    Column(Modifier.fillMaxSize().padding(padding), horizontalAlignment = Alignment.CenterHorizontally) {
        Spacer(Modifier.height(40.dp))
        Text("\uD83C\uDFC6", fontSize = 64.sp)
        Spacer(Modifier.height(16.dp))
        Text("Competition Complete!", fontSize = 26.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFFfbbf24))
        Spacer(Modifier.height(8.dp))
        Text("$score / $total", fontSize = 20.sp, color = Color.White)
        Text("${(score * 100 / total)}%", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Color(0xFF10b981))
        Spacer(Modifier.height(20.dp))
        Card(Modifier.fillMaxWidth().padding(horizontal = 24.dp), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0c1f35))) {
            Column(Modifier.padding(16.dp)) {
                Text("Your Rank: #${(score / 2).coerceAtMost(30)}", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 16.sp)
                Text("Top 3 winners get 3 months of Premium!", fontSize = 12.sp, color = Color(0xFFf59e0b))
            }
        }
        Spacer(Modifier.height(24.dp))
        Button(onClick = onDone, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0ea5e9)), shape = RoundedCornerShape(14.dp)) {
            Text("Back to Competition", fontWeight = FontWeight.Bold)
        }
    }
}

private data class CompQ(val question: String, val options: List<String>, val correct: Int, val difficulty: String)
