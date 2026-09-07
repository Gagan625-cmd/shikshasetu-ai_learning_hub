package com.rork.shikshasetu.ui.screens.teacher

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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.shikshasetu.models.*
import com.rork.shikshasetu.services.AppService
import com.rork.shikshasetu.services.AuthService
import com.rork.shikshasetu.ui.components.GradientBackground
import com.rork.shikshasetu.ui.components.pressableScale
import org.koin.compose.koinInject

// ===================== TEACHER DASHBOARD =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeacherDashboardScreen(
    onNavigate: (String) -> Unit,
    authService: AuthService = koinInject(),
    appService: AppService = koinInject()
) {
    val user by authService.user.collectAsState()
    val progress by appService.userProgress.collectAsState()
    val displayName = if (user?.isGuest == true) "Guest" else (user?.name ?: "Teacher")
    val aiRemaining = appService.aiRemaining
    val aiLimit = appService.aiDailyLimit
    val isPremium = appService.isPremium

    GradientBackground {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Row(verticalAlignment = Alignment.CenterVertically) { Text("Hi, $displayName", fontWeight = FontWeight.Bold); Text(" \uD83D\uDC4B", fontSize = 20.sp) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent, titleContentColor = Color.White),
                actions = {
                    Surface(shape = RoundedCornerShape(10.dp), color = Color(0xFF0ea5e9).copy(alpha = 0.15f)) {
                        Row(Modifier.padding(horizontal = 10.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text("\u2728", fontSize = 12.sp)
                            Spacer(Modifier.width(4.dp))
                            Text("$aiRemaining/$aiLimit", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF7dd3fc))
                        }
                    }
                    Spacer(Modifier.width(8.dp))
                    if (isPremium) {
                        Surface(shape = RoundedCornerShape(10.dp), color = Color(0xFFf59e0b).copy(alpha = 0.2f)) {
                            Text("PREMIUM", modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFFfbbf24))
                        }
                        Spacer(Modifier.width(8.dp))
                    }
                }
            )
        },
        containerColor = Color.Transparent
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp)) {
            // Quick Tools Grid
            Text("Quick Tools", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                DashButton("\uD83D\uDCDD", "Generate\nContent", Color(0xFF0ea5e9), Modifier.weight(1f)) { onNavigate("teacher/generate") }
                DashButton("\uD83D\uDCC4", "Create\nQuiz", Color(0xFF8b5cf6), Modifier.weight(1f)) { onNavigate("teacher/generate") }
                DashButton("\uD83D\uDCE4", "Upload\nContent", Color(0xFF10b981), Modifier.weight(1f)) { onNavigate("teacher/upload") }
            }
            Spacer(Modifier.height(10.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                DashButton("\uD83D\uDCCA", "Performance\nTracker", Color(0xFFf59e0b), Modifier.weight(1f)) { onNavigate("teacher/performance") }
                DashButton("\uD83D\uDCDA", "NCERT\nContent", Color(0xFF14b8a6), Modifier.weight(1f)) { onNavigate("teacher/content") }
                DashButton("\uD83C\uDF93", "ICSE\nContent", Color(0xFFec4899), Modifier.weight(1f)) { onNavigate("teacher/icse") }
            }

            Spacer(Modifier.height(20.dp))
            Text("Teaching Resources", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Spacer(Modifier.height(12.dp))

            // AI Tools section
            Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0ea5e9).copy(alpha = 0.06f))) {
                Column(Modifier.padding(16.dp)) {
                    Text("\uD83E\uDD16 AI Teaching Tools", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
                    Spacer(Modifier.height(10.dp))
                    listOf(
                        Triple("\uD83D\uDCDD MCQ Generator", "Create subject-wise MCQs", "teacher/generate"),
                        Triple("\uD83D\uDCC4 Worksheet Maker", "Generate practice worksheets", "teacher/generate"),
                        Triple("\uD83D\uDCCB Question Papers", "Full exam paper generation (Premium)", "teacher/generate"),
                        Triple("\uD83E\uDDE0 Mind Maps", "Visual concept maps (Premium)", "teacher/generate"),
                        Triple("\uD83D\uDCDA Lesson Plans", "AI-curated lesson plans", "teacher/generate"),
                        Triple("\uD83C\uDFA4 Voice Assistant", "Talk to AI assistant", "teacher/voice-assistant")
                    ).forEach { (label, desc, route) ->
                        val isLocked = (label.contains("Premium") || label.contains("Mind Maps") || label.contains("Question Papers")) && !isPremium
                        Surface(
                            onClick = { if (!isLocked) onNavigate(route) else onNavigate("paywall") },
                            modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp), shape = RoundedCornerShape(10.dp),
                            color = Color(0xFF0c1f35)
                        ) {
                            Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(label, fontWeight = FontWeight.Bold, color = if (isLocked) Color(0xFF64748b) else Color.White, fontSize = 14.sp)
                                        if (isLocked) { Spacer(Modifier.width(6.dp)); Icon(Icons.Filled.Lock, null, tint = Color(0xFFf59e0b), modifier = Modifier.size(14.dp)) }
                                    }
                                    Text(desc, fontSize = 11.sp, color = Color(0xFF64748b))
                                }
                                Icon(Icons.Filled.ChevronRight, null, tint = Color(0xFF475569))
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(20.dp))
            Text("Recent Activity", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Spacer(Modifier.height(12.dp))
            if (progress.teacherActivities.isEmpty()) {
                Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0c1f35))) {
                    Column(Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("\uD83D\uDCCB", fontSize = 32.sp)
                        Spacer(Modifier.height(8.dp))
                        Text("No recent activity", color = Color(0xFF94a3b8))
                        Text("Start generating or uploading content!", fontSize = 12.sp, color = Color(0xFF64748b))
                    }
                }
            } else {
                progress.teacherActivities.takeLast(5).reversed().forEach { activity ->
                    Card(Modifier.fillMaxWidth().padding(vertical = 3.dp), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0c1f35))) {
                        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(activity.title, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
                                Text(activity.type, fontSize = 11.sp, color = Color(0xFF64748b))
                            }
                            Text(java.text.SimpleDateFormat("dd MMM", java.util.Locale.getDefault()).format(java.util.Date(activity.timestamp)), fontSize = 11.sp, color = Color(0xFF475569))
                        }
                    }
                }
            }

            // Quick links
            Spacer(Modifier.height(20.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                SmallDashBtn("Quick\nRevision", Icons.Filled.Bolt, Color(0xFFf59e0b), Modifier.weight(1f)) { onNavigate("teacher/quick-revision") }
                SmallDashBtn("Exam\nScanner", Icons.Filled.DocumentScanner, Color(0xFF10b981), Modifier.weight(1f)) { onNavigate("teacher/exam-scanner") }
                SmallDashBtn("Messages", Icons.Filled.Message, Color(0xFF0ea5e9), Modifier.weight(1f)) { onNavigate("teacher/messages") }
                SmallDashBtn("About", Icons.Filled.Info, Color(0xFF8b5cf6), Modifier.weight(1f)) { onNavigate("teacher/about") }
            }

            Spacer(Modifier.height(24.dp))
        }
    }
    }
}

