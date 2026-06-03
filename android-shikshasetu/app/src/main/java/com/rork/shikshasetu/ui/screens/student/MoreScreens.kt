package com.rork.shikshasetu.ui.screens.student

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.rork.shikshasetu.services.AppService
import org.koin.compose.koinInject

// ===================== FLASHCARDS =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FlashcardsScreen(
    onBack: () -> Unit,
    appService: AppService = koinInject()
) {
    val subjects = listOf(
        Triple("Mathematics", "\uD83D\uDCCA", Color(0xFF0ea5e9)),
        Triple("Science", "\uD83E\uDDEA", Color(0xFF10b981)),
        Triple("English", "\uD83D\uDCDA", Color(0xFF8b5cf6)),
        Triple("Social Science", "\uD83C\uDF0D", Color(0xFFf59e0b)),
        Triple("Hindi", "\uD83C\uDDEE\uD83C\uDDF3", Color(0xFFef4444))
    )
    var selectedSubject by remember { mutableStateOf("") }
    var cards by remember { mutableStateOf<List<Flashcard>>(emptyList()) }
    var currentCard by remember { mutableStateOf(0) }
    var flipped by remember { mutableStateOf(false) }

    val allCards = remember {
        mapOf(
            "Mathematics" to listOf(
                Flashcard("Pythagorean Theorem", "In a right triangle, a\u00B2 + b\u00B2 = c\u00B2 where c is the hypotenuse"),
                Flashcard("Quadratic Formula", "x = (-b \u00B1 \u221A(b\u00B2-4ac)) / 2a"),
                Flashcard("Area of Circle", "A = \u03C0r\u00B2 where r is the radius"),
                Flashcard("Derivative of x\u207F", "d/dx(x\u207F) = nx\u207F\u207B\u00B9"),
                Flashcard("Sum of Angles in Triangle", "180\u00B0"),
                Flashcard("Slope Formula", "m = (y\u2082 - y\u2081) / (x\u2082 - x\u2081)")
            ),
            "Science" to listOf(
                Flashcard("Newton's 1st Law", "An object at rest stays at rest unless acted upon by a force"),
                Flashcard("Ohm's Law", "V = IR (Voltage = Current \u00D7 Resistance)"),
                Flashcard("Photosynthesis", "6CO\u2082 + 6H\u2082O \u2192 C\u2086H\u2081\u2082O\u2086 + 6O\u2082"),
                Flashcard("Mitochondria", "Powerhouse of the cell - produces ATP"),
                Flashcard("pH Scale", "0-14; <7 acidic, 7 neutral, >7 basic"),
                Flashcard("Periodic Table Groups", "18 groups; Group 1 = Alkali Metals, Group 18 = Noble Gases")
            ),
            "English" to listOf(
                Flashcard("Noun", "A word that names a person, place, thing, or idea"),
                Flashcard("Verb", "A word that expresses action or state of being"),
                Flashcard("Adjective", "A word that describes a noun or pronoun"),
                Flashcard("Metaphor", "A figure of speech comparing two unlike things without using 'like' or 'as'"),
                Flashcard("Alliteration", "Repetition of initial consonant sounds in neighboring words"),
                Flashcard("Sonnet", "A 14-line poem, typically in iambic pentameter")
            ),
            "Social Science" to listOf(
                Flashcard("Fundamental Rights", "6 rights guaranteed by the Indian Constitution: Equality, Freedom, Anti-exploitation, Religious Freedom, Cultural/Educational, Constitutional Remedies"),
                Flashcard("GDP", "Gross Domestic Product - total value of goods and services produced in a country"),
                Flashcard("UN Security Council", "5 permanent members: USA, UK, France, Russia, China"),
                Flashcard("Layers of Earth", "Crust, Mantle, Outer Core, Inner Core"),
                Flashcard("Latitude", "Angular distance north or south of the equator (0\u00B0-90\u00B0)"),
                Flashcard("Indian Parliament", "Bicameral: Lok Sabha (Lower House) + Rajya Sabha (Upper House)")
            ),
            "Hindi" to listOf(
                Flashcard("\u0938\u0902\u091C\u094D\u091E\u093E (Noun)", "\u0915\u093F\u0938\u0940 \u0935\u094D\u092F\u0915\u094D\u0924\u093F, \u0935\u0938\u094D\u0924\u0941, \u0938\u094D\u0925\u093E\u0928 \u092F\u093E \u092D\u093E\u0935 \u0915\u0947 \u0928\u093E\u092E \u0915\u094B \u0938\u0902\u091C\u094D\u091E\u093E \u0915\u0939\u0924\u0947 \u0939\u0948\u0902"),
                Flashcard("\u0915\u094D\u0930\u093F\u092F\u093E (Verb)", "\u091C\u093F\u0938 \u0936\u092C\u094D\u0926 \u0938\u0947 \u0915\u093F\u0938\u0940 \u0915\u093E\u092E \u0915\u0930\u0928\u0947 \u092F\u093E \u0939\u094B\u0928\u0947 \u0915\u093E \u092C\u094B\u0927 \u0939\u094B\u0924\u093E \u0939\u0948"),
                Flashcard("\u0935\u093F\u0936\u0947\u0937\u0923 (Adjective)", "\u0935\u093F\u0936\u0947\u0937\u0923 \u0938\u0902\u091C\u094D\u091E\u093E \u092F\u093E \u0938\u0930\u094D\u0935\u0928\u093E\u092E \u0915\u0940 \u0935\u093F\u0936\u0947\u0937\u0924\u093E \u092C\u0924\u093E\u0924\u093E \u0939\u0948"),
                Flashcard("\u0909\u092A\u0938\u0930\u094D\u0917 (Preposition)", "\u0938\u0902\u091C\u094D\u091E\u093E \u092F\u093E \u0938\u0930\u094D\u0935\u0928\u093E\u092E \u0915\u093E \u0926\u0942\u0938\u0930\u0947 \u0936\u092C\u094D\u0926\u094B\u0902 \u0938\u0947 \u0938\u0902\u092C\u0902\u0927 \u092C\u0924\u093E\u0924\u093E \u0939\u0948"),
                Flashcard("\u0930\u0938 (Rasa)", "\u0915\u093E\u0935\u094D\u092F \u0915\u093E \u0906\u0928\u0902\u0926 - 9 \u0930\u0938: \u0936\u0943\u0902\u0917\u093E\u0930, \u0939\u093E\u0938\u094D\u092F, \u0915\u0930\u0941\u0923, \u0930\u094C\u0926\u094D\u0930, \u0935\u0940\u0930, \u092D\u092F\u093E\u0928\u0915, \u0935\u0940\u092D\u0924\u094D\u0938, \u0905\u0926\u094D\u092D\u0941\u0924, \u0936\u093E\u0902\u0924"),
                Flashcard("\u0924\u0924\u094D\u0938\u092E \u0936\u092C\u094D\u0926", "\u091C\u094B \u0936\u092C\u094D\u0926 \u0926\u0942\u0938\u0930\u0940 \u092D\u093E\u0937\u093E \u0938\u0947 \u0932\u093F\u090F \u0917\u090F \u0939\u094B\u0902 \u0914\u0930 \u092C\u093F\u0928\u093E \u092A\u0930\u093F\u0935\u0930\u094D\u0924\u0928 \u0915\u0947 \u092A\u094D\u0930\u092F\u094B\u0917 \u0939\u094B\u0924\u0947 \u0939\u0948\u0902")
            )
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Flashcards", color = Color.White) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } },
                actions = {
                    if (selectedSubject.isNotEmpty()) {
                        IconButton(onClick = { currentCard = (currentCard - 1 + cards.size) % cards.size; flipped = false }) { Icon(Icons.Filled.ChevronLeft, "Prev", tint = Color.White) }
                        Text("${currentCard + 1}/${cards.size}", color = Color(0xFF94a3b8), fontSize = 14.sp, modifier = Modifier.padding(horizontal = 4.dp))
                        IconButton(onClick = { currentCard = (currentCard + 1) % cards.size; flipped = false }) { Icon(Icons.Filled.ChevronRight, "Next", tint = Color.White) }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628)))
        },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        if (selectedSubject.isEmpty()) {
            Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp)) {
                Text("Select a subject", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Spacer(Modifier.height(16.dp))
                subjects.forEach { (name, emoji, color) ->
                    Card(
                        onClick = {
                            selectedSubject = name
                            cards = allCards[name] ?: emptyList()
                            currentCard = 0; flipped = false
                            appService.addStudyTime(2)
                        },
                        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp), shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.1f))
                    ) {
                        Row(Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text(emoji, fontSize = 32.sp)
                            Spacer(Modifier.width(16.dp))
                            Column(Modifier.weight(1f)) {
                                Text(name, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 18.sp)
                                Text("${allCards[name]?.size ?: 0} cards", fontSize = 12.sp, color = Color(0xFF94a3b8))
                            }
                            Icon(Icons.Filled.ChevronRight, null, tint = color)
                        }
                    }
                }
            }
        } else {
            Column(Modifier.fillMaxSize().padding(padding), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                Card(
                    onClick = { flipped = !flipped },
                    modifier = Modifier.fillMaxWidth(0.88f).aspectRatio(1.4f), shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0ea5e9).copy(alpha = 0.08f))
                ) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(24.dp)) {
                            Text(if (flipped) "Answer" else "Question", fontSize = 11.sp, color = Color(0xFF64748b),
                                modifier = Modifier.padding(bottom = 8.dp))
                            Text(
                                if (flipped) cards[currentCard].answer else cards[currentCard].question,
                                fontSize = if (flipped) 18.sp else 22.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White,
                                textAlign = TextAlign.Center
                            )
                            Spacer(Modifier.height(16.dp))
                            Text(
                                if (flipped) "Tap to see question" else "Tap to reveal answer",
                                fontSize = 12.sp, color = Color(0xFF475569)
                            )
                        }
                    }
                }
                Spacer(Modifier.height(24.dp))
                Button(onClick = { selectedSubject = ""; cards = emptyList() },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1e3a5f)),
                    shape = RoundedCornerShape(14.dp)
                ) { Text("Choose Another Subject") }
            }
        }
    }
}

