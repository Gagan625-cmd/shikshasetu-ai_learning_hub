package com.rork.shikshasetu.ui.screens.student

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.shikshasetu.models.ContentActivity
import com.rork.shikshasetu.services.AppService
import com.rork.shikshasetu.ui.theme.AppColors
import org.koin.compose.koinInject
import kotlin.random.Random

data class QuizQuestionData(
    val question: String,
    val options: List<String>,
    val correct: Int,
    val explanation: String
)

// ===================== QUIZ SCREEN (AI-powered) =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentQuizScreen(
    subjectId: String,
    chapterId: String,
    onBack: () -> Unit,
    appService: AppService = koinInject()
) {
    var questions by remember { mutableStateOf<List<QuizQuestionData>>(emptyList()) }
    var currentQ by remember { mutableStateOf(0) }
    var selected by remember { mutableStateOf(-1) }
    var score by remember { mutableStateOf(0) }
    var showResult by remember { mutableStateOf(false) }
    var showExplanation by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        isLoading = true
        questions = listOf(
            QuizQuestionData("What is the powerhouse of the cell?", listOf("Nucleus", "Mitochondria", "Ribosome", "Golgi body"), 1, "Mitochondria produce ATP through cellular respiration."),
            QuizQuestionData("What is the chemical symbol for water?", listOf("HO", "H2O", "HO2", "H3O"), 1, "Water consists of 2 hydrogen atoms and 1 oxygen atom."),
            QuizQuestionData("Who developed the theory of relativity?", listOf("Newton", "Einstein", "Hawking", "Bohr"), 1, "Albert Einstein published the theory of relativity in 1905."),
            QuizQuestionData("What is the largest planet in our solar system?", listOf("Mars", "Earth", "Jupiter", "Saturn"), 2, "Jupiter has a diameter of about 139,820 km."),
            QuizQuestionData("What gas do plants absorb from the atmosphere?", listOf("Oxygen", "Nitrogen", "CO2", "Hydrogen"), 2, "Plants use CO2 in photosynthesis to produce glucose."),
            QuizQuestionData("What is the capital of India?", listOf("Mumbai", "New Delhi", "Kolkata", "Chennai"), 1, "New Delhi is the capital of India since 1911."),
            QuizQuestionData("Which element has atomic number 1?", listOf("Helium", "Hydrogen", "Lithium", "Oxygen"), 1, "Hydrogen is the lightest element with atomic number 1."),
            QuizQuestionData("What is the SI unit of force?", listOf("Joule", "Newton", "Pascal", "Watt"), 1, "Newton (N) is the SI unit of force."),
            QuizQuestionData("Which vitamin is produced when skin is exposed to sunlight?", listOf("Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"), 3, "Vitamin D is synthesized in skin through UV exposure."),
            QuizQuestionData("What is the speed of light in vacuum?", listOf("3×10⁶ m/s", "3×10⁸ m/s", "3×10¹⁰ m/s", "3×10⁴ m/s"), 1, "Light travels at approximately 3×10⁸ m/s in vacuum.")
        ).shuffled().take(10)
        isLoading = false
    }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("AI Quiz", color = Color.White) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628)))
        },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        when {
            isLoading -> Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = Color(0xFF0ea5e9))
                    Spacer(Modifier.height(16.dp))
                    Text("Generating quiz...", color = Color(0xFF94a3b8))
                }
            }
            showResult -> QuizResultScreen(padding, score, questions.size, onBack, appService)
            else -> {
                val q = questions[currentQ]
                Column(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
                    LinearProgressIndicator(
                        progress = { (currentQ + 1).toFloat() / questions.size },
                        modifier = Modifier.fillMaxWidth(), color = Color(0xFF0ea5e9), trackColor = Color(0xFF1e3a5f)
                    )
                    Spacer(Modifier.height(20.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Q${currentQ + 1}/${questions.size}", fontSize = 14.sp, color = Color(0xFF64748b))
                        Text("Score: $score", fontSize = 14.sp, color = Color(0xFF10b981), fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.height(12.dp))
                    Text(q.question, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Spacer(Modifier.height(20.dp))
                    q.options.forEachIndexed { idx, option ->
                        val isSelected = selected == idx
                        val isCorrect = showExplanation && idx == q.correct
                        Surface(
                            onClick = { if (!showExplanation) selected = idx },
                            modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp),
                            shape = RoundedCornerShape(14.dp),
                            color = when {
                                isCorrect -> Color(0xFF10b981).copy(alpha = 0.2f)
                                isSelected && showExplanation && !isCorrect -> Color(0xFFef4444).copy(alpha = 0.2f)
                                isSelected -> Color(0xFF0ea5e9).copy(alpha = 0.2f)
                                else -> Color(0xFF0c1f35)
                            }
                        ) {
                            Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                Text("${('A' + idx)}.  ", fontWeight = FontWeight.Bold, color = when {
                                    isCorrect -> Color(0xFF10b981); isSelected && showExplanation -> Color(0xFFef4444)
                                    isSelected -> Color(0xFF0ea5e9); else -> Color(0xFF64748b) })
                                Text(option, fontSize = 15.sp, color = Color(0xFFe2e8f0))
                            }
                        }
                    }
                    if (showExplanation) {
                        Spacer(Modifier.height(12.dp))
                        Card(shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0ea5e9).copy(alpha = 0.1f))) {
                            Text(q.explanation, modifier = Modifier.padding(16.dp), fontSize = 14.sp, color = Color(0xFF7dd3fc))
                        }
                    }
                    Spacer(Modifier.weight(1f))
                    if (!showExplanation && selected >= 0) {
                        Button(onClick = { showExplanation = true }, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFf59e0b)), shape = RoundedCornerShape(14.dp)) { Text("Check Answer", fontWeight = FontWeight.Bold) }
                    }
                    if (showExplanation) {
                        Spacer(Modifier.height(8.dp))
                        Button(onClick = {
                            if (selected == q.correct) score++
                            if (currentQ < questions.size - 1) { currentQ++; selected = -1; showExplanation = false }
                            else showResult = true
                        }, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0ea5e9)), shape = RoundedCornerShape(14.dp)) { Text(if (currentQ < questions.size - 1) "Next Question" else "See Results", fontWeight = FontWeight.Bold) }
                    }
                }
            }
        }
    }
}

