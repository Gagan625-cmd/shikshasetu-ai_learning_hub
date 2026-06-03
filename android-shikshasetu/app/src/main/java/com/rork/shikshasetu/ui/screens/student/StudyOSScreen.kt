package com.rork.shikshasetu.ui.screens.student

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

data class OsTaskItem(
    val title: String,
    val subject: String,
    val time: String,
    val priority: String,
    val color: Color
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudyOSScreen(
    onBack: () -> Unit,
    appService: AppService = koinInject()
) {
    val todayTasks = listOf(
        OsTaskItem("Quadratic Equations", "Mathematics", "30 min", "High", Color(0xFF3b82f6)),
        OsTaskItem("Chemical Reactions", "Science", "25 min", "High", Color(0xFF10b981)),
        OsTaskItem("Letter Writing", "English", "20 min", "Medium", Color(0xFF8b5cf6)),
        OsTaskItem("French Revolution", "Social Science", "20 min", "Medium", Color(0xFFf59e0b)),
        OsTaskItem("Samas Practice", "Hindi", "15 min", "Low", Color(0xFFef4444))
    )

    var selectedTab by remember { mutableStateOf(0) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Study OS", color = Color.White) },
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
        ) {
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = Color(0xFF0c1f35),
                contentColor = Color(0xFF0ea5e9)
            ) {
                Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }) {
                    Text("Today Plan", modifier = Modifier.padding(12.dp), fontSize = 14.sp)
                }
                Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }) {
                    Text("Pending", modifier = Modifier.padding(12.dp), fontSize = 14.sp)
                }
                Tab(selected = selectedTab == 2, onClick = { selectedTab = 2 }) {
                    Text("Completed", modifier = Modifier.padding(12.dp), fontSize = 14.sp)
                }
            }

            when (selectedTab) {
                0 -> TodayPlanTab(todayTasks)
                1 -> PendingTab()
                2 -> CompletedTab()
            }
        }
    }
}

@Composable
private fun TodayPlanTab(tasks: List<OsTaskItem>) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            color = Color(0xFF0c1f35)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text("Today's Progress", fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                Spacer(modifier = Modifier.height(12.dp))
                LinearProgressIndicator(
                    progress = { 0.4f },
                    modifier = Modifier.fillMaxWidth(),
                    color = Color(0xFF0ea5e9),
                    trackColor = Color(0xFF1e3a5f),
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text("2/5 tasks completed · 55 min studied", fontSize = 13.sp, color = Color(0xFF64748b))
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text("AI-Generated Plan", fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFFe2e8f0))

        Spacer(modifier = Modifier.height(12.dp))

        tasks.forEachIndexed { idx, task ->
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                shape = RoundedCornerShape(16.dp),
                color = task.color.copy(alpha = 0.08f)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = idx < 2,
                        onCheckedChange = {},
                        colors = CheckboxDefaults.colors(
                            checkedColor = Color(0xFF10b981),
                            checkmarkColor = Color.White
                        )
                    )
                    Column(modifier = Modifier.weight(1f)) {
                        Text(task.title, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color(0xFFe2e8f0))
                        Text(task.subject, fontSize = 13.sp, color = Color(0xFF94a3b8))
                    }
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = task.color.copy(alpha = 0.2f)
                    ) {
                        Text(
                            task.time,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = task.color
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PendingTab() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(Icons.Filled.HourglassEmpty, null, tint = Color(0xFF475569), modifier = Modifier.size(48.dp))
            Spacer(modifier = Modifier.height(12.dp))
            Text("No pending tasks", fontSize = 16.sp, color = Color(0xFF64748b))
        }
    }
}

@Composable
private fun CompletedTab() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(Icons.Filled.CheckCircle, null, tint = Color(0xFF10b981), modifier = Modifier.size(48.dp))
            Spacer(modifier = Modifier.height(12.dp))
            Text("Completed tasks will appear here", fontSize = 16.sp, color = Color(0xFF64748b))
        }
    }
}