private data class Flashcard(val question: String, val answer: String)

// ===================== FORMULA SHEET =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FormulaSheetScreen(
    onBack: () -> Unit,
    appService: AppService = koinInject()
) {
    val categories = listOf(
        Trio("Algebra", listOf(
            "\u2022 (a+b)\u00B2 = a\u00B2 + 2ab + b\u00B2",
            "\u2022 (a-b)\u00B2 = a\u00B2 - 2ab + b\u00B2",
            "\u2022 a\u00B2 - b\u00B2 = (a+b)(a-b)",
            "\u2022 x = (-b \u00B1 \u221A(b\u00B2-4ac)) / 2a",
            "\u2022 a\u00B3 + b\u00B3 = (a+b)(a\u00B2-ab+b\u00B2)"
        ), Color(0xFF0ea5e9)),
        Trio("Geometry", listOf(
            "\u2022 Area of circle = \u03C0r\u00B2",
            "\u2022 Circumference = 2\u03C0r",
            "\u2022 Area of triangle = \u00BD \u00D7 b \u00D7 h",
            "\u2022 Pythagoras: a\u00B2 + b\u00B2 = c\u00B2",
            "\u2022 Volume of sphere = \u2154\u03C0r\u00B3"
        ), Color(0xFF10b981)),
        Trio("Trigonometry", listOf(
            "\u2022 sin\u03B8 = opposite/hypotenuse",
            "\u2022 cos\u03B8 = adjacent/hypotenuse",
            "\u2022 tan\u03B8 = opposite/adjacent",
            "\u2022 sin\u00B2\u03B8 + cos\u00B2\u03B8 = 1",
            "\u2022 sin(A+B) = sinA\u00D7cosB + cosA\u00D7sinB"
        ), Color(0xFF8b5cf6)),
        Trio("Calculus", listOf(
            "\u2022 d/dx(x\u207F) = nx\u207F\u207B\u00B9",
            "\u2022 \u222Bx\u207F = x\u207F\u207A\u00B9/(n+1) + C",
            "\u2022 d/dx(sin x) = cos x",
            "\u2022 d/dx(cos x) = -sin x",
            "\u2022 d/dx(e\u02E3) = e\u02E3"
        ), Color(0xFFf59e0b)),
        Trio("Physics", listOf(
            "\u2022 F = ma (Newton's 2nd Law)",
            "\u2022 V = IR (Ohm's Law)",
            "\u2022 E = mc\u00B2 (Einstein)",
            "\u2022 v = u + at (Kinematics)",
            "\u2022 KE = \u00BDmv\u00B2"
        ), Color(0xFFec4899)),
        Trio("Chemistry", listOf(
            "\u2022 PV = nRT (Ideal Gas)",
            "\u2022 pH = -log[H\u207A]",
            "\u2022 n = m/M (Moles)",
            "\u2022 \u0394H = H(products) - H(reactants)",
            "\u2022 c = \u03BD\u03BB (Wave equation)"
        ), Color(0xFF14b8a6))
    )

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Formula Sheet", color = Color.White) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628)))
        },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            items(categories) { (name, formulas, color) ->
                Card(Modifier.fillMaxWidth().padding(vertical = 6.dp), shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.08f))) {
                    Column(Modifier.padding(16.dp)) {
                        Text(name, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = color)
                        Spacer(Modifier.height(8.dp))
                        formulas.forEach { formula ->
                            Text(formula, fontSize = 14.sp, color = Color(0xFFe2e8f0), modifier = Modifier.padding(vertical = 3.dp),
                                lineHeight = 20.sp)
                        }
                    }
                }
            }
            item { Spacer(Modifier.height(16.dp)) }
        }
    }
}