@Composable
private fun QuizResultScreen(padding: PaddingValues, score: Int, total: Int, onBack: () -> Unit, appService: AppService) {
    val pct = (score * 100) / total
    LaunchedEffect(Unit) { appService.addXP(score * 2, "Quiz completed"); appService.addStudyTime(5) }
    Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(24.dp)) {
            Text(if (pct >= 70) "\uD83C\uDFC6" else if (pct >= 40) "\uD83D\uDC4D" else "\uD83D\uDCA1", fontSize = 64.sp)
            Spacer(Modifier.height(16.dp))
            Text("Quiz Complete!", fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
            Spacer(Modifier.height(8.dp))
            Text("$score / $total correct", fontSize = 18.sp, color = Color(0xFF94a3b8))
            Spacer(Modifier.height(4.dp))
            Text("$pct% Accuracy", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = when { pct >= 80 -> Color(0xFF10b981); pct >= 50 -> Color(0xFFf59e0b); else -> Color(0xFFef4444) })
            Spacer(Modifier.height(20.dp))
            Button(onClick = onBack, modifier = Modifier.fillMaxWidth(0.7f), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0ea5e9)), shape = RoundedCornerShape(14.dp)) { Text("Back", fontWeight = FontWeight.Bold) }
        }
    }
}

// ===================== GENERATE SCREEN =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentGenerateScreen(onBack: () -> Unit, appService: AppService = koinInject()) {
    var selectedOption by remember { mutableStateOf("") }
    var result by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }

    val options = listOf(
        "MCQ Quiz" to ("\uD83D\uDCDD" to "Generate a 10-question MCQ quiz on your selected topic"),
        "Summary Notes" to ("\uD83D\uDCDA" to "Generate comprehensive study notes"),
        "Flashcards" to ("\uD83C\uDF43" to "Generate flashcards for quick revision"),
        "Practice Worksheet" to ("\uD83D\uDCC4" to "Generate a practice worksheet with answers"),
        "Mind Map" to ("\uD83E\uDDE0" to "Generate a mind map structure"),
        "Chapter Summary" to ("\uD83D\uDCD6" to "Generate a chapter-wise summary")
    )

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("AI Generate", color = Color.White) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } },
                actions = {
                    Surface(shape = RoundedCornerShape(10.dp), color = Color(0xFF0ea5e9).copy(alpha = 0.15f)) {
                        Text("${appService.aiRemaining}/${appService.aiDailyLimit} \u2728", modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF7dd3fc))
                    }
                    Spacer(Modifier.width(8.dp))
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628)))
        },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp)) {
            Text("What would you like to generate?", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Spacer(Modifier.height(16.dp))
            options.forEach { (label, pair) ->
                val (emoji, desc) = pair
                Card(
                    onClick = { selectedOption = label },
                    modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = if (selectedOption == label) Color(0xFF0ea5e9).copy(alpha = 0.1f) else Color(0xFF0c1f35))
                ) {
                    Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(emoji, fontSize = 28.sp)
                        Spacer(Modifier.width(16.dp))
                        Column(Modifier.weight(1f)) {
                            Text(label, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 16.sp)
                            Text(desc, fontSize = 12.sp, color = Color(0xFF94a3b8))
                        }
                        if (selectedOption == label) Icon(Icons.Filled.CheckCircle, null, tint = Color(0xFF0ea5e9))
                    }
                }
            }
            if (selectedOption.isNotEmpty()) {
                Spacer(Modifier.height(20.dp))
                Button(
                    onClick = { isLoading = true; appService.incrementAIUsage(); result = "AI-generated content for: $selectedOption\n\nSample output. Real AI generation would be called here."; isLoading = false },
                    modifier = Modifier.fillMaxWidth(), enabled = !isLoading && appService.canUseAI(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0ea5e9)), shape = RoundedCornerShape(14.dp)
                ) {
                    if (isLoading) CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                    else Text(if (appService.canUseAI()) "Generate" else "Daily limit reached", fontWeight = FontWeight.Bold)
                }
                if (result.isNotEmpty()) { Spacer(Modifier.height(16.dp)); Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0c1f35))) { Text(result, modifier = Modifier.padding(20.dp), fontSize = 14.sp, color = Color(0xFFe2e8f0), lineHeight = 22.sp) } }
            }
        }
    }
}

