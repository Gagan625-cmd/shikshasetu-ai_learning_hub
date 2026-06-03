package com.rork.shikshasetu.ui.screens.student

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.shikshasetu.services.AppService
import org.koin.compose.koinInject
import kotlin.random.Random

enum class MemoryDifficulty(val pairs: Int, val cols: Int, val label: String) {
    EASY(8, 4, "Easy"), MEDIUM(12, 6, "Medium"), HARD(18, 6, "Hard")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Game2048Full(onBack: () -> Unit, appService: AppService = koinInject()) {
    var grid by remember { mutableStateOf(Array(4) { IntArray(4) { 0 } }) }
    var score by remember { mutableStateOf(0) }
    var bestScore by remember { mutableStateOf(0) }
    var gameOver by remember { mutableStateOf(false) }
    var won by remember { mutableStateOf(false) }

    fun addRandomTile() {
        val empty = mutableListOf<Pair<Int, Int>>()
        for (r in 0..3) for (c in 0..3) if (grid[r][c] == 0) empty.add(r to c)
        if (empty.isNotEmpty()) { val (r, c) = empty[Random.nextInt(empty.size)]; grid[r][c] = if (Random.nextFloat() < 0.9f) 2 else 4 }
    }

    fun reset() { grid = Array(4) { IntArray(4) { 0 } }; score = 0; gameOver = false; won = false; addRandomTile(); addRandomTile() }
    LaunchedEffect(Unit) { reset() }

    fun slide(row: IntArray): Pair<IntArray, Int> {
        val nz = row.filter { it != 0 }.toMutableList()
        var gained = 0; var i = 0
        while (i < nz.size - 1) { if (nz[i] == nz[i + 1]) { nz[i] *= 2; gained += nz[i]; nz.removeAt(i + 1) }; i++ }
        while (nz.size < 4) nz.add(0)
        return nz.toIntArray() to gained
    }

    fun move(dir: Int): Boolean {
        var changed = false
        for (idx in 0..3) {
            val arr = IntArray(4) { when (dir) { 0 -> grid[idx][it]; 1 -> grid[idx][3 - it]; 2 -> grid[it][idx]; else -> grid[3 - it][idx] } }
            val (n, g) = slide(arr); score += g
            for (i in 0..3) {
                val old = when (dir) { 0 -> grid[idx][i]; 1 -> grid[idx][3 - i]; 2 -> grid[i][idx]; else -> grid[3 - i][idx] }
                val nv = if (dir == 1) n[3 - i] else n[i]
                if (old != nv) changed = true
                when (dir) { 0 -> grid[idx][i] = n[i]; 1 -> grid[idx][3 - i] = n[3 - i]; 2 -> grid[i][idx] = n[i]; else -> grid[3 - i][idx] = n[i] }
            }
        }
        return changed
    }

    fun isGameOver(): Boolean { for (r in 0..3) for (c in 0..3) { if (grid[r][c] == 0) return false; if (r < 3 && grid[r][c] == grid[r + 1][c]) return false; if (c < 3 && grid[r][c] == grid[r][c + 1]) return false }; return true }
    fun has2048() = grid.any { it.any { v -> v >= 2048 } }
    fun commit() { addRandomTile(); if (score > bestScore) bestScore = score; if (has2048() && !won) won = true; if (isGameOver()) gameOver = true; if (gameOver) appService.recordGamePlay("2048", won) }

    Scaffold(
        topBar = { TopAppBar(title = { Text("2048", color = Color.White, fontWeight = FontWeight.Bold) }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } }, actions = { IconButton(onClick = { reset() }) { Icon(Icons.Filled.Refresh, "Restart", tint = Color.White) } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628))) },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) { ScoreBox2048("Score", score, Color(0xFF0ea5e9)); ScoreBox2048("Best", bestScore, Color(0xFFf59e0b)) }
            Spacer(Modifier.height(16.dp))
            Box(
                Modifier.fillMaxWidth().aspectRatio(1f).clip(RoundedCornerShape(16.dp)).background(Color(0xFF1a2332)).padding(8.dp)
            ) {
                Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.SpaceEvenly) { for (r in 0..3) Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) { for (c in 0..3) Tile2048(grid[r][c]) } }
            }
            Spacer(Modifier.height(12.dp))
            DPad2048({ if (!gameOver && move(2)) commit() }, { if (!gameOver && move(3)) commit() }, { if (!gameOver && move(0)) commit() }, { if (!gameOver && move(1)) commit() })
            if (gameOver || won) {
                Spacer(Modifier.height(16.dp))
                Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = if (won) Color(0xFFf59e0b).copy(alpha = 0.15f) else Color(0xFFef4444).copy(alpha = 0.15f))) {
                    Column(Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(if (won) "\uD83C\uDFC6 You Win!" else "Game Over!", fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, color = if (won) Color(0xFFfbbf24) else Color(0xFFfca5a5))
                        Spacer(Modifier.height(8.dp)); Text("Score: $score", fontSize = 18.sp, color = Color.White)
                        Spacer(Modifier.height(12.dp))
                        Button(onClick = { reset() }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0ea5e9)), shape = RoundedCornerShape(12.dp)) { Text("Play Again") }
                    }
                }
            }
        }
    }
}

