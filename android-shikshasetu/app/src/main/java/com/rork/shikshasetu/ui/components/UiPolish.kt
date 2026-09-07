package com.rork.shikshasetu.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.shikshasetu.ui.theme.AppColors

/** App-wide gradient brush presets */
object Gradients {
    val Primary = Brush.linearGradient(listOf(Color(0xFF0ea5e9), Color(0xFF06b6d4)))
    val Hero = Brush.linearGradient(listOf(Color(0xFF0ea5e9), Color(0xFF8b5cf6)))
    val Sunset = Brush.linearGradient(listOf(Color(0xFFff6b35), Color(0xFFf59e0b)))
    val Gold = Brush.linearGradient(listOf(Color(0xFFfbbf24), Color(0xFFf59e0b)))
    val Green = Brush.linearGradient(listOf(Color(0xFF10b981), Color(0xFF14b8a6)))
    val Pink = Brush.linearGradient(listOf(Color(0xFFec4899), Color(0xFF8b5cf6)))

    fun of(a: Color, b: Color): Brush = Brush.linearGradient(listOf(a, b))

    /** Deep navy app background with soft radial glows */
    val background: Brush = Brush.verticalGradient(
        listOf(Color(0xFF0a1628), Color(0xFF0a1628), Color(0xFF0c2038))
    )
}

/**
 * Full-screen gradient background with ambient glow orbs.
 * Wrap screen content in this for a rich, atmospheric look.
 */
@Composable
fun GradientBackground(
    modifier: Modifier = Modifier,
    content: @Composable BoxScope.() -> Unit
) {
    Box(modifier.fillMaxSize().background(Gradients.background)) {
        // Ambient glow — top right
        Box(
            Modifier
                .size(280.dp)
                .offset(x = (-40).dp, y = (-60).dp)
                .background(
                    Brush.radialGradient(
                        listOf(Color(0xFF0ea5e9).copy(alpha = 0.14f), Color.Transparent)
                    )
                )
        )
        // Ambient glow — bottom left
        Box(
            Modifier
                .size(320.dp)
                .align(Alignment.BottomStart)
                .offset(x = (-80).dp, y = 80.dp)
                .background(
                    Brush.radialGradient(
                        listOf(Color(0xFF8b5cf6).copy(alpha = 0.10f), Color.Transparent)
                    )
                )
        )
        content()
    }
}

/**
 * Staggered entrance animation: slides up, fades in and scales in.
 * Use incrementing [index] for a cascading effect down the screen.
 */
fun Modifier.entrance(index: Int = 0): Modifier = composed {
    val animated = remember { Animatable(0f) }
    LaunchedEffect(Unit) {
        animated.animateTo(
            1f,
            animationSpec = tween(
                durationMillis = 420,
                delayMillis = index * 55,
                easing = FastOutSlowInEasing
            )
        )
    }
    graphicsLayer {
        alpha = animated.value
        translationY = (1f - animated.value) * 48f
        scaleX = 0.94f + (0.06f * animated.value)
        scaleY = 0.94f + (0.06f * animated.value)
    }
}

/** Gentle looping pulse for attention-grabbing elements (badges, CTAs) */
fun Modifier.pulse(): Modifier = composed {
    val transition = rememberInfiniteTransition(label = "pulse")
    val scale by transition.animateFloat(
        initialValue = 1f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(900, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )
    scale(scale)
}

/** Springy press-down scale for any clickable element */
fun Modifier.pressableScale(): Modifier = composed {
    val interactionSource = remember { MutableInteractionSource() }
    val pressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (pressed) 0.94f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMediumLow),
        label = "pressScale"
    )
    this.scale(scale)
}

/**
 * Animated number counter that rolls up from 0 to [value] on first composition.
 */
@Composable
fun AnimatedCounter(
    value: Int,
    modifier: Modifier = Modifier,
    suffix: String = "",
    fontSize: Int = 18,
    color: Color = Color.White
) {
    val animated = remember { Animatable(0f) }
    LaunchedEffect(value) {
        animated.snapTo(0f)
        animated.animateTo(
            value.toFloat(),
            animationSpec = tween(900, easing = FastOutSlowInEasing)
        )
    }
    Text(
        text = "${animated.value.toInt()}$suffix",
        fontSize = fontSize.sp,
        fontWeight = FontWeight.ExtraBold,
        color = color,
        modifier = modifier
    )
}

/** Shimmer sweep effect for placeholder/loading rows */
@Composable
fun ShimmerBar(modifier: Modifier = Modifier) {
    val transition = rememberInfiniteTransition(label = "shimmer")
    val progress by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1200, easing = LinearEasing)),
        label = "shimmerProgress"
    )
    Box(
        modifier
            .clip(RoundedCornerShape(8.dp))
            .background(
                Brush.linearGradient(
                    colors = listOf(
                        Color(0xFF1e3a5f),
                        Color(0xFF2d4a6f),
                        Color(0xFF1e3a5f)
                    ),
                    start = Offset(progress * 600f - 300f, 0f),
                    end = Offset(progress * 600f, 100f)
                )
            )
    )
}

/** Gradient CTA button with press animation */
@Composable
fun GradientButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    brush: Brush = Gradients.Primary,
    enabled: Boolean = true
) {
    val interactionSource = remember { MutableInteractionSource() }
    val pressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (pressed) 0.96f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "btnScale"
    )
    Button(
        onClick = onClick,
        modifier = modifier.scale(scale),
        enabled = enabled,
        interactionSource = interactionSource,
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = Color.Transparent,
            disabledContainerColor = Color(0xFF1e3a5f),
            contentColor = Color.White,
            disabledContentColor = Color(0xFF64748b)
        ),
        contentPadding = PaddingValues()
    ) {
        Box(
            Modifier
                .fillMaxWidth()
                .background(if (enabled) brush else Brush.linearGradient(listOf(Color(0xFF1e3a5f), Color(0xFF1e3a5f))))
                .padding(vertical = 14.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(text, fontWeight = FontWeight.Bold, fontSize = 15.sp)
        }
    }
}

/** Card with a gradient border and dark fill — premium look for hero sections */
@Composable
fun GradientBorderCard(
    modifier: Modifier = Modifier,
    borderBrush: Brush = Gradients.Primary,
    content: @Composable BoxScope.() -> Unit
) {
    Box(
        modifier
            .clip(RoundedCornerShape(20.dp))
            .background(borderBrush)
            .padding(1.5.dp)
    ) {
        Box(
            Modifier
                .clip(RoundedCornerShape(19.dp))
                .background(Color(0xFF0c1f35))
                .fillMaxWidth()
        ) {
            content()
        }
    }
}

/** Stat card with soft gradient tint background */
@Composable
fun GradientStatCard(
    icon: @Composable () -> Unit,
    value: String,
    label: String,
    tint: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier
            .clip(RoundedCornerShape(18.dp))
            .background(
                Brush.linearGradient(
                    listOf(tint.copy(alpha = 0.16f), tint.copy(alpha = 0.05f))
                )
            )
    ) {
        Column(
            Modifier.padding(14.dp).fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            icon()
            Spacer(Modifier.height(6.dp))
            Text(value, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
            Text(label, fontSize = 11.sp, color = AppColors.TextSecondary)
        }
    }
}