// ===================== TIMETABLE SCREEN =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TimetableScreen(onBack: () -> Unit, appService: AppService = koinInject()) {
    val timeSlots = listOf("6-7 AM", "7-8 AM", "9-10 AM", "10-11 AM", "11-12 PM", "2-3 PM", "3-4 PM", "4-5 PM", "6-7 PM", "8-9 PM")
    Scaffold(
        topBar = { TopAppBar(title = { Text("AI Timetable", color = Color.White) }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } }, actions = { IconButton(onClick = {}) { Icon(Icons.Filled.AutoAwesome, "Generate AI", tint = Color(0xFFf59e0b)) } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628))) },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp)) {
            Text("\uD83D\uDCC5 AI-Generated Study Plan", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Spacer(Modifier.height(4.dp))
            Text("Personalized based on your syllabus", fontSize = 13.sp, color = Color(0xFF94a3b8))
            Spacer(Modifier.height(16.dp))
            timeSlots.forEachIndexed { idx, slot ->
                Card(Modifier.fillMaxWidth().padding(vertical = 4.dp), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = when { idx < 3 -> Color(0xFF0ea5e9); idx in 3..5 -> Color(0xFF8b5cf6); else -> Color(0xFF10b981) }.copy(alpha = 0.08f))) {
                    Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Surface(shape = RoundedCornerShape(8.dp), color = Color(0xFF1e3a5f)) { Text(slot, modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF7dd3fc)) }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(when { idx < 2 -> "Mathematics - Algebra & Geometry"; idx in 2..4 -> "Science - Physics & Chemistry"; idx in 5..6 -> "English - Literature & Grammar"; else -> "Revision & Practice Tests" }, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
                            Text(when { idx % 2 == 0 -> "Focus: Problem-solving"; else -> "Focus: Theory & Concepts" }, fontSize = 11.sp, color = Color(0xFF94a3b8))
                        }
                        Icon(Icons.Filled.ChevronRight, null, tint = Color(0xFF475569))
                    }
                }
            }
        }
    }
}

