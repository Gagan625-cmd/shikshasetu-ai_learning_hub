package com.rork.shikshasetu.ui.screens.welcome

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import com.rork.shikshasetu.services.AppService
import com.rork.shikshasetu.services.AuthService
import com.rork.shikshasetu.ui.theme.AppColors
import kotlinx.coroutines.launch
import org.koin.compose.koinInject

@Composable
fun WelcomeScreen(
    onRoleSelected: (String) -> Unit,
    authService: AuthService = koinInject(),
    appService: AppService = koinInject()
) {
    val user by authService.user.collectAsState()
    val scope = rememberCoroutineScope()
    val displayName = if (user?.isGuest == true) "Guest" else (user?.name ?: "User")

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF0a1628),
                        Color(0xFF0d2847),
                        Color(0xFF0e3460),
                        Color(0xFF0a2a4a)
                    )
                )
            )
    ) {
        // Decorative orbs
        Box(
            modifier = Modifier
                .size(200.dp)
                .offset(x = (-60).dp, y = 80.dp)
                .clip(CircleShape)
                .background(Color(0xFF00b4d8).copy(alpha = 0.12f))
        )
        Box(
            modifier = Modifier
                .size(160.dp)
                .offset(x = 280.dp, y = 300.dp)
                .clip(CircleShape)
                .background(Color(0xFFff6b35).copy(alpha = 0.1f))
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp, vertical = 48.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Greeting
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "Hi ",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = Color.Transparent,
                    modifier = Modifier
                        .background(
                            Brush.horizontalGradient(
                                listOf(Color(0xFFff6b35), Color(0xFFff9f1c))
                            ),
                            RoundedCornerShape(14.dp)
                        )
                        .padding(horizontal = 16.dp, vertical = 7.dp)
                ) {
                    Text(
                        displayName,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White
                    )
                }
                Text(" \uD83D\uDC4B", fontSize = 28.sp)
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                "Bridging Learning Gaps with AI",
                fontSize = 15.sp,
                color = Color(0xFF7dd3fc),
                fontWeight = FontWeight.SemiBold
            )

            Spacer(modifier = Modifier.height(40.dp))

            // Student card
            RoleCard(
                title = "Student",
                description = "NCERT content, AI learning & interviews",
                icon = Icons.Filled.School,
                gradientColors = listOf(Color(0xFF0077b6), Color(0xFF00b4d8), Color(0xFF0096c7)),
                tags = listOf("📚 NCERT", "🤖 AI Quiz", "🎮 Games"),
                onClick = {
                    scope.launch {
                        appService.selectRole("student")
                        onRoleSelected("student")
                    }
                }
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Teacher card
            RoleCard(
                title = "Teacher",
                description = "AI co-pilot, assessments & content gen",
                icon = Icons.Filled.Edit,
                gradientColors = listOf(Color(0xFFff6b35), Color(0xFFff9f1c), Color(0xFFf77f00)),
                tags = listOf("📝 Generate", "🎤 Interview", "📊 Analytics"),
                onClick = {
                    scope.launch {
                        appService.selectRole("teacher")
                        onRoleSelected("teacher")
                    }
                }
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Footer
            Surface(
                shape = RoundedCornerShape(22.dp),
                color = Color(0xFF00b4d8).copy(alpha = 0.1f),
                modifier = Modifier
                    .background(
                        Brush.horizontalGradient(
                            listOf(Color(0xFF00b4d8).copy(alpha = 0.15f), Color(0xFFff6b35).copy(alpha = 0.1f))
                        ),
                        RoundedCornerShape(22.dp)
                    )
                    .padding(horizontal = 22.dp, vertical = 12.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Star, null, tint = Color(0xFF00b4d8), modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "Made for India \uD83C\uDDEE\uD83C\uDDF3",
                        fontSize = 13.sp,
                        color = Color(0xFF7dd3fc),
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
}

@Composable
private fun RoleCard(
    title: String,
    description: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    gradientColors: List<Color>,
    tags: List<String>,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Box(
            modifier = Modifier
                .background(
                    Brush.horizontalGradient(gradientColors),
                    RoundedCornerShape(24.dp)
                )
                .padding(22.dp)
        ) {
            // Decorative circles
            Box(
                modifier = Modifier
                    .size(110.dp)
                    .offset(x = 230.dp, y = (-35).dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.1f))
            )
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .offset(x = (-20).dp, y = 60.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.07f))
            )

            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        modifier = Modifier.size(60.dp),
                        shape = RoundedCornerShape(18.dp),
                        color = Color.White.copy(alpha = 0.2f)
                    ) {
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                            Icon(icon, null, tint = Color.White, modifier = Modifier.size(30.dp))
                        }
                    }

                    Spacer(modifier = Modifier.width(14.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            title,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White
                        )
                        Text(
                            description,
                            fontSize = 14.sp,
                            color = Color.White.copy(alpha = 0.85f),
                            lineHeight = 20.sp
                        )
                    }

                    Surface(
                        modifier = Modifier.size(44.dp),
                        shape = RoundedCornerShape(14.dp),
                        color = Color.White.copy(alpha = 0.22f)
                    ) {
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                            Icon(Icons.Filled.ArrowForward, null, tint = Color.White,
                                modifier = Modifier.size(22.dp))
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    tags.forEach { tag ->
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = Color.White.copy(alpha = 0.2f)
                        ) {
                            Text(
                                tag,
                                modifier = Modifier.padding(horizontal = 11.dp, vertical = 6.dp),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }
            }
        }
    }
}