@Composable
private fun DashButton(emoji: String, label: String, color: Color, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Card(modifier = modifier.pressableScale(), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.08f)), onClick = onClick) {
        Column(Modifier.padding(14.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(emoji, fontSize = 28.sp)
            Spacer(Modifier.height(6.dp))
            Text(label, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White, textAlign = TextAlign.Center, lineHeight = 14.sp)
        }
    }
}

@Composable
private fun SmallDashBtn(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector, color: Color, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Card(onClick = onClick, modifier = modifier.pressableScale(), shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.08f))) {
        Column(Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(icon, null, tint = color, modifier = Modifier.size(24.dp))
            Spacer(Modifier.height(4.dp))
            Text(label, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White, textAlign = TextAlign.Center, lineHeight = 13.sp)
        }
    }
}

// ===================== TEACHER GENERATE =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeacherGenerateScreen(
    onBack: () -> Unit,
    appService: AppService = koinInject()
) {
    var selectedOption by remember { mutableStateOf("") }
    var result by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var board by remember { mutableStateOf("NCERT") }
    var grade by remember { mutableStateOf(10) }
    var subject by remember { mutableStateOf("") }
    val isPremium = appService.isPremium

    val options = listOf(
        "MCQ Quiz" to Triple("\uD83D\uDCDD", "Generate 10-20 MCQ questions with answers", false),
        "Worksheet" to Triple("\uD83D\uDCC4", "Practice worksheet with questions", false),
        "Question Paper" to Triple("\uD83D\uDCCB", "Full question paper with marking scheme", true),
        "Mind Map" to Triple("\uD83E\uDDE0", "Visual concept map for a chapter", true),
        "Lesson Plan" to Triple("\uD83D\uDCDA", "Detailed lesson plan for a topic", false),
        "Summary Notes" to Triple("\uD83D\uDCD6", "Comprehensive chapter summaries", false)
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
            // Board & grade selectors
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                listOf("NCERT", "ICSE").forEach { b ->
                    FilterChip(selected = board == b, onClick = { board = b }, label = { Text(b, fontSize = 12.sp) },
                        modifier = Modifier.weight(1f),
                        colors = FilterChipDefaults.filterChipColors(selectedContainerColor = Color(0xFF0ea5e9).copy(alpha = 0.3f), containerColor = Color(0xFF1e293b)))
                }
            }
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                (6..12).forEach { g ->
                    FilterChip(selected = grade == g, onClick = { grade = g }, label = { Text("$g", fontSize = 11.sp) },
                        colors = FilterChipDefaults.filterChipColors(selectedContainerColor = Color(0xFF8b5cf6).copy(alpha = 0.3f), containerColor = Color(0xFF1e293b)))
                }
            }
            Spacer(Modifier.height(16.dp))

            Text("What would you like to generate?", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Spacer(Modifier.height(12.dp))

            options.forEach { (label, triple) ->
                val (emoji, desc, locked) = triple
                val isLocked = locked && !isPremium
                Card(
                    onClick = { if (!isLocked) selectedOption = label else onBack() },
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = if (selectedOption == label) Color(0xFF0ea5e9).copy(alpha = 0.12f) else Color(0xFF0c1f35))
                ) {
                    Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(emoji, fontSize = 24.sp)
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(label, fontWeight = FontWeight.Bold, color = if (isLocked) Color(0xFF64748b) else Color.White, fontSize = 15.sp)
                                if (isLocked) { Spacer(Modifier.width(6.dp)); Surface(shape = RoundedCornerShape(6.dp), color = Color(0xFFf59e0b).copy(alpha = 0.2f)) { Text("PREMIUM", modifier = Modifier.padding(horizontal = 6.dp, vertical = 1.dp), fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFFfbbf24)) } }
                            }
                            Text(desc, fontSize = 11.sp, color = if (isLocked) Color(0xFF475569) else Color(0xFF94a3b8))
                        }
                        if (selectedOption == label) Icon(Icons.Filled.CheckCircle, null, tint = Color(0xFF0ea5e9))
                        else if (isLocked) Icon(Icons.Filled.Lock, null, tint = Color(0xFFf59e0b))
                    }
                }
            }

            if (selectedOption.isNotEmpty()) {
                Spacer(Modifier.height(16.dp))
                Button(
                    onClick = {
                        isLoading = true
                        appService.incrementAIUsage()
                        result = "Generated $selectedOption for $board Class $grade\n\nThis is a sample AI-generated output. In production, this would call the AI API to generate high-quality educational content tailored to your syllabus."
                        isLoading = false
                        appService.addTeacherActivity(TeacherActivity("generate", selectedOption, System.currentTimeMillis(), "$board Class $grade"))
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isLoading && appService.canUseAI(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0ea5e9)),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    if (isLoading) CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                    else Text(if (appService.canUseAI()) "Generate Content" else "Daily AI limit reached", fontWeight = FontWeight.Bold)
                }
            }

            if (result.isNotEmpty()) {
                Spacer(Modifier.height(16.dp))
                Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0c1f35))) {
                    Text(result, modifier = Modifier.padding(20.dp), fontSize = 14.sp, color = Color(0xFFe2e8f0), lineHeight = 22.sp)
                }
            }

            Spacer(Modifier.height(16.dp))
        }
    }
}

