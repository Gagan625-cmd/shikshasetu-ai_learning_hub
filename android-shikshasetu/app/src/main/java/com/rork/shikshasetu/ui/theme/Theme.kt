package com.rork.shikshasetu.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val ShikshaDarkColorScheme = darkColorScheme(
    primary = Color(0xFF0ea5e9),
    onPrimary = Color.White,
    primaryContainer = Color(0xFF0e3460),
    onPrimaryContainer = Color(0xFF7dd3fc),
    secondary = Color(0xFFff6b35),
    onSecondary = Color.White,
    tertiary = Color(0xFF14b8a6),
    background = Color(0xFF0a1628),
    onBackground = Color(0xFFf1f5f9),
    surface = Color(0xFF0c1f35),
    onSurface = Color(0xFFe2e8f0),
    surfaceVariant = Color(0xFF1e3a5f),
    onSurfaceVariant = Color(0xFF94a3b8),
    error = Color(0xFFef4444),
    outline = Color(0xFF334155)
)

private val ShikshaLightColorScheme = lightColorScheme(
    primary = Color(0xFF0284c7),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFe0f2fe),
    onPrimaryContainer = Color(0xFF0c4a6e),
    secondary = Color(0xFFff6b35),
    onSecondary = Color.White,
    tertiary = Color(0xFF0d9488),
    background = Color(0xFFf0f9ff),
    onBackground = Color(0xFF0f172a),
    surface = Color.White,
    onSurface = Color(0xFF1e293b),
    surfaceVariant = Color(0xFFf1f5f9),
    onSurfaceVariant = Color(0xFF64748b),
    error = Color(0xFFdc2626),
    outline = Color(0xFFcbd5e1)
)

@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            if (darkTheme) dynamicDarkColorScheme(androidx.compose.ui.platform.LocalContext.current)
            else dynamicLightColorScheme(androidx.compose.ui.platform.LocalContext.current)
        }
        darkTheme -> ShikshaDarkColorScheme
        else -> ShikshaLightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
