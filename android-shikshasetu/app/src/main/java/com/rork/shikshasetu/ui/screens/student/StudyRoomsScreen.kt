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
import com.rork.shikshasetu.models.StudyRoom
import com.rork.shikshasetu.models.StudyRoomMember
import com.rork.shikshasetu.models.StudyRoomMessage
import com.rork.shikshasetu.services.AuthService
import com.rork.shikshasetu.services.SupabaseService
import kotlinx.coroutines.launch
import org.koin.compose.koinInject
import kotlin.random.Random

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudyRoomsScreen(
    onBack: () -> Unit,
    authService: AuthService = koinInject(),
    supabaseService: SupabaseService = koinInject()
) {
    val user by authService.user.collectAsState()
    var rooms by remember { mutableStateOf<List<StudyRoom>>(emptyList()) }
    var showCreateDialog by remember { mutableStateOf(false) }
    var showJoinDialog by remember { mutableStateOf(false) }
    var selectedRoom by remember { mutableStateOf<StudyRoom?>(null) }
    var roomName by remember { mutableStateOf("") }
    var joinCode by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        rooms = supabaseService.getStudyRooms()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Study Rooms", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, null, tint = Color.White)
                    }
                },
                actions = {
                    IconButton(onClick = { showCreateDialog = true }) {
                        Icon(Icons.Filled.Add, null, tint = Color(0xFF0ea5e9))
                    }
                    IconButton(onClick = { showJoinDialog = true }) {
                        Icon(Icons.Filled.GroupAdd, null, tint = Color(0xFF10b981))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628))
            )
        },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        if (selectedRoom != null) {
            RoomDetailScreen(
                room = selectedRoom!!,
                userEmail = user?.email ?: "",
                userName = user?.name ?: "User",
                onBack = { selectedRoom = null },
                supabaseService = supabaseService
            )
        } else if (rooms.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Filled.Groups, null, tint = Color(0xFF475569), modifier = Modifier.size(64.dp))
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("No study rooms yet", fontSize = 18.sp, color = Color(0xFF94a3b8))
                    Text("Create or join a room to start!", fontSize = 14.sp, color = Color(0xFF64748b))
                    Spacer(modifier = Modifier.height(20.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Button(
                            onClick = { showCreateDialog = true },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0ea5e9))
                        ) { Text("Create Room") }
                        OutlinedButton(onClick = { showJoinDialog = true }) { Text("Join Room") }
                    }
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp)
            ) {
                rooms.forEach { room ->
                    Surface(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                        shape = RoundedCornerShape(18.dp),
                        color = Color(0xFF0c1f35),
                        onClick = { selectedRoom = room }
                    ) {
                        Row(
                            modifier = Modifier.padding(18.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                modifier = Modifier.size(48.dp),
                                shape = RoundedCornerShape(14.dp),
                                color = Color(0xFF0ea5e9).copy(alpha = 0.15f)
                            ) {
                                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                                    Icon(Icons.Filled.Groups, null, tint = Color(0xFF0ea5e9), modifier = Modifier.size(24.dp))
                                }
                            }
                            Spacer(modifier = Modifier.width(14.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(room.name, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFFe2e8f0))
                                Text("Code: ${room.code}", fontSize = 13.sp, color = Color(0xFF64748b))
                            }
                            Icon(Icons.Filled.ChevronRight, null, tint = Color(0xFF475569))
                        }
                    }
                }
            }
        }
    }

    // Create room dialog
    if (showCreateDialog) {
        AlertDialog(
            onDismissRequest = { showCreateDialog = false },
            containerColor = Color(0xFF0f172a),
            title = { Text("Create Study Room", color = Color.White, fontWeight = FontWeight.Bold) },
            text = {
                OutlinedTextField(
                    value = roomName,
                    onValueChange = { roomName = it },
                    label = { Text("Room Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = darkFieldColors()
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        val code = (100000..999999).random().toString()
                        val id = System.currentTimeMillis().toString()
                        val room = StudyRoom(
                            id = id,
                            name = roomName,
                            code = code,
                            createdBy = user?.email ?: "",
                            createdByName = user?.name ?: "User"
                        )
                        scope.launch {
                            supabaseService.createStudyRoom(room)
                            supabaseService.joinRoom(id, user?.email ?: "", user?.name ?: "User")
                            rooms = supabaseService.getStudyRooms()
                        }
                        showCreateDialog = false
                        roomName = ""
                    },
                    enabled = roomName.isNotBlank()
                ) { Text("Create") }
            },
            dismissButton = {
                TextButton(onClick = { showCreateDialog = false }) {
                    Text("Cancel", color = Color(0xFF94a3b8))
                }
            }
        )
    }

    // Join room dialog
    if (showJoinDialog) {
        AlertDialog(
            onDismissRequest = { showJoinDialog = false },
            containerColor = Color(0xFF0f172a),
            title = { Text("Join Study Room", color = Color.White, fontWeight = FontWeight.Bold) },
            text = {
                OutlinedTextField(
                    value = joinCode,
                    onValueChange = { joinCode = it },
                    label = { Text("6-digit Room Code") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = darkFieldColors()
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        scope.launch {
                            val allRooms = supabaseService.getStudyRooms()
                            val room = allRooms.find { it.code == joinCode }
                            if (room != null) {
                                supabaseService.joinRoom(room.id, user?.email ?: "", user?.name ?: "User")
                                rooms = supabaseService.getStudyRooms()
                            }
                        }
                        showJoinDialog = false
                        joinCode = ""
                    }
                ) { Text("Join") }
            },
            dismissButton = {
                TextButton(onClick = { showJoinDialog = false }) {
                    Text("Cancel", color = Color(0xFF94a3b8))
                }
            }
        )
    }
}

