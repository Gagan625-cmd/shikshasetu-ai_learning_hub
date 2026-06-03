package com.rork.shikshasetu.ui.screens.student

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.shikshasetu.models.ChatMessage
import com.rork.shikshasetu.models.Contact
import com.rork.shikshasetu.models.Conversation
import com.rork.shikshasetu.services.AuthService
import com.rork.shikshasetu.services.SupabaseService
import kotlinx.coroutines.launch
import org.koin.compose.koinInject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentMessagesScreen(
    onChatClick: (String, String, String) -> Unit,
    onBack: () -> Unit,
    authService: AuthService = koinInject(),
    supabaseService: SupabaseService = koinInject()
) {
    MessagesContent(
        userRole = "student",
        onChatClick = onChatClick,
        onBack = onBack,
        authService = authService,
        supabaseService = supabaseService
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeacherMessagesScreen(
    onChatClick: (String, String, String) -> Unit,
    onBack: () -> Unit,
    authService: AuthService = koinInject(),
    supabaseService: SupabaseService = koinInject()
) {
    MessagesContent(
        userRole = "teacher",
        onChatClick = onChatClick,
        onBack = onBack,
        authService = authService,
        supabaseService = supabaseService
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MessagesContent(
    userRole: String,
    onChatClick: (String, String, String) -> Unit,
    onBack: () -> Unit,
    authService: AuthService,
    supabaseService: SupabaseService
) {
    val user by authService.user.collectAsState()
    var messages by remember { mutableStateOf<List<ChatMessage>>(emptyList()) }
    var contacts by remember { mutableStateOf<List<Contact>>(emptyList()) }
    var conversations by remember { mutableStateOf<List<Conversation>>(emptyList()) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        contacts = supabaseService.getContacts()
        scope.launch {
            user?.email?.let {
                supabaseService.getStudents().let { s ->
                    supabaseService.getTeachers().let { t ->
                        messages = supabaseService.getMessages(it)
                    }
                }
            }
        }
    }

    // Register as contact
    LaunchedEffect(user) {
        user?.let {
            supabaseService.registerContact(it.email, it.name, userRole)
        }
    }

    // Build conversations from messages
    LaunchedEffect(messages, user) {
        val u = user ?: return@LaunchedEffect
        val convMap = mutableMapOf<String, Conversation>()
        for (msg in messages.filter { it.senderId == u.email || it.receiverId == u.email }) {
            val partnerId = if (msg.senderId == u.email) msg.receiverId else msg.senderId
            val partnerName = if (msg.senderId == u.email) msg.receiverName else msg.senderName
            val partnerRole = if (msg.senderId == u.email) {
                if (msg.senderRole == "student") "teacher" else "student"
            } else msg.senderRole

            val existing = convMap[partnerId]
            val isUnread = msg.receiverId == u.email && !msg.read

            if (existing == null || msg.timestamp > existing.lastMessageTime) {
                convMap[partnerId] = Conversation(
                    id = partnerId,
                    participantId = partnerId,
                    participantName = partnerName,
                    participantRole = partnerRole,
                    lastMessage = msg.text,
                    lastMessageTime = msg.timestamp,
                    unreadCount = if (isUnread) 1 else 0
                )
            } else if (isUnread) {
                convMap[partnerId] = existing.copy(unreadCount = existing.unreadCount + 1)
            }
        }
        conversations = convMap.values.sortedByDescending { it.lastMessageTime }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Messages", color = Color.White) },
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
        if (conversations.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Outlined.Chat, null, tint = Color(0xFF475569), modifier = Modifier.size(64.dp))
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("No messages yet", fontSize = 18.sp, color = Color(0xFF94a3b8))
                    Text("Connect with other students and teachers!", fontSize = 14.sp, color = Color(0xFF64748b))
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
            ) {
                conversations.forEach { conv ->
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        color = Color.Transparent,
                        onClick = {
                            onChatClick(conv.participantId, conv.participantName, conv.participantRole)
                        }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                modifier = Modifier.size(48.dp),
                                shape = RoundedCornerShape(14.dp),
                                color = Color(0xFF0ea5e9).copy(alpha = 0.15f)
                            ) {
                                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                                    Icon(Icons.Filled.Person, null, tint = Color(0xFF0ea5e9))
                                }
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(conv.participantName, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    if (conv.unreadCount > 0) {
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Surface(
                                            shape = RoundedCornerShape(10.dp),
                                            color = Color(0xFF0ea5e9)
                                        ) {
                                            Text(
                                                "${conv.unreadCount}",
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color.White
                                            )
                                        }
                                    }
                                }
                                Text(conv.lastMessage, fontSize = 14.sp, color = Color(0xFF94a3b8), maxLines = 1)
                            }
                        }
                    }
                    HorizontalDivider(color = Color(0xFF1e293b))
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    contactEmail: String,
    contactName: String,
    contactRole: String,
    userRole: String,
    onBack: () -> Unit,
    authService: AuthService = koinInject(),
    supabaseService: SupabaseService = koinInject()
) {
    val user by authService.user.collectAsState()
    var allMessages by remember { mutableStateOf<List<ChatMessage>>(emptyList()) }
    var text by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        user?.email?.let {
            allMessages = supabaseService.getMessages(it)
        }
    }

    val conversationMessages = allMessages.filter {
        (it.senderId == user?.email && it.receiverId == contactEmail) ||
                (it.senderId == contactEmail && it.receiverId == user?.email)
    }.sortedBy { it.timestamp }

    // Mark as read
    LaunchedEffect(conversationMessages) {
        val unreadIds = conversationMessages
            .filter { it.senderId == contactEmail && it.receiverId == user?.email && !it.read }
            .map { it.id }
        if (unreadIds.isNotEmpty()) {
            supabaseService.markMessagesRead(unreadIds)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(contactName, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Text(contactRole, color = Color(0xFF64748b), fontSize = 12.sp)
                    }
                },
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
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            Column(
                modifier = Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(12.dp)
            ) {
                conversationMessages.forEach { msg ->
                    val isMine = msg.senderId == user?.email
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        horizontalAlignment = if (isMine) Alignment.End else Alignment.Start
                    ) {
                        Surface(
                            shape = RoundedCornerShape(
                                topStart = 16.dp, topEnd = 16.dp,
                                bottomStart = if (isMine) 16.dp else 4.dp,
                                bottomEnd = if (isMine) 4.dp else 16.dp
                            ),
                            color = if (isMine) Color(0xFF0ea5e9) else Color(0xFF1e293b)
                        ) {
                            Text(msg.text, modifier = Modifier.padding(12.dp), color = Color.White, fontSize = 15.sp)
                        }
                    }
                }
            }

            Surface(color = Color(0xFF0c1f35)) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = text,
                        onValueChange = { text = it },
                        placeholder = { Text("Type a message...", color = Color(0xFF64748b)) },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        colors = darkFieldColors(),
                        shape = RoundedCornerShape(24.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    IconButton(
                        onClick = {
                            if (text.isNotBlank()) {
                                val msg = ChatMessage(
                                    id = System.currentTimeMillis().toString(),
                                    senderId = user?.email ?: "",
                                    senderName = user?.name ?: "",
                                    senderRole = userRole,
                                    receiverId = contactEmail,
                                    receiverName = contactName,
                                    text = text,
                                    timestamp = System.currentTimeMillis()
                                )
                                scope.launch {
                                    supabaseService.sendMessage(msg)
                                    allMessages = allMessages + msg
                                }
                                text = ""
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