// ===================== TEACHER CONTENT =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeacherContentScreen(
    onBack: () -> Unit,
    appService: AppService = koinInject()
) {
    val grades = 6..12
    val subjects = listOf("Mathematics", "Science", "English", "Social Science", "Hindi")

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("NCERT Content", color = Color.White) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628)))
        },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            grades.forEach { grade ->
                item {
                    Text("Class $grade", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White, modifier = Modifier.padding(top = 12.dp, bottom = 8.dp))
                }
                items(subjects) { subject ->
                    Card(Modifier.fillMaxWidth().padding(vertical = 3.dp), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0c1f35))) {
                        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Filled.MenuBook, null, tint = Color(0xFF0ea5e9), modifier = Modifier.size(20.dp))
                            Spacer(Modifier.width(12.dp))
                            Text(subject, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 15.sp, modifier = Modifier.weight(1f))
                            Text("Class $grade", fontSize = 11.sp, color = Color(0xFF64748b))
                        }
                    }
                }
            }
        }
    }
}

// ===================== TEACHER UPLOAD =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeacherUploadScreen(
    onBack: () -> Unit,
    appService: AppService = koinInject()
) {
    var title by remember { mutableStateOf("") }
    var content by remember { mutableStateOf("") }
    var selectedType by remember { mutableStateOf("text") }
    var board by remember { mutableStateOf("NCERT") }
    var grade by remember { mutableStateOf(10) }
    var subject by remember { mutableStateOf("") }
    var uploaded by remember { mutableStateOf(false) }

    if (uploaded) {
        Scaffold(
            topBar = { TopAppBar(title = { Text("Upload Content", color = Color.White) }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628))) },
            containerColor = Color(0xFF0a1628)
        ) { padding ->
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("\u2705", fontSize = 64.sp)
                    Spacer(Modifier.height(16.dp))
                    Text("Content Uploaded!", fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF10b981))
                    Spacer(Modifier.height(8.dp))
                    Text("Your content is now available for students", color = Color(0xFF94a3b8))
                    Spacer(Modifier.height(20.dp))
                    Button(onClick = { uploaded = false; title = ""; content = "" }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0ea5e9)), shape = RoundedCornerShape(14.dp)) { Text("Upload Another") }
                }
            }
        }
        return
    }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Upload Content", color = Color.White) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628)))
        },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp)) {
            Text("Content Details", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Spacer(Modifier.height(16.dp))

            OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("Title") }, modifier = Modifier.fillMaxWidth(), colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF0ea5e9), unfocusedBorderColor = Color(0xFF334155), focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedLabelColor = Color(0xFF0ea5e9)), shape = RoundedCornerShape(12.dp))
            Spacer(Modifier.height(12.dp))

            // Type selector
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                listOf("text" to "Text Note", "video" to "Video Link").forEach { (type, label) ->
                    FilterChip(selected = selectedType == type, onClick = { selectedType = type }, label = { Text(label) }, modifier = Modifier.weight(1f), colors = FilterChipDefaults.filterChipColors(selectedContainerColor = Color(0xFF0ea5e9).copy(alpha = 0.3f), containerColor = Color(0xFF1e293b)))
                }
            }
            Spacer(Modifier.height(8.dp))

            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("NCERT", "ICSE").forEach { b ->
                    FilterChip(selected = board == b, onClick = { board = b }, label = { Text(b, fontSize = 11.sp) },
                        colors = FilterChipDefaults.filterChipColors(selectedContainerColor = Color(0xFF0ea5e9).copy(alpha = 0.3f), containerColor = Color(0xFF1e293b)))
                }
                (6..12).forEach { g ->
                    FilterChip(selected = grade == g, onClick = { grade = g }, label = { Text("$g", fontSize = 11.sp) },
                        colors = FilterChipDefaults.filterChipColors(selectedContainerColor = Color(0xFF8b5cf6).copy(alpha = 0.3f), containerColor = Color(0xFF1e293b)))
                }
            }
            Spacer(Modifier.height(12.dp))

            OutlinedTextField(value = content, onValueChange = { content = it }, label = { Text("Content") }, modifier = Modifier.fillMaxWidth().height(200.dp), colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF0ea5e9), unfocusedBorderColor = Color(0xFF334155), focusedTextColor = Color.White, unfocusedTextColor = Color.White), shape = RoundedCornerShape(12.dp))
            Spacer(Modifier.height(20.dp))

            Button(
                onClick = {
                    appService.addTeacherUpload(TeacherUpload(id = System.currentTimeMillis().toString(), type = selectedType, title = title, content = content, board = board, grade = grade, subject = subject.ifBlank { "General" }, chapter = ""))
                    uploaded = true
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = title.isNotBlank() && content.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10b981)),
                shape = RoundedCornerShape(14.dp)
            ) { Text("Upload Content", fontWeight = FontWeight.Bold) }
        }
    }
}

