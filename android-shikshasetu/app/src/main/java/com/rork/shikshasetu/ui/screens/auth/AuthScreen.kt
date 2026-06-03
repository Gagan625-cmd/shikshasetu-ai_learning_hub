package com.rork.shikshasetu.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.shikshasetu.services.AppService
import com.rork.shikshasetu.services.AuthService
import com.rork.shikshasetu.services.AuthResult
import kotlinx.coroutines.launch
import org.koin.compose.koinInject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthScreen(
    onAuthenticated: (String?) -> Unit,
    authService: AuthService = koinInject(),
    appService: AppService = koinInject()
) {
    var isSignUp by remember { mutableStateOf(false) }
    var isCodeLogin by remember { mutableStateOf(false) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var authCode by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var showAuthCodeModal by remember { mutableStateOf(false) }
    var displayedAuthCode by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    fun handleSubmit() {
        if (email.isBlank() || password.isBlank() || (isSignUp && name.isBlank())) {
            error = "Please fill in all fields"
            return
        }
        if (!email.contains("@") || !email.contains(".")) {
            error = "Please enter a valid email"
            return
        }
        if (password.length < 6) {
            error = "Password must be at least 6 characters"
            return
        }

        isLoading = true
        error = ""
        scope.launch {
            val result: AuthResult = if (isSignUp) {
                authService.signUp(email.trim(), password, name.trim())
            } else {
                authService.signIn(email.trim(), password)
            }

            isLoading = false
            if (result.success) {
                appService.reinitializeForUser()
                if (isSignUp && result.authCode != null) {
                    displayedAuthCode = result.authCode
                    showAuthCodeModal = true
                } else {
                    val role = appService.userRole.value
                    onAuthenticated(role)
                }
            } else {
                error = result.error ?: "An error occurred"
            }
        }
    }

    fun handleCodeLogin() {
        if (authCode.length != 4) {
            error = "Please enter a valid 4-digit code"
            return
        }
        isLoading = true
        error = ""
        scope.launch {
            val result = authService.signInWithCode(authCode)
            isLoading = false
            if (result.success) {
                appService.reinitializeForUser()
                val role = appService.userRole.value
                onAuthenticated(role)
            } else {
                error = result.error ?: "Invalid code"
            }
        }
    }

    fun handleGuest() {
        scope.launch {
            val result = authService.continueAsGuest()
            if (result.success) {
                appService.reinitializeForUser()
                onAuthenticated(null)
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF0a1628),
                        Color(0xFF0d2847),
                        Color(0xFF0e3460),
                        Color(0xFF0c4a6e)
                    )
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 48.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(40.dp))

            // Logo
            Box(
                modifier = Modifier
                    .size(90.dp)
                    .clip(RoundedCornerShape(28.dp))
                    .background(
                        Brush.linearGradient(
                            colors = listOf(
                                Color(0xFF0ea5e9),
                                Color(0xFF06b6d4),
                                Color(0xFF14b8a6)
                            )
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Filled.Star,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(40.dp)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Title
            Text(
                text = when {
                    isCodeLogin -> "Quick Sign In"
                    isSignUp -> "Create Account"
                    else -> "Welcome Back"
                },
                fontSize = 30.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color(0xFFf1f5f9)
            )

            Text(
                text = when {
                    isCodeLogin -> "Enter your 4-digit auth code"
                    isSignUp -> "Join the learning revolution"
                    else -> "Continue your journey"
                },
                fontSize = 15.sp,
                color = Color(0xFF94a3b8),
                modifier = Modifier.padding(top = 8.dp)
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Form
            if (isCodeLogin) {
                OutlinedTextField(
                    value = authCode,
                    onValueChange = { if (it.length <= 4) authCode = it.filter { c -> c.isDigit() } },
                    label = { Text("4-digit code") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = darkFieldColors(),
                    shape = RoundedCornerShape(16.dp),
                    leadingIcon = { Icon(Icons.Filled.Key, null, tint = Color(0xFF0ea5e9)) }
                )
            } else {
                if (isSignUp) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Full Name") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = darkFieldColors(),
                        shape = RoundedCornerShape(16.dp),
                        leadingIcon = { Icon(Icons.Filled.Person, null, tint = Color(0xFF0ea5e9)) }
                    )
                    Spacer(modifier = Modifier.height(14.dp))
                }

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Next
                    ),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = darkFieldColors(),
                    shape = RoundedCornerShape(16.dp),
                    leadingIcon = { Icon(Icons.Filled.Email, null, tint = Color(0xFF0ea5e9)) }
                )

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done
                    ),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = darkFieldColors(),
                    shape = RoundedCornerShape(16.dp),
                    leadingIcon = { Icon(Icons.Filled.Lock, null, tint = Color(0xFF0ea5e9)) }
                )
            }

            if (error.isNotBlank()) {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 14.dp),
                    color = Color(0xFFef4444).copy(alpha = 0.15f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = error,
                        color = Color(0xFFfca5a5),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Submit button
            Button(
                onClick = { if (isCodeLogin) handleCodeLogin() else handleSubmit() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                enabled = !isLoading,
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF0ea5e9)
                )
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                } else {
                    Icon(
                        if (isCodeLogin) Icons.Filled.Key else Icons.Filled.Star,
                        null,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isCodeLogin) "Sign In with Code"
                        else if (isSignUp) "Create Account" else "Sign In",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            if (!isCodeLogin) {
                // Toggle sign in/up
                TextButton(
                    onClick = { isSignUp = !isSignUp; error = "" },
                    modifier = Modifier.padding(top = 16.dp)
                ) {
                    Text(
                        text = if (isSignUp) "Already have an account? Sign In"
                        else "Don't have an account? Sign Up",
                        color = Color(0xFF94a3b8),
                        fontSize = 14.sp
                    )
                }

                // Code login link
                TextButton(
                    onClick = { isCodeLogin = true; error = "" }
                ) {
                    Icon(Icons.Filled.Key, null, tint = Color(0xFF06b6d4), modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Sign in with Auth Code", color = Color(0xFF06b6d4), fontSize = 14.sp)
                }

                // Divider
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 20.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    HorizontalDivider(modifier = Modifier.weight(1f), color = Color(0xFF334155))
                    Text(
                        "  OR  ",
                        color = Color(0xFF64748b),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    HorizontalDivider(modifier = Modifier.weight(1f), color = Color(0xFF334155))
                }

                // Guest button
                OutlinedButton(
                    onClick = { handleGuest() },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = Color(0xFF0ea5e9)
                    ),
                    border = ButtonDefaults.outlinedButtonBorder.copy(
                        brush = Brush.linearGradient(listOf(Color(0xFF0ea5e9), Color(0xFF0369a1)))
                    )
                ) {
                    Icon(Icons.Filled.PersonOutline, null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Continue as Guest", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                }
            } else {
                // Back to email
                TextButton(
                    onClick = { isCodeLogin = false; error = "" },
                    modifier = Modifier.padding(top = 16.dp)
                ) {
                    Text(
                        "Use email instead? Sign In",
                        color = Color(0xFF94a3b8),
                        fontSize = 14.sp
                    )
                }
            }
        }
    }

    // Auth code modal
    if (showAuthCodeModal) {
        AlertDialog(
            onDismissRequest = {
                showAuthCodeModal = false
                val role = appService.userRole.value
                onAuthenticated(role)
            },
            containerColor = Color(0xFF0f172a),
            title = {
                Text(
                    "Your Auth Code",
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFFf1f5f9),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            },
            text = {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "Save this code to sign in quickly next time",
                        color = Color(0xFF94a3b8),
                        fontSize = 14.sp,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(20.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        displayedAuthCode.forEach { digit ->
                            Surface(
                                modifier = Modifier.size(56.dp, 64.dp),
                                shape = RoundedCornerShape(14.dp),
                                color = Color(0xFF0ea5e9).copy(alpha = 0.12f),
                                border = ButtonDefaults.outlinedButtonBorder.copy(
                                    brush = Brush.linearGradient(listOf(Color(0xFF0ea5e9)))
                                )
                            ) {
                                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                                    Text(
                                        digit.toString(),
                                        fontSize = 28.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Color(0xFF0ea5e9)
                                    )
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showAuthCodeModal = false
                        val role = appService.userRole.value
                        onAuthenticated(role)
                    }
                ) {
                    Text("Continue to App", color = Color(0xFF0ea5e9), fontWeight = FontWeight.Bold)
                }
            }
        )
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
