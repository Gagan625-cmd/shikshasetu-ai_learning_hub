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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.shikshasetu.services.AppService
import org.koin.compose.koinInject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentContentScreen(
    onBack: () -> Unit,
    appService: AppService = koinInject()
) {
    val onboardingData = remember { appService.getOnboardingData() }
    val board = onboardingData?.board ?: "NCERT"
    val grade = onboardingData?.className?.toIntOrNull() ?: 10

    val ncertSubjects = mapOf(
        8 to listOf("Mathematics", "Science", "Social Science", "English", "Hindi"),
        9 to listOf("Mathematics", "Science", "Social Science", "English", "Hindi"),
        10 to listOf("Mathematics", "Science", "Social Science", "English", "Hindi"),
        11 to listOf("Mathematics", "Physics", "Chemistry", "Biology", "English"),
        12 to listOf("Mathematics", "Physics", "Chemistry", "Biology", "English")
    )

    val subjects = ncertSubjects[grade] ?: ncertSubjects[10]!!

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("$board Class $grade", color = Color.White) },
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
            subjects.forEach { subject ->
                val color = subjectColors[subject] ?: Color(0xFF3b82f6)
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp),
                    shape = RoundedCornerShape(18.dp),
                    color = Color(0xFF0c1f35),
                    onClick = {
                        // Navigate to content/chapters for this subject
                    }
                ) {
                    Row(
                        modifier = Modifier.padding(18.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            modifier = Modifier.size(48.dp),
                            shape = RoundedCornerShape(14.dp),
                            color = color.copy(alpha = 0.15f)
                        ) {
                            Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                                Icon(Icons.Filled.MenuBook, null, tint = color, modifier = Modifier.size(24.dp))
                            }
                        }
                        Spacer(modifier = Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(subject, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFFe2e8f0))
                            Text("$board Class $grade", fontSize = 13.sp, color = Color(0xFF64748b))
                        }
                        Icon(Icons.Filled.ChevronRight, null, tint = Color(0xFF475569))
                    }
                }
            }
        }
    }
}

private val subjectColors = mapOf(
    "Mathematics" to Color(0xFF3b82f6),
    "Science" to Color(0xFF10b981),
    "Physics" to Color(0xFF3b82f6),
    "Chemistry" to Color(0xFF10b981),
    "Biology" to Color(0xFFef4444),
    "Social Science" to Color(0xFFf59e0b),
    "English" to Color(0xFF8b5cf6),
    "Hindi" to Color(0xFFef4444)
)