// ===================== EXAM SCANNER =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExamScannerScreen(onBack: () -> Unit, appService: AppService = koinInject()) {
    var scanned by remember { mutableStateOf(false) }
    var result by remember { mutableStateOf("") }
    Scaffold(
        topBar = { TopAppBar(title = { Text("Exam Scanner", color = Color.White) }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628))) },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding), horizontalAlignment = Alignment.CenterHorizontally) {
            Spacer(Modifier.height(40.dp))
            if (!scanned) {
                Card(
                    onClick = { scanned = true; result = "Sample Analysis:\n\n\u2022 Total Marks: 80\n\u2022 Obtained: 72\n\u2022 Percentage: 90%\n\nSubject-wise:\n\u2022 Math: 18/20\n\u2022 Science: 19/20\n\u2022 English: 17/20\n\u2022 Social: 18/20\n\nStrengths: Science & Math\nImprove: English (Grammar)" },
                    modifier = Modifier.fillMaxWidth(0.85f).aspectRatio(1.4f), shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0c1f35))
                ) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Filled.DocumentScanner, null, tint = Color(0xFF10b981), modifier = Modifier.size(64.dp))
                            Spacer(Modifier.height(16.dp))
                            Text("Tap to Scan Answer Sheet", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 16.sp)
                            Text("AI will analyze and score", fontSize = 13.sp, color = Color(0xFF94a3b8))
                        }
                    }
                }
            } else {
                Card(Modifier.fillMaxWidth().padding(16.dp), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0c1f35))) {
                    Text(result, modifier = Modifier.padding(20.dp), fontSize = 15.sp, color = Color(0xFFe2e8f0), lineHeight = 22.sp)
                }
                Spacer(Modifier.height(16.dp))
                Button(onClick = { scanned = false; result = "" }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0ea5e9)), shape = RoundedCornerShape(14.dp)) { Text("Scan Another") }
            }
        }
    }
}

