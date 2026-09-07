package com.rork.shikshasetu.ui.screens.student

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.shikshasetu.data.StudyData
import com.rork.shikshasetu.models.OnboardingData
import com.rork.shikshasetu.models.StudyPlan
import com.rork.shikshasetu.services.AppService
import com.rork.shikshasetu.services.AuthService
import com.rork.shikshasetu.ui.components.GradientBackground
import com.rork.shikshasetu.ui.components.GradientBorderCard
import com.rork.shikshasetu.ui.components.GradientStatCard
import com.rork.shikshasetu.ui.components.Gradients
import com.rork.shikshasetu.ui.components.entrance
import com.rork.shikshasetu.ui.components.pressableScale
import com.rork.shikshasetu.ui.theme.AppColors
import org.koin.compose.koinInject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentDashboardScreen(
    onNavigate: (String) -> Unit,
    authService: AuthService = koinInject(),
    appService: AppService = koinInject()
) {
    val user by authService.user.collectAsState()
    val progress by appService.userProgress.collectAsState()
    val onboardingData = remember { appService.getOnboardingData() }

    val quote = remember { StudyData.getDailyQuote() }
    val plans = remember(onboardingData?.board, onboardingData?.className) {
        StudyData.getDailyStudyPlan(onboardingData?.board, onboardingData?.className)
    }
    val updates = remember { StudyData.getDailyUpdates() }
    val tips = remember { StudyData.getDailyTips() }
    val displayName = if (user?.isGuest == true) "Guest" else (user?.name ?: "User")

    val aiRemaining = appService.aiRemaining
    val aiLimit = appService.aiDailyLimit

    GradientBackground {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Hi, $displayName", fontWeight = FontWeight.Bold)
                        Text(" \uD83D\uDC4B", fontSize = 20.sp)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Transparent,
                    titleContentColor = Color.White
                ),
                actions = {
                    // AI usage badge
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = if (aiRemaining <= 1) Color(0xFFef4444).copy(alpha = 0.2f)
                        else Color(0xFF0ea5e9).copy(alpha = 0.15f)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "\u2728",
                                fontSize = 12.sp
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                "$aiRemaining/$aiLimit",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (aiRemaining <= 1) Color(0xFFfca5a5)
                                else Color(0xFF7dd3fc)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    // Profile
                    Surface(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape),
                        color = Color(0xFF0ea5e9).copy(alpha = 0.2f),
                        onClick = { onNavigate("teacher/about") }
                    ) {
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                            Icon(Icons.Filled.Person, null, tint = Color(0xFF0ea5e9),
                                modifier = Modifier.size(20.dp))
                        }
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                }
            )
        },
        containerColor = Color.Transparent
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
        ) {
            // XP & Streak bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    modifier = Modifier.weight(1f),
                    icon = Icons.Filled.Star,
                    label = "XP",
                    value = "${progress.totalXP}",
                    color = Color(0xFFf59e0b),
                    index = 0
                )
                StatCard(
                    modifier = Modifier.weight(1f),
                    icon = Icons.Filled.LocalFireDepartment,
                    label = "Streak",
                    value = "${progress.currentStreak}d",
                    color = Color(0xFFff6b35),
                    index = 1
                )
                StatCard(
                    modifier = Modifier.weight(1f),
                    icon = Icons.Filled.Timer,
                    label = "Study Time",
                    value = "${progress.totalStudyTime}m",
                    color = Color(0xFF0ea5e9),
                    index = 2
                )
            }

            // Daily Quote
            QuoteCard(quote.text, quote.author)

            // Quick Actions Grid
            Text(
                "Quick Actions",
                fontSize = 18.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color(0xFFe2e8f0),
                modifier = Modifier.padding(bottom = 12.dp)
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                QuickActionButton(
                    modifier = Modifier.weight(1f),
                    icon = Icons.Filled.MenuBook,
                    label = "NCERT",
                    color = Color(0xFF3b82f6),
                    onClick = { onNavigate("student/content") }
                )
                QuickActionButton(
                    modifier = Modifier.weight(1f),
                    icon = Icons.Filled.School,
                    label = "ICSE",
                    color = Color(0xFF8b5cf6),
                    onClick = { onNavigate("student/icse") }
                )
                QuickActionButton(
                    modifier = Modifier.weight(1f),
                    icon = Icons.Filled.Quiz,
                    label = "Quiz",
                    color = Color(0xFF10b981),
                    onClick = { onNavigate("student/content") }
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                QuickActionButton(
                    modifier = Modifier.weight(1f),
                    icon = Icons.Filled.Chat,
                    label = "Messages",
                    color = Color(0xFF06b6d4),
                    onClick = { onNavigate("student/messages") }
                )
                QuickActionButton(
                    modifier = Modifier.weight(1f),
                    icon = Icons.Filled.Groups,
                    label = "Study Rooms",
                    color = Color(0xFF14b8a6),
                    onClick = { onNavigate("student/study-rooms") }
                )
                QuickActionButton(
                    modifier = Modifier.weight(1f),
                    icon = Icons.Filled.VideogameAsset,
                    label = "Games",
                    color = Color(0xFFec4899),
                    onClick = { onNavigate("student/fun-learning") }
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Study Plan
            StudyPlanSection(plans, onboardingData)

            Spacer(modifier = Modifier.height(16.dp))

            // Daily Updates
            DailyUpdateSection(updates)

            Spacer(modifier = Modifier.height(16.dp))

            // Study Tips
            StudyTipsSection(tips)

            Spacer(modifier = Modifier.height(8.dp))

            // More actions row 1
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                SmallActionChip(Icons.Filled.CalendarMonth, "Timetable") { onNavigate("student/timetable") }
                SmallActionChip(Icons.Filled.AutoAwesome, "Generate") { onNavigate("student/generate") }
                SmallActionChip(Icons.Filled.Analytics, "Performance") { onNavigate("student/performance") }
                SmallActionChip(Icons.Filled.Bolt, "Quick Revise") { onNavigate("student/quick-revision") }
            }

            // More actions row 2
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                SmallActionChip(Icons.Filled.Style, "Flashcards") { onNavigate("student/flashcards") }
                SmallActionChip(Icons.Filled.Functions, "Formulas") { onNavigate("student/formula-sheet") }
                SmallActionChip(Icons.Filled.Draw, "Notes") { onNavigate("student/handwritten-notes") }
                SmallActionChip(Icons.Filled.EmojiEmotions, "Comic") { onNavigate("student/comic-learn") }
            }

            // More actions row 3
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                SmallActionChip(Icons.Filled.EmojiEvents, "Compete") { onNavigate("student/competition") }
                SmallActionChip(Icons.Filled.Link, "Links") { onNavigate("student/useful-links") }
                SmallActionChip(Icons.Filled.Warning, "Weak Areas") { onNavigate("student/weak-topics") }
                SmallActionChip(Icons.Filled.Scanner, "Exam Scan") { onNavigate("student/exam-scanner") }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
    }
}

