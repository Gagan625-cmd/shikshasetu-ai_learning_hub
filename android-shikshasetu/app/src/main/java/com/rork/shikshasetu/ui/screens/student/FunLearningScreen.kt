package com.rork.shikshasetu.ui.screens.student

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.shikshasetu.services.AppService
import org.koin.compose.koinInject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunLearningScreen(
    onNavigate: (String) -> Unit,
    onBack: () -> Unit,
    appService: AppService = koinInject()
) {
    val today = remember { java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date()) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Fun & Games", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, null, tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628))
            )
        },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            Text("Today's Free Plays", fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
            Spacer(modifier = Modifier.height(16.dp))

            // 2048 Game
            GameCard(
                title = "2048",
                description = "Classic tile merging game. Reach 2048!",
                icon = Icons.Filled.GridView,
                color = Color(0xFFedcf72),
                onClick = { onNavigate("student/games/2048") }
            )

            // Memory Match
            GameCard(
                title = "Memory Match",
                description = "Flip cards and find matching pairs",
                icon = Icons.Filled.FlipToFront,
                color = Color(0xFF8b5cf6),
                onClick = { onNavigate("student/games/memory") }
            )

            Spacer(modifier = Modifier.height(20.dp))

            // GK Quiz
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                color = Color(0xFF0c1f35)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Lightbulb, null, tint = Color(0xFFf59e0b), modifier = Modifier.size(24.dp))
                        Spacer(modifier = Modifier.width(10.dp))
                        Text("GK Quiz", fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "Test your general knowledge. Score 3+ to unlock another game!",
                        fontSize = 14.sp,
                        color = Color(0xFF94a3b8)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = { onNavigate("student/gk-quiz") },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFf59e0b)),
                        shape = RoundedCornerShape(12.dp)
                    ) { Text("Start GK Quiz") }
                }
            }
        }
    }
}

@Composable
private fun GameCard(
    title: String,
    description: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        shape = RoundedCornerShape(20.dp),
        color = Color(0xFF0c1f35),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier.padding(18.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                modifier = Modifier.size(56.dp),
                shape = RoundedCornerShape(16.dp),
                color = color.copy(alpha = 0.15f)
            ) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                    Icon(icon, null, tint = color, modifier = Modifier.size(28.dp))
                }
            }
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(title, fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                Text(description, fontSize = 13.sp, color = Color(0xFF94a3b8))
            }
            Icon(Icons.Filled.PlayArrow, null, tint = color, modifier = Modifier.size(28.dp))
        }
    }
}