// ===================== QUICK REVISION =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuickRevisionScreen(onBack: () -> Unit, appService: AppService = koinInject()) {
    val cards = listOf(
        "Pythagorean Theorem" to ("a\u00B2 + b\u00B2 = c\u00B2" to Color(0xFF0ea5e9)),
        "Newton's 2nd Law" to ("F = ma" to Color(0xFF8b5cf6)),
        "Ohm's Law" to ("V = IR" to Color(0xFF10b981)),
        "Area of Circle" to ("\u03C0r\u00B2" to Color(0xFFf59e0b)),
        "Photosynthesis" to ("6CO\u2082 + 6H\u2082O \u2192 C\u2086H\u2081\u2082O\u2086 + 6O\u2082" to Color(0xFFec4899)),
        "Speed Formula" to ("v = d/t" to Color(0xFFff6b35)),
        "Density" to ("\u03C1 = m/V" to Color(0xFF14b8a6)),
        "Quadratic Formula" to ("x = (-b \u00B1 \u221A(b\u00B2-4ac))/2a" to Color(0xFF6366f1))
    )
    var currentCard by remember { mutableStateOf(0) }
    var flipped by remember { mutableStateOf(false) }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Quick Revision", color = Color.White) }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } }, actions = { IconButton(onClick = { currentCard = (currentCard + 1) % cards.size; flipped = false }) { Icon(Icons.Filled.SkipNext, "Next", tint = Color.White) } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628))) },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            val card = cards[currentCard]
            val (concept, pair) = card
            val (formula, color) = pair
            Text("${currentCard + 1} / ${cards.size}", fontSize = 14.sp, color = Color(0xFF64748b))
            Spacer(Modifier.height(16.dp))
            Card(
                onClick = { flipped = !flipped },
                modifier = Modifier.fillMaxWidth(0.85f).aspectRatio(1.2f),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.1f))
            ) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(24.dp)) {
                        Text(if (flipped) formula else concept, fontSize = if (flipped) 32.sp else 22.sp, fontWeight = FontWeight.ExtraBold, color = if (flipped) color else Color.White, textAlign = TextAlign.Center)
                        Spacer(Modifier.height(12.dp))
                        Text(if (flipped) "Tap to see concept" else "Tap to reveal formula", fontSize = 12.sp, color = Color(0xFF64748b))
                    }
                }
            }
            Spacer(Modifier.height(24.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                IconButton(onClick = { currentCard = (currentCard - 1 + cards.size) % cards.size; flipped = false }, modifier = Modifier.size(48.dp).clip(CircleShape).background(Color(0xFF1e3a5f))) { Icon(Icons.Filled.ChevronLeft, "Prev", tint = Color.White) }
                IconButton(onClick = { currentCard = Random.nextInt(cards.size); flipped = false }, modifier = Modifier.size(48.dp).clip(CircleShape).background(Color(0xFF0ea5e9))) { Icon(Icons.Filled.Shuffle, "Random", tint = Color.White) }
                IconButton(onClick = { currentCard = (currentCard + 1) % cards.size; flipped = false }, modifier = Modifier.size(48.dp).clip(CircleShape).background(Color(0xFF1e3a5f))) { Icon(Icons.Filled.ChevronRight, "Next", tint = Color.White) }
            }
        }
    }
}

