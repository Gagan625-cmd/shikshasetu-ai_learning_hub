package com.rork.shikshasetu.ui.navigation

sealed class Screen(val route: String) {
    data object Auth : Screen("auth")
    data object Welcome : Screen("welcome")
    data object Paywall : Screen("paywall")

    // Student
    data object StudentOnboarding : Screen("student/onboarding")
    data object StudentDashboard : Screen("student/dashboard")
    data object StudentContent : Screen("student/content")
    data object StudentICSE : Screen("student/icse")
    data object StudentQuiz : Screen("student/quiz/{subjectId}/{chapterId}") {
        fun createRoute(subjectId: String, chapterId: String) = "student/quiz/$subjectId/$chapterId"
    }
    data object StudentInterview : Screen("student/interview")
    data object StudentStudyOS : Screen("student/study-os")
    data object StudentStudyRooms : Screen("student/study-rooms")
    data object StudentFunLearning : Screen("student/fun-learning")
    data object StudentMessages : Screen("student/messages")
    data object StudentMessagesChat : Screen("student/messages/{contactEmail}/{contactName}/{contactRole}") {
        fun createRoute(email: String, name: String, role: String) =
            "student/messages/$email/$name/$role"
    }
    data object StudentPerformance : Screen("student/performance")
    data object StudentFlashcards : Screen("student/flashcards")
    data object StudentFormulaSheet : Screen("student/formula-sheet")
    data object StudentHandwrittenNotes : Screen("student/handwritten-notes")
    data object StudentUsefulLinks : Screen("student/useful-links")
    data object StudentWeakTopics : Screen("student/weak-topics")
    data object StudentComicLearn : Screen("student/comic-learn")
    data object StudentCompetition : Screen("student/competition")
    data object StudentTimetable : Screen("student/timetable")
    data object StudentExamScanner : Screen("student/exam-scanner")
    data object StudentQuickRevision : Screen("student/quick-revision")
    data object StudentGenerate : Screen("student/generate")
    data object StudentGames : Screen("student/games/{gameType}") {
        fun createRoute(gameType: String) = "student/games/$gameType"
    }
    data object StudentGKQuiz : Screen("student/gk-quiz")
    data object StudentAbout : Screen("student/about")

    // Teacher
    data object TeacherDashboard : Screen("teacher/dashboard")
    data object TeacherContent : Screen("teacher/content")
    data object TeacherICSE : Screen("teacher/icse")
    data object TeacherQuiz : Screen("teacher/quiz/{subjectId}/{chapterId}") {
        fun createRoute(subjectId: String, chapterId: String) = "teacher/quiz/$subjectId/$chapterId"
    }
    data object TeacherInterview : Screen("teacher/interview")
    data object TeacherGenerate : Screen("teacher/generate")
    data object TeacherUpload : Screen("teacher/upload")
    data object TeacherMessages : Screen("teacher/messages")
    data object TeacherMessagesChat : Screen("teacher/messages/{contactEmail}/{contactName}/{contactRole}") {
        fun createRoute(email: String, name: String, role: String) =
            "teacher/messages/$email/$name/$role"
    }
    data object TeacherPerformance : Screen("teacher/performance")
    data object TeacherQuickRevision : Screen("teacher/quick-revision")
    data object TeacherExamScanner : Screen("teacher/exam-scanner")
    data object TeacherVoiceAssistant : Screen("teacher/voice-assistant")
    data object TeacherAbout : Screen("teacher/about")
}
