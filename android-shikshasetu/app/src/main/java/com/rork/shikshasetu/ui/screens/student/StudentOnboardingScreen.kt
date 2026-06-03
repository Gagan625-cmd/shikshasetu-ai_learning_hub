package com.rork.shikshasetu.ui.screens.student

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.shikshasetu.models.OnboardingData
import com.rork.shikshasetu.services.AppService
import org.koin.compose.koinInject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentOnboardingScreen(
    onComplete: () -> Unit,
    appService: AppService = koinInject()
) {
    var board by remember { mutableStateOf("") }
    var className by remember { mutableStateOf("") }
    var examDate by remember { mutableStateOf("") }

    val boards = listOf("CBSE", "ICSE", "State Board")
    val classes = listOf("8", "9", "10", "11", "12")
    val examOptions = listOf(
        "weekly" to "Weekly Test",
        "monthly" to "Monthly Exam",
        "3months" to "3 Months",
        "board" to "Board Exams"
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Set Up Your Profile", color = Color.White) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0a1628)
                )
            )
        },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp)
        ) {
            Text(
                "Tell us about your studies",
                fontSize = 16.sp,
                color = Color(0xFF94a3b8)
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Board selection
            Text("Select Board", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFFe2e8f0))
            Spacer(modifier = Modifier.height(12.dp))
            boards.forEach { b ->
                val selected = board == b
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    shape = RoundedCornerShape(16.dp),
                    color = if (selected) Color(0xFF0ea5e9).copy(alpha = 0.15f) else Color(0xFF0c1f35),
                    onClick = { board = b }
                ) {
                    Text(
                        b,
                        modifier = Modifier.padding(16.dp),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (selected) Color(0xFF0ea5e9) else Color(0xFF94a3b8)
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Class selection
            Text("Select Class", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFFe2e8f0))
            Spacer(modifier = Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                classes.forEach { c ->
                    val selected = className == c
                    FilterChip(
                        selected = selected,
                        onClick = { className = c },
                        label = { Text("Class $c") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Color(0xFF0ea5e9),
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Exam date
            Text("When is your next exam?", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFFe2e8f0))
            Spacer(modifier = Modifier.height(12.dp))
            examOptions.forEach { (id, label) ->
                val selected = examDate == id
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    shape = RoundedCornerShape(16.dp),
                    color = if (selected) Color(0xFF10b981).copy(alpha = 0.15f) else Color(0xFF0c1f35),
                    onClick = { examDate = id }
                ) {
                    Text(
                        label,
                        modifier = Modifier.padding(16.dp),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (selected) Color(0xFF10b981) else Color(0xFF94a3b8)
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            Button(
                onClick = {
                    val data = OnboardingData(
                        board = board,
                        className = className,
                        examDate = examDate,
                        completedAt = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
                            .format(java.util.Date())
                    )
                    appService.saveOnboardingData(data)
                    appService.saveOnboardingDone()
                    onComplete()
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = board.isNotBlank() && className.isNotBlank() && examDate.isNotBlank(),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0ea5e9))
            ) {
                Text("Continue", fontSize = 17.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}