@Composable private fun ScoreBox2048(label: String, value: Int, accent: Color) {
    Surface(shape = RoundedCornerShape(12.dp), color = accent.copy(alpha = 0.1f), modifier = Modifier.width(140.dp)) {
        Column(Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) { Text(label, fontSize = 12.sp, color = Color(0xFF94a3b8)); Text("$value", fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = accent) }
    }
}
@Composable private fun DPad2048(onUp: () -> Unit, onDown: () -> Unit, onLeft: () -> Unit, onRight: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        IconButton(onClick = onUp) { Icon(Icons.Filled.KeyboardArrowUp, "Up", tint = Color.White, modifier = Modifier.size(40.dp)) }
        Row { IconButton(onClick = onLeft) { Icon(Icons.Filled.KeyboardArrowLeft, "Left", tint = Color.White, modifier = Modifier.size(40.dp)) }; Spacer(Modifier.width(48.dp)); IconButton(onClick = onRight) { Icon(Icons.Filled.KeyboardArrowRight, "Right", tint = Color.White, modifier = Modifier.size(40.dp)) } }
        IconButton(onClick = onDown) { Icon(Icons.Filled.KeyboardArrowDown, "Down", tint = Color.White, modifier = Modifier.size(40.dp)) }
    }
}
@Composable private fun Tile2048(value: Int) {
    val bgColor = when (value) { 0 -> Color(0xFF1e293b); 2 -> Color(0xFFeee4da); 4 -> Color(0xFFede0c8); 8 -> Color(0xFFf2b179); 16 -> Color(0xFFf59563); 32 -> Color(0xFFf67c5f); 64 -> Color(0xFFf65e3b); 128 -> Color(0xFFedcf72); 256 -> Color(0xFFedcc61); 512 -> Color(0xFFedc850); 1024 -> Color(0xFFedc53f); 2048 -> Color(0xFFedc22e); else -> Color(0xFF3c3a32) }
    val textColor = if (value <= 4) Color(0xFF776e65) else Color.White
    val fontSize = when { value < 100 -> 22.sp; value < 1000 -> 18.sp; value < 10000 -> 15.sp; else -> 12.sp }
    Surface(modifier = Modifier.fillMaxWidth(0.22f).aspectRatio(1f), shape = RoundedCornerShape(10.dp), color = bgColor) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) { if (value > 0) Text("$value", fontSize = fontSize, fontWeight = FontWeight.ExtraBold, color = textColor, textAlign = TextAlign.Center) }
    }
}