// ===================== GK QUIZ =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GKQuizScreen(onBack: () -> Unit, appService: AppService = koinInject()) {
    val gkQuestions = listOf(
        "What is the capital of India?" to (listOf("Mumbai", "New Delhi", "Kolkata", "Chennai") to 1),
        "Which planet is known as the Red Planet?" to (listOf("Venus", "Mars", "Jupiter", "Saturn") to 1),
        "Who wrote the Indian national anthem?" to (listOf("Tagore", "Gandhi", "Nehru", "Patel") to 0),
        "What is the largest ocean?" to (listOf("Atlantic", "Indian", "Arctic", "Pacific") to 3),
        "Which is the largest mammal?" to (listOf("Elephant", "Blue Whale", "Giraffe", "Hippo") to 1),
        "What is the currency of Japan?" to (listOf("Yuan", "Yen", "Won", "Ringgit") to 1),
        "Who discovered penicillin?" to (listOf("Marie Curie", "Alexander Fleming", "Louis Pasteur", "Edward Jenner") to 1),
        "What is the smallest country in the world?" to (listOf("Monaco", "Vatican City", "San Marino", "Maldives") to 1),
        "Which element has symbol 'Au'?" to (listOf("Silver", "Gold", "Aluminum", "Argon") to 1),
        "How many continents are there?" to (listOf("5", "6", "7", "8") to 2)
    )
    var currentQ by remember { mutableStateOf(0) }
    var selected by remember { mutableStateOf(-1) }
    var score by remember { mutableStateOf(0) }
    var showResult by remember { mutableStateOf(false) }
    var qOrder by remember { mutableStateOf(gkQuestions.indices.shuffled().take(10)) }

    Scaffold(
        topBar = { TopAppBar(title = { Text("GK Quiz", color = Color.White) }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628))) },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        if (showResult) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(if (score >= 7) "\uD83C\uDFC6" else if (score >= 4) "\uD83D\uDC4D" else "\uD83D\uDCDA", fontSize = 64.sp)
                    Spacer(Modifier.height(16.dp))
                    Text("GK Quiz Complete!", fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                    Spacer(Modifier.height(8.dp))
                    Text("Score: $score / ${qOrder.size}", fontSize = 20.sp, color = Color(0xFFf59e0b))
                    Spacer(Modifier.height(24.dp))
                    Button(onClick = { appService.recordGKQuiz(score, qOrder.size); onBack() }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0ea5e9)), shape = RoundedCornerShape(14.dp)) { Text("Done", fontWeight = FontWeight.Bold) }
                }
            }
        } else {
            val qi = qOrder[currentQ]
            val (q, pair) = gkQuestions[qi]
            val (opts, correct) = pair
            Column(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
                LinearProgressIndicator(progress = { (currentQ + 1).toFloat() / qOrder.size }, modifier = Modifier.fillMaxWidth(), color = Color(0xFFf59e0b), trackColor = Color(0xFF1e3a5f))
                Spacer(Modifier.height(20.dp))
                Text("Q${currentQ + 1}/${qOrder.size}", fontSize = 14.sp, color = Color(0xFF64748b))
                Spacer(Modifier.height(8.dp))
                Text(q, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Spacer(Modifier.height(20.dp))
                opts.forEachIndexed { idx, option ->
                    Surface(
                        onClick = { selected = idx },
                        modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp), shape = RoundedCornerShape(14.dp),
                        color = if (selected == idx) Color(0xFFf59e0b).copy(alpha = 0.2f) else Color(0xFF0c1f35)
                    ) { Text(option, modifier = Modifier.padding(16.dp), fontSize = 15.sp, color = if (selected == idx) Color(0xFFf59e0b) else Color(0xFF94a3b8)) }
                }
                Spacer(Modifier.weight(1f))
                Button(
                    onClick = { if (selected == correct) score++; if (currentQ < qOrder.size - 1) { currentQ++; selected = -1 } else showResult = true },
                    modifier = Modifier.fillMaxWidth(), enabled = selected >= 0, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFf59e0b)), shape = RoundedCornerShape(14.dp)
                ) { Text(if (currentQ < qOrder.size - 1) "Next" else "Finish", fontWeight = FontWeight.Bold) }
            }
        }
    }
}