@Composable
private fun StatCard(
    modifier: Modifier = Modifier,
    icon: ImageVector,
    label: String,
    value: String,
    color: Color,
    index: Int = 0
) {
    Box(modifier.entrance(index)) {
        GradientStatCard(
            icon = { Icon(icon, null, tint = color, modifier = Modifier.size(20.dp)) },
            value = value,
            label = label,
            tint = color
        )
    }
}

@Composable
private fun QuoteCard(text: String, author: String) {
    GradientBorderCard(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 20.dp)
            .entrance(3),
        borderBrush = Gradients.of(Color(0xFFff6b35).copy(alpha = 0.6f), Color(0xFF0ea5e9).copy(alpha = 0.6f))
    ) {
        Column(modifier = Modifier.padding(22.dp)) {
            Text(
                "\u201C$text\u201D",
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFFcaf0f8),
                lineHeight = 23.sp,
                fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
            )
            Spacer(modifier = Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .width(24.dp)
                        .height(2.dp)
                        .background(Color(0xFFff9f1c))
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    author,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFff9f1c)
                )
            }
        }
    }
}

@Composable
private fun QuickActionButton(
    modifier: Modifier = Modifier,
    icon: ImageVector,
    label: String,
    color: Color,
    onClick: () -> Unit
) {
    Surface(
        modifier = modifier.pressableScale(),
        shape = RoundedCornerShape(18.dp),
        color = Color(0xFF0c1f35),
        onClick = onClick
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(Gradients.of(color.copy(alpha = 0.28f), color.copy(alpha = 0.08f))),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, null, tint = color, modifier = Modifier.size(24.dp))
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(label, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFFe2e8f0))
        }
    }
}