private data class Trio(val first: String, val second: List<String>, val third: Color)

// ===================== HANDWRITTEN NOTES =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HandwrittenNotesScreen(
    onBack: () -> Unit,
    appService: AppService = koinInject()
) {
    val notes = listOf(
        Triple("Photosynthesis", "Process by which plants convert light energy into chemical energy (glucose) using CO\u2082 and H\u2082O. Occurs in chloroplasts.\n\nEquation: 6CO\u2082 + 6H\u2082O \u2192 C\u2086H\u2081\u2082O\u2086 + 6O\u2082\n\nTwo stages: Light reaction (thylakoid) & Dark reaction (stroma). Chlorophyll absorbs red & blue light.", Color(0xFF10b981)),
        Triple("Indian Constitution", "Adopted on 26th November 1949, enforced on 26th January 1950.\n\nFeatures:\n\u2022 Federal system with unitary bias\n\u2022 Parliamentary form of government\n\u2022 Fundamental Rights (Part III)\n\u2022 Directive Principles (Part IV)\n\u2022 Fundamental Duties (Part IV-A)\n\nLongest written constitution in the world with 395 articles initially.", Color(0xFFf59e0b)),
        Triple("Periodic Table", "Arranged by increasing atomic number. 7 periods, 18 groups.\n\nKey Trends:\n\u2022 Atomic size decreases left to right\n\u2022 Electronegativity increases left to right\n\u2022 Metallic character decreases left to right\n\nBlocks: s-block (Groups 1-2), p-block (13-18), d-block (3-12), f-block (lanthanides/actinides)", Color(0xFF8b5cf6)),
        Triple("Quadratic Equations", "Standard form: ax\u00B2 + bx + c = 0 (a \u2260 0)\n\nSolution: x = [-b \u00B1 \u221A(b\u00B2 - 4ac)] / 2a\n\nDiscriminant (D = b\u00B2 - 4ac):\n\u2022 D > 0: Two real distinct roots\n\u2022 D = 0: Two real equal roots\n\u2022 D < 0: No real roots (imaginary)\n\nSum of roots = -b/a\nProduct of roots = c/a", Color(0xFF0ea5e9)),
        Triple("Gravity", "Universal Law: F = G\u00D7(m\u2081\u00D7m\u2082)/r\u00B2\nwhere G = 6.674 \u00D7 10\u207B\u00B9\u00B9 Nm\u00B2/kg\u00B2\n\nAcceleration due to gravity on Earth: g = 9.8 m/s\u00B2\n\nWeight = mg\n\nFactors affecting g: altitude, depth, latitude, Earth's rotation\n\nEscape velocity: v = \u221A(2gR) \u2248 11.2 km/s for Earth", Color(0xFFff6b35))
    )

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Handwritten Notes", color = Color.White) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628)))
        },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            items(notes) { (title, content, color) ->
                Card(Modifier.fillMaxWidth().padding(vertical = 6.dp), shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0c1f35))) {
                    Column(Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(shape = RoundedCornerShape(8.dp), color = color.copy(alpha = 0.2f)) {
                                Text(title, modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                    fontWeight = FontWeight.Bold, color = color, fontSize = 16.sp)
                            }
                        }
                        Spacer(Modifier.height(12.dp))
                        Text(content, fontSize = 14.sp, color = Color(0xFFe2e8f0), lineHeight = 22.sp)
                    }
                }
            }
            item { Spacer(Modifier.height(16.dp)) }
        }
    }
}