// ===================== PERFORMANCE SCREEN =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentPerformanceScreen(onBack: () -> Unit, appService: AppService = koinInject()) {
    val progress by appService.userProgress.collectAsState()
    val quizzes = progress.quizzesCompleted

    Scaffold(
        topBar = { TopAppBar(title = { Text("Performance", color = Color.White) }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628))) },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatCard("Total XP", "${progress.totalXP}", "\u2B50", Color(0xFFf59e0b), Modifier.weight(1f))
                StatCard("Streak", "${progress.currentStreak}d", "\uD83D\uDD25", Color(0xFFff6b35), Modifier.weight(1f))
            }
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatCard("Study Time", "${progress.totalStudyTime}m", "\u23F0", Color(0xFF0ea5e9), Modifier.weight(1f))
                StatCard("Quizzes", "${quizzes.size}", "\uD83D\uDCDD", Color(0xFF8b5cf6), Modifier.weight(1f))
            }
            Spacer(Modifier.height(20.dp))
            Text("Quiz History", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Spacer(Modifier.height(12.dp))
            if (quizzes.isEmpty()) {
                Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0c1f35))) {
                    Column(Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("\uD83D\uDCCB", fontSize = 40.sp); Spacer(Modifier.height(8.dp))
                        Text("No quizzes completed yet", color = Color(0xFF94a3b8))
                    }
                }
            } else {
                quizzes.takeLast(10).reversed().forEach { quiz ->
                    Card(Modifier.fillMaxWidth().padding(vertical = 4.dp), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0c1f35))) {
                        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text("${quiz.subject} - ${quiz.chapter}", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
                                Text("${quiz.board} Class ${quiz.grade}", fontSize = 12.sp, color = Color(0xFF64748b))
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("${quiz.score}/${quiz.totalQuestions}", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = when { quiz.score.toFloat() / quiz.totalQuestions >= 0.7f -> Color(0xFF10b981); quiz.score.toFloat() / quiz.totalQuestions >= 0.4f -> Color(0xFFf59e0b); else -> Color(0xFFef4444) })
                                Text("${(quiz.score * 100 / quiz.totalQuestions)}%", fontSize = 12.sp, color = Color(0xFF64748b))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatCard(label: String, value: String, emoji: String, accent: Color, modifier: Modifier = Modifier) {
    Card(modifier = modifier, shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = accent.copy(alpha = 0.1f))) {
        Column(Modifier.padding(16.dp)) { Text(emoji, fontSize = 24.sp); Spacer(Modifier.height(8.dp)); Text(value, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = accent); Text(label, fontSize = 12.sp, color = Color(0xFF94a3b8)) }
    }
}

// ===================== ICSE CONTENT =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ICSEContentScreen(onBack: () -> Unit, appService: AppService = koinInject()) {
    val subjects = listOf(
        Triple("Physics", "\u269B\uFE0F", Color(0xFF0ea5e9)) to listOf("Mechanics", "Heat", "Light", "Sound", "Electricity"),
        Triple("Chemistry", "\uD83E\uDDEA", Color(0xFF8b5cf6)) to listOf("Periodic Table", "Bonding", "Acids & Bases", "Organic Chemistry"),
        Triple("Biology", "\uD83E\uDDE0", Color(0xFF10b981)) to listOf("Cell Biology", "Genetics", "Ecology", "Human Physiology"),
        Triple("Mathematics", "\uD83D\uDCCA", Color(0xFFf59e0b)) to listOf("Algebra", "Geometry", "Trigonometry", "Statistics")
    )
    Scaffold(
        topBar = { TopAppBar(title = { Text("ICSE Content", color = Color.White) }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628))) },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp)) {
            subjects.forEach { (subj, chapters) ->
                val (name, emoji, color) = subj
                Card(Modifier.fillMaxWidth().padding(vertical = 6.dp), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.08f))) {
                    Column(Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) { Text(emoji, fontSize = 28.sp); Spacer(Modifier.width(12.dp)); Text(name, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = color) }
                        Spacer(Modifier.height(12.dp))
                        chapters.forEach { chapter ->
                            Surface(
                                onClick = { appService.addContentActivity(ContentActivity(id = System.currentTimeMillis().toString(), board = "ICSE", type = "content", subject = name, chapter = chapter, grade = 10, completedAt = System.currentTimeMillis())) },
                                modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp), shape = RoundedCornerShape(10.dp), color = Color(0xFF0c1f35)
                            ) {
                                Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Filled.MenuBook, null, tint = color, modifier = Modifier.size(20.dp)); Spacer(Modifier.width(12.dp)); Text(chapter, fontSize = 14.sp, color = Color(0xFFe2e8f0), modifier = Modifier.weight(1f)); Icon(Icons.Filled.ChevronRight, null, tint = Color(0xFF475569)) }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ===================== ABOUT SCREEN =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AboutScreen(onBack: () -> Unit, appService: AppService = koinInject()) {
    Scaffold(
        topBar = { TopAppBar(title = { Text("About", color = Color.White) }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628))) },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Spacer(Modifier.height(40.dp))
            Text("\uD83C\uDF93", fontSize = 64.sp)
            Spacer(Modifier.height(16.dp))
            Text("ShikshaSetu", fontSize = 32.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF0ea5e9))
            Text("Bridging Learning Gaps with AI", fontSize = 16.sp, color = Color(0xFF94a3b8))
            Spacer(Modifier.height(24.dp))
            Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0c1f35))) {
                Column(Modifier.padding(20.dp)) {
                    AboutRow("Version", "2.0.0"); AboutRow("Made In", "India \uD83C\uDDEE\uD83C\uDDF3"); AboutRow("Platform", "Android + iOS + Web"); AboutRow("AI Engine", "Powered by advanced LLMs"); AboutRow("Curriculum", "NCERT, ICSE, State Boards")
                }
            }
        }
    }
}