@Composable
private fun RoomDetailScreen(
    room: StudyRoom,
    userEmail: String,
    userName: String,
    onBack: () -> Unit,
    supabaseService: SupabaseService
) {
    var message by remember { mutableStateOf("") }
    var roomMessages by remember { mutableStateOf<List<StudyRoomMessage>>(emptyList()) }
    var members by remember { mutableStateOf<List<StudyRoomMember>>(emptyList()) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(room.id) {
        roomMessages = supabaseService.getRoomMessages(room.id)
        members = supabaseService.getRoomMembers(room.id)
    }

    Column(modifier = Modifier.fillMaxSize().background(Color(0xFF0a1628))) {
        // Header
        Surface(color = Color(0xFF0c1f35)) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, null, tint = Color.White)
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(room.name, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text("Code: ${room.code} · ${members.size} members", fontSize = 13.sp, color = Color(0xFF64748b))
                    }
                }
            }
        }

        // Messages
        Column(
            modifier = Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(12.dp)
        ) {
            roomMessages.forEach { msg ->
                val isMine = msg.senderId == userEmail
                Column(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    horizontalAlignment = if (isMine) Alignment.End else Alignment.Start
                ) {
                    if (!isMine) {
                        Text(msg.senderName, fontSize = 12.sp, color = Color(0xFF64748b), modifier = Modifier.padding(start = 8.dp))
                    }
                    Surface(
                        shape = RoundedCornerShape(
                            topStart = 16.dp,
                            topEnd = 16.dp,
                            bottomStart = if (isMine) 16.dp else 4.dp,
                            bottomEnd = if (isMine) 4.dp else 16.dp
                        ),
                        color = if (isMine) Color(0xFF0ea5e9) else Color(0xFF1e293b)
                    ) {
                        Text(
                            msg.text,
                            modifier = Modifier.padding(12.dp),
                            color = Color.White,
                            fontSize = 15.sp
                        )
                    }
                }
            }
        }

        // Input
        Surface(color = Color(0xFF0c1f35)) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = message,
                    onValueChange = { message = it },
                    placeholder = { Text("Type a message...", color = Color(0xFF64748b)) },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    colors = darkFieldColors(),
                    shape = RoundedCornerShape(24.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                IconButton(
                    onClick = {
                        if (message.isNotBlank()) {
                            val msg = StudyRoomMessage(
                                id = System.currentTimeMillis().toString(),
                                roomId = room.id,
                                senderId = userEmail,
                                senderName = userName,
                                text = message
                            )
                            scope.launch {
                                supabaseService.sendRoomMessage(msg)
                                roomMessages = roomMessages + msg
                            }
                            message = ""
                        }
                    },
                    modifier = Modifier.size(48.dp)
                ) {
                    Surface(
                        modifier = Modifier.fillMaxSize(),
                        shape = RoundedCornerShape(14.dp),
                        color = Color(0xFF0ea5e9)
                    ) {
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                            Icon(Icons.Filled.Send, null, tint = Color.White, modifier = Modifier.size(20.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun darkFieldColors(): TextFieldColors {
    return OutlinedTextFieldDefaults.colors(
        focusedTextColor = Color(0xFFf1f5f9),
        unfocusedTextColor = Color(0xFFf1f5f9),
        focusedBorderColor = Color(0xFF0ea5e9),
        unfocusedBorderColor = Color(0xFF334155),
        cursorColor = Color(0xFF0ea5e9),
        focusedLabelColor = Color(0xFF0ea5e9),
        unfocusedLabelColor = Color(0xFF64748b),
        focusedContainerColor = Color(0xFF1e293b).copy(alpha = 0.8f),
        unfocusedContainerColor = Color(0xFF1e293b).copy(alpha = 0.8f)
    )
}
