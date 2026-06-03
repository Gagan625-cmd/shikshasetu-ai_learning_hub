package com.rork.shikshasetu.ui.screens.shared

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
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
import com.rork.shikshasetu.services.AuthService
import com.rork.shikshasetu.ui.theme.AppColors
import org.koin.compose.koinInject

@Composable
fun PaywallScreen(
    onDismiss: () -> Unit,
    authService: AuthService = koinInject()
) {
    val infiniteTransition = rememberInfiniteTransition()
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f, targetValue = 0.7f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = EaseInOutCubic),
            repeatMode = RepeatMode.Reverse
        )
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF0a1628), Color(0xFF0d2847),
                        Color(0xFF1a1a2e), Color(0xFF16213e)
                    )
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Close button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Filled.Close, null, tint = Color(0xFF94a3b8))
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Premium crown
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.linearGradient(
                            listOf(Color(0xFFfbbf24), Color(0xFFf59e0b), Color(0xFFb45309))
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Filled.Star, null, tint = Color.White, modifier = Modifier.size(48.dp))
            }

            Spacer(modifier = Modifier.height(16.dp))

            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .size(120.dp)
                    .background(Color(0xFFfbbf24).copy(alpha = glowAlpha / 3))
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                "ShikshaSetu Premium",
                fontSize = 28.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color(0xFFfbbf24),
                textAlign = TextAlign.Center
            )

            Text(
                "Unlock the full power of AI-powered learning",
                fontSize = 15.sp,
                color = Color(0xFF94a3b8),
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 8.dp)
            )

            Spacer(modifier = Modifier.height(28.dp))

            // Features
            PremiumFeature("Question Paper Generator", "Generate full exam papers with AI")
            PremiumFeature("Mind Map Generator", "Create visual mind maps for any topic")
            PremiumFeature("10 AI Generations/Day", "Double the free daily limit")
            PremiumFeature("Advanced Analytics", "Track student performance in detail")
            PremiumFeature("Priority Support", "Get help when you need it most")

            Spacer(modifier = Modifier.height(32.dp))

            // CTA
            Button(
                onClick = {},
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFFf59e0b)
                ),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text(
                    "Upgrade to Premium",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF0a1628)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            TextButton(onClick = onDismiss) {
                Text("Maybe Later", color = Color(0xFF64748b))
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun PremiumFeature(title: String, description: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Surface(
            modifier = Modifier.size(36.dp),
            shape = CircleShape,
            color = Color(0xFFfbbf24).copy(alpha = 0.15f)
        ) {
            Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                Icon(Icons.Filled.Check, null, tint = Color(0xFFfbbf24), modifier = Modifier.size(18.dp))
            }
        }
        Spacer(modifier = Modifier.width(14.dp))
        Column {
            Text(title, fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
            Text(description, fontSize = 13.sp, color = Color(0xFF94a3b8))
        }
    }
}