// ===================== USEFUL LINKS =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UsefulLinksScreen(
    onBack: () -> Unit,
    appService: AppService = koinInject()
) {
    val links = listOf(
        LinkGroup("NCERT Resources", listOf(
            Link("NCERT Official", "https://ncert.nic.in", Color(0xFF0ea5e9)),
            Link("e-Pathshala", "https://epathshala.nic.in", Color(0xFF8b5cf6)),
            Link("DIKSHA", "https://diksha.gov.in", Color(0xFF10b981))
        )),
        LinkGroup("Competitive Exams", listOf(
            Link("JEE Main", "https://jeemain.nta.nic.in", Color(0xFFf59e0b)),
            Link("NEET", "https://neet.nta.nic.in", Color(0xFFec4899)),
            Link("UPSC", "https://upsc.gov.in", Color(0xFFef4444))
        )),
        LinkGroup("Learning Platforms", listOf(
            Link("Khan Academy", "https://khanacademy.org", Color(0xFF14b8a6)),
            Link("BYJU'S", "https://byjus.com", Color(0xFF6366f1)),
            Link("Unacademy", "https://unacademy.com", Color(0xFFff6b35))
        )),
        LinkGroup("Reference", listOf(
            Link("Wikipedia", "https://wikipedia.org", Color(0xFF64748b)),
            Link("Britannica", "https://britannica.com", Color(0xFF475569)),
            Link("Wolfram Alpha", "https://wolframalpha.com", Color(0xFFdc2626))
        ))
    )

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Useful Links", color = Color.White) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628)))
        },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            links.forEach { group ->
                item {
                    Text(group.name, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White, modifier = Modifier.padding(top = 16.dp, bottom = 8.dp))
                }
                items(group.links) { link ->
                    Card(
                        onClick = { /* Open URL in browser */ },
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = link.color.copy(alpha = 0.08f))
                    ) {
                        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Filled.Link, null, tint = link.color, modifier = Modifier.size(20.dp))
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(link.name, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
                                Text(link.url, fontSize = 11.sp, color = Color(0xFF64748b))
                            }
                            Icon(Icons.Filled.OpenInNew, null, tint = Color(0xFF475569))
                        }
                    }
                }
            }
            item { Spacer(Modifier.height(16.dp)) }
        }
    }
}