// ===================== TEACHER PERFORMANCE =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeacherPerformanceScreen(
    onBack: () -> Unit,
    appService: AppService = koinInject()
) {
    val progress by appService.userProgress.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Performance Tracker", color = Color.White) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628)))
        },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp)) {
            Text("Content Uploads", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Spacer(Modifier.height(8.dp))
            if (progress.teacherUploads.isEmpty()) {
                Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0c1f35))) {
                    Column(Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("\uD83D\uDCE4", fontSize = 32.sp)
                        Spacer(Modifier.height(8.dp))
                        Text("No uploads yet", color = Color(0xFF94a3b8))
                        Text("Upload content to start tracking", fontSize = 12.sp, color = Color(0xFF64748b))
                    }
                }
            } else {
                progress.teacherUploads.reversed().forEach { upload ->
                    Card(Modifier.fillMaxWidth().padding(vertical = 3.dp), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0c1f35))) {
                        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(if (upload.type == "video") Icons.Filled.Videocam else Icons.Filled.Article, null, tint = Color(0xFF0ea5e9))
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(upload.title, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
                                Text("${upload.board} Class ${upload.grade}", fontSize = 11.sp, color = Color(0xFF64748b))
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(20.dp))
            Text("Activity Log", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Spacer(Modifier.height(8.dp))
            if (progress.teacherActivities.isEmpty()) {
                Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0c1f35))) {
                    Column(Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("No activity yet", color = Color(0xFF94a3b8))
                    }
                }
            } else {
                progress.teacherActivities.takeLast(10).reversed().forEach { activity ->
                    Card(Modifier.fillMaxWidth().padding(vertical = 2.dp), shape = RoundedCornerShape(10.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0c1f35))) {
                        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(activity.title, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 13.sp)
                                Text(activity.type, fontSize = 11.sp, color = Color(0xFF64748b))
                            }
                        }
                    }
                }
            }
        }
    }
}