@Composable
private fun AboutRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) { Text(label, fontSize = 14.sp, color = Color(0xFF94a3b8)); Text(value, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White) }
}

// ===================== INTERVIEW SCREEN =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentInterviewScreen(onBack: () -> Unit, appService: AppService = koinInject()) {
    var started by remember { mutableStateOf(false) }
    var currentQ by remember { mutableStateOf(0) }
    var answer by remember { mutableStateOf("") }
    var feedback by remember { mutableStateOf("") }
    val questions = listOf("Tell me about yourself.", "Why this field of study?", "What are your strengths?", "How do you handle challenges?", "Where do you see yourself in 5 years?")

    Scaffold(
        topBar = { TopAppBar(title = { Text("AI Interview", color = Color.White) }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628))) },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        if (!started) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(24.dp)) {
                    Surface(shape = CircleShape, color = Color(0xFF0ea5e9).copy(alpha = 0.15f), modifier = Modifier.size(80.dp)) { Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Icon(Icons.Filled.Mic, null, tint = Color(0xFF0ea5e9), modifier = Modifier.size(40.dp)) } }
                    Spacer(Modifier.height(20.dp)); Text("AI Mock Interview", fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                    Spacer(Modifier.height(8.dp)); Text("Practice interview questions with AI feedback", textAlign = TextAlign.Center, fontSize = 14.sp, color = Color(0xFF94a3b8))
                    Spacer(Modifier.height(24.dp))
                    Button(onClick = { started = true }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0ea5e9)), shape = RoundedCornerShape(14.dp)) { Text("Start Interview", fontWeight = FontWeight.Bold) }
                }
            }
        } else {
            Column(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
                LinearProgressIndicator(progress = { (currentQ + 1).toFloat() / questions.size }, modifier = Modifier.fillMaxWidth(), color = Color(0xFF0ea5e9), trackColor = Color(0xFF1e3a5f))
                Spacer(Modifier.height(20.dp))
                Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0ea5e9).copy(alpha = 0.08f))) {
                    Column(Modifier.padding(20.dp)) { Text("Question ${currentQ + 1} of ${questions.size}", fontSize = 12.sp, color = Color(0xFF7dd3fc)); Spacer(Modifier.height(8.dp)); Text(questions[currentQ], fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White) }
                }
                Spacer(Modifier.height(16.dp))
                OutlinedTextField(value = answer, onValueChange = { answer = it }, modifier = Modifier.fillMaxWidth().height(150.dp), placeholder = { Text("Type your answer...", color = Color(0xFF475569)) }, colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF0ea5e9), unfocusedBorderColor = Color(0xFF334155), focusedTextColor = Color.White, unfocusedTextColor = Color.White), shape = RoundedCornerShape(14.dp))
                if (feedback.isNotEmpty()) { Spacer(Modifier.height(12.dp)); Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF10b981).copy(alpha = 0.1f))) { Text(feedback, modifier = Modifier.padding(16.dp), fontSize = 14.sp, color = Color(0xFF6ee7b7)) } }
                Spacer(Modifier.weight(1f))
                if (currentQ < questions.size - 1) {
                    OutlinedButton(onClick = { feedback = "Good attempt! Try using STAR method."; currentQ++; answer = "" }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp), enabled = answer.isNotBlank()) { Text("Get Feedback & Next") }
                } else {
                    Button(onClick = { started = false; currentQ = 0; answer = ""; feedback = ""; appService.addXP(10, "Completed AI interview") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10b981)), enabled = answer.isNotBlank()) { Text("Finish Interview") }
                }
            }
        }
    }
}