// MEMORY MATCH
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MemoryMatchFull(onBack: () -> Unit, appService: AppService = koinInject()) {
    val icons = listOf("\uD83C\uDF4E","\uD83C\uDF4A","\uD83C\uDF4C","\uD83C\uDF53","\uD83E\uDD5D","\uD83E\uDDC0","\u2B50","\uD83C\uDF1F","\uD83D\uDD25","\uD83D\uDC9C","\uD83C\uDF38","\uD83C\uDF3A","\uD83D\uDC36","\uD83D\uDC31","\uD83D\uDC3C","\uD83E\uDD81","\uD83E\uDD8A","\uD83D\uDC22")
    var diff by remember { mutableStateOf(MemoryDifficulty.EASY) }
    var cards by remember { mutableStateOf(genCards(MemoryDifficulty.EASY, icons)) }
    var flipped by remember { mutableStateOf(setOf<Int>()) }
    var matched by remember { mutableStateOf(setOf<Int>()) }
    var moves by remember { mutableStateOf(0) }
    var gameWon by remember { mutableStateOf(false) }
    var startTime by remember { mutableStateOf(System.currentTimeMillis()) }
    var elapsed by remember { mutableStateOf(0L) }
    var checking by remember { mutableStateOf(false) }

    LaunchedEffect(gameWon) { if (!gameWon) while (!gameWon) { kotlinx.coroutines.delay(1000); elapsed = (System.currentTimeMillis() - startTime) / 1000 } }

    fun resetGame(d: MemoryDifficulty) { diff = d; cards = genCards(d, icons); flipped = emptySet(); matched = emptySet(); moves = 0; gameWon = false; checking = false; startTime = System.currentTimeMillis(); elapsed = 0 }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Memory Match", color = Color.White, fontWeight = FontWeight.Bold) }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } }, actions = { IconButton(onClick = { resetGame(diff) }) { Icon(Icons.Filled.Refresh, "Restart", tint = Color.White) } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628))) },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                MemoryDifficulty.values().forEach { d -> FilterChip(selected = diff == d, onClick = { resetGame(d) }, label = { Text(d.label, fontSize = 12.sp) }, colors = FilterChipDefaults.filterChipColors(selectedContainerColor = Color(0xFF0ea5e9).copy(alpha = 0.3f), containerColor = Color(0xFF1e293b))) }
            }
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) { StatChipMem("Moves", "$moves", Color(0xFF0ea5e9)); StatChipMem("Time", "${elapsed}s", Color(0xFF10b981)); StatChipMem("Matched", "${matched.size/2}/${diff.pairs}", Color(0xFFf59e0b)) }
            Spacer(Modifier.height(16.dp))
            val cols = diff.cols; val cardSz = (330 - (cols * 6)) / cols
            Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                for (row in cards.indices step cols) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterHorizontally)) {
                        for (col in 0 until cols) {
                            val idx = row + col
                            if (idx < cards.size) {
                                val vis = flipped.contains(idx) || matched.contains(idx)
                                MemoryCard(cards[idx], vis, matched.contains(idx), cardSz.dp) {
                                    if (checking || vis) return@MemoryCard
                                    val nf = flipped + idx
                                    if (nf.size == 2) { checking = true; moves++; flipped = nf }
                                    else flipped = nf
                                }
                            }
                        }
                    }
                }
            }
            if (checking && flipped.size == 2) {
                LaunchedEffect(flipped) {
                    kotlinx.coroutines.delay(800)
                    val (a, b) = flipped.toList()
                    if (cards[a] == cards[b]) { matched = matched + a + b; if (matched.size == cards.size) { gameWon = true; appService.recordGamePlay("memory", true) } }
                    flipped = emptySet(); checking = false
                }
            }
            if (gameWon) {
                Spacer(Modifier.height(16.dp))
                Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFFf59e0b).copy(alpha = 0.15f))) {
                    Column(Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("\uD83C\uDF89 You Win!", fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFFfbbf24))
                        Spacer(Modifier.height(8.dp)); Text("$moves moves in ${elapsed}s", fontSize = 16.sp, color = Color.White)
                        Text("Accuracy: ${(diff.pairs * 100 / moves.coerceAtLeast(1)).coerceAtMost(100)}%", fontSize = 14.sp, color = Color(0xFF94a3b8))
                        Spacer(Modifier.height(12.dp))
                        Button(onClick = { resetGame(diff) }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0ea5e9)), shape = RoundedCornerShape(12.dp)) { Text("Play Again") }
                    }
                }
            }
        }
    }
}

@Composable private fun StatChipMem(label: String, value: String, accent: Color) {
    Surface(shape = RoundedCornerShape(8.dp), color = accent.copy(alpha = 0.1f)) {
        Column(Modifier.padding(horizontal = 16.dp, vertical = 8.dp), horizontalAlignment = Alignment.CenterHorizontally) { Text(value, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = accent); Text(label, fontSize = 10.sp, color = Color(0xFF94a3b8)) }
    }
}
@Composable private fun MemoryCard(icon: String, isFlipped: Boolean, isMatched: Boolean, size: androidx.compose.ui.unit.Dp, onClick: () -> Unit) {
    val bg = when { isMatched -> Color(0xFF10b981).copy(alpha = 0.2f); isFlipped -> Color(0xFF0ea5e9).copy(alpha = 0.15f); else -> Color(0xFF1e293b) }
    Surface(modifier = Modifier.size(size), shape = RoundedCornerShape(10.dp), color = bg, onClick = onClick) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) { if (isFlipped || isMatched) Text(icon, fontSize = (size.value * 0.5f).sp, textAlign = TextAlign.Center) else Text("?", fontSize = (size.value * 0.35f).sp, color = Color(0xFF475569), fontWeight = FontWeight.Bold) }
    }
}
private fun genCards(d: MemoryDifficulty, icons: List<String>): List<String> { val s = icons.shuffled().take(d.pairs); return (s + s).shuffled() }