@Composable
private fun StudyPlanSection(plans: List<StudyPlan>, onboardingData: OnboardingData?) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        color = Color(0xFF0c1f35)
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    modifier = Modifier.size(32.dp),
                    shape = RoundedCornerShape(10.dp),
                    color = Color(0xFF0ea5e9)
                ) {
                    Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                        Icon(Icons.Filled.CheckCircle, null, tint = Color.White,
                            modifier = Modifier.size(16.dp))
                    }
                }
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    "What to Study Today",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFFe2e8f0),
                    modifier = Modifier.weight(1f)
                )
                if (onboardingData != null) {
                    val countdown = StudyData.getExamCountdown(onboardingData.examDate)
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = Color(0xFF0ea5e9).copy(alpha = 0.15f)
                    ) {
                        Text(
                            if (countdown != null) "$countdown" else "${onboardingData.board} · ${onboardingData.className}",
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF0ea5e9)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            plans.forEach { plan ->
                val planColor = try {
                    Color(android.graphics.Color.parseColor(plan.color))
                } catch (_: Exception) { Color(0xFF3b82f6) }

                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    shape = RoundedCornerShape(14.dp),
                    color = planColor.copy(alpha = 0.08f)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(plan.icon, fontSize = 22.sp)
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(plan.subject,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFe2e8f0))
                            Text(plan.topic,
                                fontSize = 12.sp,
                                color = Color(0xFF94a3b8))
                        }
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = planColor.copy(alpha = 0.2f)
                        ) {
                            Text(
                                plan.duration,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = planColor
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DailyUpdateSection(updates: List<StudyData.DailyUpdate>) {
    Column {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Surface(
                modifier = Modifier.size(28.dp),
                shape = RoundedCornerShape(9.dp),
                color = Color(0xFFf59e0b)
            ) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                    Icon(Icons.Filled.Notifications, null, tint = Color.White,
                        modifier = Modifier.size(14.dp))
                }
            }
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                "Daily Updates",
                fontSize = 17.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color(0xFFfbbf24),
                modifier = Modifier.weight(1f)
            )
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = Color(0xFFef4444).copy(alpha = 0.12f)
            ) {
                Text(
                    "NEW",
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFFef4444)
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        updates.forEach { update ->
            val updateColor = try {
                Color(android.graphics.Color.parseColor(update.color))
            } catch (_: Exception) { Color(0xFF0ea5e9) }

            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                shape = RoundedCornerShape(16.dp),
                color = updateColor.copy(alpha = 0.06f)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Surface(
                        modifier = Modifier.size(38.dp),
                        shape = RoundedCornerShape(12.dp),
                        color = updateColor.copy(alpha = 0.15f)
                    ) {
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                            val emoji = when (update.type) {
                                "tip" -> "\uD83D\uDCA1"
                                "motivation" -> "\uD83D\uDD25"
                                "reminder" -> "\uD83D\uDD14"
                                "fact" -> "\uD83D\uDCCC"
                                else -> "\uD83D\uDCA1"
                            }
                            Text(emoji, fontSize = 18.sp)
                        }
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            update.title,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFe2e8f0)
                        )
                        Text(
                            update.message,
                            fontSize = 13.sp,
                            color = Color(0xFF94a3b8),
                            lineHeight = 19.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun StudyTipsSection(tips: List<StudyData.StudyTip>) {
    Column {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Surface(
                modifier = Modifier.size(28.dp),
                shape = RoundedCornerShape(9.dp),
                color = Color(0xFF10b981)
            ) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                    Icon(Icons.Filled.Lightbulb, null, tint = Color.White,
                        modifier = Modifier.size(14.dp))
                }
            }
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                "Today's Study Tips",
                fontSize = 17.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color(0xFF7dd3fc),
                modifier = Modifier.weight(1f)
            )
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = Color(0xFF10b981).copy(alpha = 0.15f)
            ) {
                Text(
                    "DAILY",
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF10b981)
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        tips.forEach { tip ->
            val tipColor = try {
                Color(android.graphics.Color.parseColor(tip.color))
            } catch (_: Exception) { Color(0xFF8b5cf6) }

            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                shape = RoundedCornerShape(16.dp),
                color = tipColor.copy(alpha = 0.06f)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Surface(
                        modifier = Modifier.size(38.dp),
                        shape = RoundedCornerShape(12.dp),
                        color = tipColor.copy(alpha = 0.15f)
                    ) {
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                            Text(tip.iconEmoji, fontSize = 18.sp)
                        }
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            tip.title,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFe2e8f0)
                        )
                        Text(
                            tip.tip,
                            fontSize = 13.sp,
                            color = Color(0xFF94a3b8),
                            lineHeight = 19.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SmallActionChip(icon: ImageVector, label: String, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.height(36.dp).pressableScale(),
        shape = RoundedCornerShape(10.dp),
        color = Color(0xFF0c1f35),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, null, tint = Color(0xFF0ea5e9), modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text(label, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF94a3b8))
        }
    }
}
