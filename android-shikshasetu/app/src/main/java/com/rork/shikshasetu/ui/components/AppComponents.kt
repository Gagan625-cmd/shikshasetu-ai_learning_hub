package com.rork.shikshasetu.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun PremiumGate(
    title: String,
    description: String,
    features: List<Pair<String, String>> = emptyList(), // icon, text
    onGoPremium: () -> Unit,
    modifier: Modifier = Modifier
) {
    val pulseAnim = rememberInfiniteTransition(label = "pulse")
    val pulseScale by pulseAnim.animateFloat(
        initialValue = 1f, targetValue = 1.1f,
        animationSpec = infiniteRepeatable(animation = tween(1000), repeatMode = RepeatMode.Reverse),
        label = "pulseScale"
    )
    val glowAlpha by pulseAnim.animateFloat(
        initialValue = 0.3f, targetValue = 0.7f,
        animationSpec = infiniteRepeatable(animation = tween(1500), repeatMode = RepeatMode.Reverse),
        label = "glow"
    )

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFf59e0b).copy(alpha = 0.06f))
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Animated lock icon
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .scale(pulseScale)
                    .clip(CircleShape)
                    .background(Color(0xFFf59e0b).copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Filled.Lock,
                    contentDescription = null,
                    tint = Color(0xFFfbbf24),
                    modifier = Modifier.size(36.dp)
                )
            }

            Spacer(Modifier.height(16.dp))

            Text(
                title,
                fontSize = 22.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color(0xFFfbbf24),
                textAlign = TextAlign.Center
            )

            Spacer(Modifier.height(8.dp))

            Text(
                description,
                fontSize = 14.sp,
                color = Color(0xFF94a3b8),
                textAlign = TextAlign.Center,
                lineHeight = 20.sp
            )

            if (features.isNotEmpty()) {
                Spacer(Modifier.height(16.dp))

                features.forEach { (icon, text) ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = Color(0xFFf59e0b).copy(alpha = 0.15f),
                            modifier = Modifier.size(28.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                                Text(icon, fontSize = 13.sp)
                            }
                        }
                        Spacer(Modifier.width(12.dp))
                        Text(
                            text,
                            fontSize = 13.sp,
                            color = Color(0xFFe2e8f0)
                        )
                    }
                }
            }

            Spacer(Modifier.height(20.dp))

            Button(
                onClick = onGoPremium,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFFf59e0b)
                ),
                shape = RoundedCornerShape(14.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text("\u2728", fontSize = 16.sp)
                    Spacer(Modifier.width(8.dp))
                    Text(
                        "Upgrade to Premium",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = Color.White
                    )
                }
            }

            Spacer(Modifier.height(4.dp))

            Text(
                "Unlock all premium features",
                fontSize = 11.sp,
                color = Color(0xFF64748b)
            )
        }
    }
}

@Composable
fun BreakReminder(
    showBreak: Boolean,
    onDismiss: () -> Unit,
    onTakeBreak: () -> Unit
) {
    if (!showBreak) return

    AlertDialog(
        onDismissRequest = onDismiss,
        shape = RoundedCornerShape(24.dp),
        containerColor = Color(0xFF0c1f35),
        title = {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Text("\u2615", fontSize = 48.sp)
                Spacer(Modifier.height(8.dp))
                Text(
                    "Time for a Break!",
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White,
                    textAlign = TextAlign.Center,
                    fontSize = 22.sp
                )
            }
        },
        text = {
            Text(
                "You've been studying for 25 minutes. Take a 5-minute break to recharge your mind. Stretch, hydrate, or just relax!",
                color = Color(0xFF94a3b8),
                fontSize = 14.sp,
                textAlign = TextAlign.Center,
                lineHeight = 20.sp
            )
        },
        confirmButton = {
            Button(
                onClick = onTakeBreak,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10b981)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Take a Break", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Continue Studying", color = Color(0xFF64748b))
            }
        }
    )
}