private data class LinkGroup(val name: String, val links: List<Link>)
private data class Link(val name: String, val url: String, val color: Color)

// ===================== WEAK TOPICS =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WeakTopicsScreen(
    onBack: () -> Unit,
    appService: AppService = koinInject()
) {
    val progress by appService.userProgress.collectAsState()
    val quizzes = progress.quizzesCompleted

    // Analyze weak topics from quiz results
    val weakTopics = remember(quizzes) {
        quizzes.groupBy { "${it.subject} - ${it.chapter}" }
            .mapValues { (_, results) -> results.map { it.score.toFloat() / it.totalQuestions }.average() }
            .filter { it.value < 0.6f }
            .map { (topic, avg) -> Triple(topic, avg, when { avg < 0.3f -> "Critical"; avg < 0.5f -> "Weak"; else -> "Needs Work" }) }
            .ifEmpty {
                listOf(
                    Triple("Mathematics - Trigonometry", 0.45f, "Weak"),
                    Triple("Science - Electricity", 0.55f, "Needs Work"),
                    Triple("English - Grammar", 0.40f, "Weak")
                )
            }
    }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Weak Topics", color = Color.White) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, null, tint = Color.White) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628)))
        },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            item {
                Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFef4444).copy(alpha = 0.08f))) {
                    Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("\u26A0\uFE0F", fontSize = 28.sp)
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text("Focus Areas", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 16.sp)
                            Text("Topics where you scored below 60%. Prioritize these for improvement.", fontSize = 12.sp, color = Color(0xFF94a3b8))
                        }
                    }
                }
                Spacer(Modifier.height(16.dp))
            }
            items(weakTopics) { (topic, avgScore, status) ->
                val color = when (status) { "Critical" -> Color(0xFFef4444); "Weak" -> Color(0xFFf59e0b); else -> Color(0xFF0ea5e9) }
                Card(Modifier.fillMaxWidth().padding(vertical = 4.dp), shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.08f))) {
                    Column(Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(topic, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 15.sp)
                                    Spacer(Modifier.width(8.dp))
                                    Surface(shape = RoundedCornerShape(6.dp), color = color.copy(alpha = 0.2f)) {
                                        Text(status, modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                            fontSize = 10.sp, fontWeight = FontWeight.Bold, color = color)
                                    }
                                }
                                Spacer(Modifier.height(4.dp))
                                Text("Average: " + (avgScore.toDouble() * 100).toInt() + "%", fontSize = 12.sp, color = Color(0xFF64748b))
                            }
                            Icon(Icons.Filled.TrendingUp, null, tint = color, modifier = Modifier.size(24.dp))
                        }
                        Spacer(Modifier.height(8.dp))
                        LinearProgressIndicator(
                            progress = { avgScore.toFloat() }, modifier = Modifier.fillMaxWidth(),
                            color = color, trackColor = Color(0xFF1e3a5f)
                        )
                    }
                }
            }
            item { Spacer(Modifier.height(16.dp)) }
        }
    }
}