// ===================== REMAINING TEACHER SCREENS =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ICSETeacherContentScreen(onBack: () -> Unit) {
    Scaffold(
        topBar = { TopAppBar(title = { Text("ICSE Content", color = Color.White) }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628))) },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp)) {
            listOf("Physics", "Chemistry", "Biology", "Mathematics", "English").forEach { subject ->
                Card(Modifier.fillMaxWidth().padding(vertical = 4.dp), shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0c1f35))) {
                    Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.School, null, tint = Color(0xFF8b5cf6))
                        Spacer(Modifier.width(12.dp))
                        Text(subject, fontWeight = FontWeight.Bold, color = Color.White, modifier = Modifier.weight(1f))
                        Icon(Icons.Filled.ChevronRight, null, tint = Color(0xFF475569))
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeacherQuickRevisionScreen(onBack: () -> Unit) {
    val cards = listOf("Teaching Techniques", "Classroom Management", "Assessment Methods", "Lesson Planning", "Student Engagement")
    var current by remember { mutableStateOf(0) }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Quick Revision", color = Color.White) }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628))) },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Text("${current + 1} / ${cards.size}", fontSize = 14.sp, color = Color(0xFF64748b))
            Spacer(Modifier.height(16.dp))
            Card(Modifier.fillMaxWidth(0.85f).aspectRatio(1.2f), shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFFf59e0b).copy(alpha = 0.1f))) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(cards[current], fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = Color.White, textAlign = TextAlign.Center)
                }
            }
            Spacer(Modifier.height(24.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                IconButton(onClick = { current = (current - 1 + cards.size) % cards.size }, modifier = Modifier.size(48.dp).clip(CircleShape).background(Color(0xFF1e3a5f))) { Icon(Icons.Filled.ChevronLeft, null, tint = Color.White) }
                IconButton(onClick = { current = (current + 1) % cards.size }, modifier = Modifier.size(48.dp).clip(CircleShape).background(Color(0xFF1e3a5f))) { Icon(Icons.Filled.ChevronRight, null, tint = Color.White) }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExamScannerTeacherScreen(onBack: () -> Unit) {
    Scaffold(
        topBar = { TopAppBar(title = { Text("Exam Scanner", color = Color.White) }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628))) },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Filled.DocumentScanner, null, tint = Color(0xFF10b981), modifier = Modifier.size(64.dp))
                Spacer(Modifier.height(16.dp))
                Text("Scan & Grade Answer Sheets", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Text("AI will help analyze student answers", fontSize = 14.sp, color = Color(0xFF94a3b8))
                Spacer(Modifier.height(20.dp))
                Button(onClick = {}, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10b981)), shape = RoundedCornerShape(14.dp)) { Text("Scan Now") }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeacherAboutScreen(onBack: () -> Unit) {
    Scaffold(
        topBar = { TopAppBar(title = { Text("About ShikshaSetu", color = Color.White) }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628))) },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Spacer(Modifier.height(40.dp))
            Text("\uD83C\uDF93", fontSize = 64.sp)
            Spacer(Modifier.height(16.dp))
            Text("ShikshaSetu", fontSize = 32.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF0ea5e9))
            Text("Teacher Portal", fontSize = 16.sp, color = Color(0xFF94a3b8))
            Spacer(Modifier.height(24.dp))
            Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0c1f35))) {
                Column(Modifier.padding(20.dp)) {
                    listOf(
                        "AI-powered content generation" to "\u2728",
                        "Student performance tracking" to "\uD83D\uDCCA",
                        "Upload & share resources" to "\uD83D\uDCE4",
                        "Create quizzes & worksheets" to "\uD83D\uDCDD",
                        "Voice AI assistant" to "\uD83C\uDFA4"
                    ).forEach { (text, emoji) ->
                        Row(Modifier.padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text(emoji, fontSize = 18.sp)
                            Spacer(Modifier.width(12.dp))
                            Text(text, fontSize = 14.sp, color = Color(0xFFe2e8f0))
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VoiceAssistantScreen(onBack: () -> Unit) {
    var isListening by remember { mutableStateOf(false) }
    var transcript by remember { mutableStateOf("") }
    var response by remember { mutableStateOf("") }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Voice Assistant", color = Color.White) }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628))) },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding), horizontalAlignment = Alignment.CenterHorizontally) {
            Spacer(Modifier.height(40.dp))
            Surface(
                shape = CircleShape, color = if (isListening) Color(0xFFef4444).copy(alpha = 0.2f) else Color(0xFF0ea5e9).copy(alpha = 0.15f),
                modifier = Modifier.size(120.dp),
                onClick = {
                    isListening = !isListening
                    if (isListening) {
                        transcript = "How can I create an engaging lesson plan for Class 10 Science?"
                        response = "Here's a sample lesson plan structure:\n\n1. Warm-up (5 min): Quick review quiz\n2. Introduction (10 min): Real-world connection\n3. Core Lesson (20 min): Concept explanation with examples\n4. Activity (15 min): Group problem-solving\n5. Summary (5 min): Key takeaways\n6. Assignment: Practice problems"
                    }
                }
            ) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Icon(
                        if (isListening) Icons.Filled.Mic else Icons.Filled.MicOff,
                        null,
                        tint = if (isListening) Color(0xFFef4444) else Color(0xFF0ea5e9),
                        modifier = Modifier.size(48.dp)
                    )
                }
            }
            Spacer(Modifier.height(16.dp))
            Text(if (isListening) "Listening..." else "Tap to speak", fontSize = 16.sp, color = Color(0xFF94a3b8))
            Spacer(Modifier.height(20.dp))

            if (transcript.isNotEmpty()) {
                Card(Modifier.fillMaxWidth().padding(horizontal = 20.dp), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0ea5e9).copy(alpha = 0.1f))) {
                    Text(transcript, modifier = Modifier.padding(16.dp), fontSize = 14.sp, color = Color(0xFF7dd3fc))
                }
            }
            if (response.isNotEmpty()) {
                Spacer(Modifier.height(12.dp))
                Card(Modifier.fillMaxWidth().padding(horizontal = 20.dp), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF0c1f35))) {
                    Text(response, modifier = Modifier.padding(16.dp), fontSize = 14.sp, color = Color(0xFFe2e8f0), lineHeight = 20.sp)
                }
            }
        }
    }
}
