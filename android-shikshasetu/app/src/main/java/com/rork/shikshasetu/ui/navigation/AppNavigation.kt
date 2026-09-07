package com.rork.shikshasetu.ui.navigation

import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.runtime.*
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.rork.shikshasetu.services.AppService
import com.rork.shikshasetu.services.AuthService
import com.rork.shikshasetu.ui.screens.auth.AuthScreen
import com.rork.shikshasetu.ui.screens.welcome.WelcomeScreen
import com.rork.shikshasetu.ui.screens.student.*
import com.rork.shikshasetu.ui.screens.teacher.*
import com.rork.shikshasetu.ui.screens.shared.PaywallScreen
import com.rork.shikshasetu.ui.components.BreakReminder
import org.koin.compose.koinInject

@Composable
fun AppNavigation(
    navController: NavHostController = rememberNavController(),
    authService: AuthService = koinInject(),
    appService: AppService = koinInject()
) {
    val user by authService.user.collectAsState()
    val userRole by appService.userRole.collectAsState()
    val isLoading by appService.isLoading.collectAsState()

    // Break reminder — shows every 25 minutes of study
    var showBreak by remember { mutableStateOf(false) }
    val progress by appService.userProgress.collectAsState()

    LaunchedEffect(progress.totalStudyTime) {
        if (progress.totalStudyTime > 0 && progress.totalStudyTime % 25 == 0) {
            showBreak = true
        }
    }

    if (showBreak) {
        BreakReminder(
            showBreak = showBreak,
            onDismiss = { showBreak = false },
            onTakeBreak = { showBreak = false }
        )
    }

    val startDestination = when {
        user == null -> Screen.Auth.route
        userRole == null -> Screen.Welcome.route
        userRole == "student" -> Screen.StudentDashboard.route
        else -> Screen.TeacherDashboard.route
    }

    NavHost(
        navController = navController,
        startDestination = startDestination,
        enterTransition = {
            slideInHorizontally(tween(320)) { it / 3 } + fadeIn(tween(320))
        },
        exitTransition = {
            slideOutHorizontally(tween(320)) { -it / 4 } + fadeOut(tween(220))
        },
        popEnterTransition = {
            slideInHorizontally(tween(320)) { -it / 4 } + fadeIn(tween(320))
        },
        popExitTransition = {
            slideOutHorizontally(tween(320)) { it / 3 } + fadeOut(tween(220))
        }
    ) {
        // Auth
        composable(Screen.Auth.route) {
            AuthScreen(
                onAuthenticated = { role ->
                    when {
                        role == null -> navController.navigate(Screen.Welcome.route) { popUpTo(Screen.Auth.route) { inclusive = true } }
                        role == "student" -> navController.navigate(Screen.StudentDashboard.route) { popUpTo(Screen.Auth.route) { inclusive = true } }
                        else -> navController.navigate(Screen.TeacherDashboard.route) { popUpTo(Screen.Auth.route) { inclusive = true } }
                    }
                }
            )
        }

        // Welcome / Role Selection
        composable(Screen.Welcome.route) {
            WelcomeScreen(
                onRoleSelected = { role ->
                    if (role == "student") {
                        if (!appService.isOnboardingDone())
                            navController.navigate(Screen.StudentOnboarding.route) { popUpTo(Screen.Welcome.route) { inclusive = true } }
                        else
                            navController.navigate(Screen.StudentDashboard.route) { popUpTo(Screen.Welcome.route) { inclusive = true } }
                    } else {
                        navController.navigate(Screen.TeacherDashboard.route) { popUpTo(Screen.Welcome.route) { inclusive = true } }
                    }
                }
            )
        }

        // Paywall
        composable(Screen.Paywall.route) { PaywallScreen(onDismiss = { navController.popBackStack() }) }

        // ========== STUDENT ==========
        composable(Screen.StudentOnboarding.route) {
            StudentOnboardingScreen(onComplete = { navController.navigate(Screen.StudentDashboard.route) { popUpTo(Screen.StudentOnboarding.route) { inclusive = true } } })
        }

        composable(Screen.StudentDashboard.route) { StudentDashboardScreen(onNavigate = { route -> navController.navigate(route) }) }

        composable(Screen.StudentContent.route) { StudentContentScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.StudentICSE.route) { ICSEContentScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.StudentQuiz.route, arguments = listOf(navArgument("subjectId") { type = NavType.StringType }, navArgument("chapterId") { type = NavType.StringType })) { backStackEntry ->
            val subjectId = backStackEntry.arguments?.getString("subjectId") ?: ""
            val chapterId = backStackEntry.arguments?.getString("chapterId") ?: ""
            StudentQuizScreen(subjectId, chapterId, onBack = { navController.popBackStack() })
        }

        composable(Screen.StudentInterview.route) { StudentInterviewScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.StudentStudyOS.route) { StudyOSScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.StudentStudyRooms.route) { StudyRoomsScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.StudentFunLearning.route) { FunLearningScreen(onNavigate = { route -> navController.navigate(route) }, onBack = { navController.popBackStack() }) }

        composable(Screen.StudentMessages.route) {
            StudentMessagesScreen(onChatClick = { email, name, role -> navController.navigate(Screen.StudentMessagesChat.createRoute(email, name, role)) }, onBack = { navController.popBackStack() })
        }

        composable(Screen.StudentMessagesChat.route, arguments = listOf(navArgument("contactEmail") { type = NavType.StringType }, navArgument("contactName") { type = NavType.StringType }, navArgument("contactRole") { type = NavType.StringType })) { backStackEntry ->
            val email = backStackEntry.arguments?.getString("contactEmail") ?: ""
            val name = backStackEntry.arguments?.getString("contactName") ?: ""
            val role = backStackEntry.arguments?.getString("contactRole") ?: "student"
            ChatScreen(email, name, role, userRole = "student", onBack = { navController.popBackStack() })
        }

        composable(Screen.StudentPerformance.route) { StudentPerformanceScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.StudentFlashcards.route) { FlashcardsScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.StudentFormulaSheet.route) { FormulaSheetScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.StudentHandwrittenNotes.route) { HandwrittenNotesScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.StudentUsefulLinks.route) { UsefulLinksScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.StudentWeakTopics.route) { WeakTopicsScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.StudentComicLearn.route) { ComicLearnScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.StudentCompetition.route) { CompetitionScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.StudentGenerate.route) { StudentGenerateScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.StudentTimetable.route) { TimetableScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.StudentExamScanner.route) { ExamScannerScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.StudentQuickRevision.route) { QuickRevisionScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.StudentAbout.route) { AboutScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.StudentGames.route, arguments = listOf(navArgument("gameType") { type = NavType.StringType })) { backStackEntry ->
            val gameType = backStackEntry.arguments?.getString("gameType") ?: "2048"
            when (gameType) {
                "2048" -> Game2048Full(onBack = { navController.popBackStack() })
                "memory" -> MemoryMatchFull(onBack = { navController.popBackStack() })
                else -> Game2048Full(onBack = { navController.popBackStack() })
            }
        }

        composable(Screen.StudentGKQuiz.route) { GKQuizScreen(onBack = { navController.popBackStack() }) }

        // ========== TEACHER ==========
        composable(Screen.TeacherDashboard.route) { TeacherDashboardScreen(onNavigate = { route -> navController.navigate(route) }) }

        composable(Screen.TeacherContent.route) { TeacherContentScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.TeacherICSE.route) { ICSETeacherContentScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.TeacherGenerate.route) { TeacherGenerateScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.TeacherUpload.route) { TeacherUploadScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.TeacherMessages.route) {
            TeacherMessagesScreen(onChatClick = { email, name, role -> navController.navigate(Screen.TeacherMessagesChat.createRoute(email, name, role)) }, onBack = { navController.popBackStack() })
        }

        composable(Screen.TeacherMessagesChat.route, arguments = listOf(navArgument("contactEmail") { type = NavType.StringType }, navArgument("contactName") { type = NavType.StringType }, navArgument("contactRole") { type = NavType.StringType })) { backStackEntry ->
            val email = backStackEntry.arguments?.getString("contactEmail") ?: ""
            val name = backStackEntry.arguments?.getString("contactName") ?: ""
            val role = backStackEntry.arguments?.getString("contactRole") ?: "teacher"
            ChatScreen(email, name, role, userRole = "teacher", onBack = { navController.popBackStack() })
        }

        composable(Screen.TeacherPerformance.route) { TeacherPerformanceScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.TeacherQuickRevision.route) { TeacherQuickRevisionScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.TeacherExamScanner.route) { ExamScannerTeacherScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.TeacherAbout.route) { TeacherAboutScreen(onBack = { navController.popBackStack() }) }

        composable(Screen.TeacherVoiceAssistant.route) { VoiceAssistantScreen(onBack = { navController.popBackStack() }) }
    }
}