// ===================== COMIC LEARN =====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComicLearnScreen(
    onBack: () -> Unit,
    appService: AppService = koinInject()
) {
    val comics = listOf(
        ComicStrip("The Water Cycle", listOf(
            "\u2600\uFE0F Sun heats water \u2192 Evaporation",
            "\u2601\uFE0F Water vapor rises \u2192 Condensation",
            "\uD83C\uDF27\uFE0F Clouds get heavy \u2192 Precipitation",
            "\uD83C\uDF0A Water returns \u2192 Collection"
        ), Color(0xFF0ea5e9)),
        ComicStrip("Digestive System", listOf(
            "\uD83C\uDF4E Food enters \u2192 Mouth (chewing)",
            "\uD83D\uDCA7 Through esophagus \u2192 Stomach (acids)",
            "\uD83E\uDDEA Small intestine \u2192 Nutrient absorption",
            "\uD83D\uDEBD Large intestine \u2192 Water absorption"
        ), Color(0xFF10b981)),
        ComicStrip("Indian Freedom", listOf(
            "1857 \u2192 First War of Independence",
            "1885 \u2192 Indian National Congress formed",
            "1920 \u2192 Non-Cooperation Movement",
            "1947 \u2192 India gains Independence \uD83C\uDDEE\uD83C\uDDF3"
        ), Color(0xFFf59e0b)),
        ComicStrip("Solar System", listOf(
            "\u2600\uFE0F Sun \u2192 The center, source of energy",
            "\uD83C\uDF0D Earth \u2192 3rd planet, only with known life",
            "\uD83C\uDF15 Moon \u2192 Earth's natural satellite",
            "\uD83E\uDE90 All planets orbit in elliptical paths"
        ), Color(0xFF8b5cf6))
    )
    var selectedComic by remember { mutableStateOf<ComicStrip?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(selectedComic?.title ?: "Comic Learn", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = { if (selectedComic != null) selectedComic = null else onBack() }) {
                        Icon(Icons.Filled.ArrowBack, null, tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0a1628)))
        },
        containerColor = Color(0xFF0a1628)
    ) { padding ->
        if (selectedComic == null) {
            LazyColumn(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
                items(comics) { comic ->
                    Card(
                        onClick = { selectedComic = comic; appService.addStudyTime(2) },
                        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp), shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = comic.color.copy(alpha = 0.08f))
                    ) {
                        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text("\uD83D\uDCD6", fontSize = 32.sp)
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(comic.title, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 16.sp)
                                Text("${comic.panels.size} panels", fontSize = 12.sp, color = Color(0xFF94a3b8))
                            }
                            Icon(Icons.Filled.ChevronRight, null, tint = comic.color)
                        }
                    }
                }
            }
        } else {
            val comic = selectedComic!!
            Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp)) {
                comic.panels.forEachIndexed { idx, panel ->
                    Card(
                        Modifier.fillMaxWidth().padding(vertical = 6.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = comic.color.copy(alpha = 0.08f))
                    ) {
                        Column(Modifier.padding(20.dp)) {
                            Text("Panel ${idx + 1}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = comic.color)
                            Spacer(Modifier.height(8.dp))
                            Text(panel, fontSize = 16.sp, color = Color.White, lineHeight = 24.sp)
                        }
                    }
                    // Arrow between panels
                    if (idx < comic.panels.size - 1) {
                        Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                            Text("\u2B07\uFE0F", fontSize = 20.sp, modifier = Modifier.padding(vertical = 4.dp))
                        }
                    }
                }
            }
        }
    }
}

private data class ComicStrip(val title: String, val panels: List<String>, val color: Color)
