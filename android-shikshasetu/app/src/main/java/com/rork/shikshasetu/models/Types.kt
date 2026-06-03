package com.rork.shikshasetu.models

import kotlinx.serialization.Serializable

typealias UserRole = String // "student" | "teacher"
typealias Language = String
typealias Board = String // "NCERT" | "ICSE" | "State Board"

@Serializable
data class ShikshaUser(
    val email: String,
    val name: String,
    val isGuest: Boolean = false,
    val authCode: String? = null
)

@Serializable
data class NCERTSubject(
    val id: String,
    val name: String,
    val grade: Int,
    val chapters: List<NCERTChapter> = emptyList()
)

@Serializable
data class NCERTChapter(
    val id: String,
    val number: Int,
    val title: String,
    val description: String,
    val content: String? = null
)

@Serializable
data class ICESESubject(
    val id: String,
    val name: String,
    val grade: Int,
    val chapters: List<ICESEChapter> = emptyList()
)

@Serializable
data class ICESEChapter(
    val id: String,
    val number: Int,
    val title: String,
    val description: String,
    val content: String? = null
)

@Serializable
data class Quiz(
    val id: String,
    val chapterId: String,
    val questions: List<QuizQuestion> = emptyList(),
    val language: Language = "english"
)

@Serializable
data class QuizQuestion(
    val id: String,
    val question: String,
    val options: List<String>,
    val correctAnswer: Int,
    val explanation: String
)

@Serializable
data class QuizResult(
    val id: String = "",
    val board: Board = "NCERT",
    val subject: String = "",
    val chapter: String = "",
    val grade: Int = 0,
    val score: Int = 0,
    val totalQuestions: Int = 0,
    val completedAt: Long = System.currentTimeMillis()
)

@Serializable
data class ContentActivity(
    val id: String,
    val board: Board,
    val type: String, // "content" | "summary" | "notes" | "worksheet"
    val subject: String,
    val chapter: String,
    val grade: Int,
    val completedAt: Long
)

@Serializable
data class TeacherActivity(
    val type: String,
    val title: String,
    val timestamp: Long,
    val details: String? = null,
    val subject: String? = null
)

@Serializable
data class TeacherUpload(
    val id: String,
    val type: String, // "video" | "text"
    val title: String,
    val content: String,
    val videoUrl: String? = null,
    val board: Board,
    val grade: Int,
    val subject: String,
    val chapter: String,
    val uploadedAt: Long = System.currentTimeMillis()
)

@Serializable
data class ExamActivity(
    val id: String,
    val totalMarks: Int,
    val obtainedMarks: Int,
    val percentage: Float,
    val scannedAt: Long
)

@Serializable
data class XPEntry(
    val id: String,
    val amount: Int,
    val reason: String,
    val earnedAt: Long = System.currentTimeMillis()
)

@Serializable
data class XPReward(
    val active: Boolean,
    val activatedAt: String,
    val expiresAt: String
)

@Serializable
data class GamePlayRecord(
    val date: String,
    val game: String,
    val won: Boolean
)

@Serializable
data class GKQuizRecord(
    val date: String,
    val score: Int,
    val totalQuestions: Int
)

@Serializable
data class FunLearningState(
    val gamePlaysToday: List<GamePlayRecord> = emptyList(),
    val gkQuizzesToday: List<GKQuizRecord> = emptyList(),
    val lastPlayDate: String = "",
    val pendingXPLoss: Boolean = false
)

@Serializable
data class UserProgress(
    val quizzesCompleted: List<QuizResult> = emptyList(),
    val contentActivities: List<ContentActivity> = emptyList(),
    val teacherActivities: List<TeacherActivity> = emptyList(),
    val examActivities: List<ExamActivity> = emptyList(),
    val teacherUploads: List<TeacherUpload> = emptyList(),
    val totalStudyTime: Int = 0,
    val lastActiveDate: String = todayString(),
    val currentStreak: Int = 0,
    val totalXP: Int = 0,
    val xpHistory: List<XPEntry> = emptyList(),
    val xpReward: XPReward? = null,
    val streakXPAwarded: List<String> = emptyList(),
    val funLearning: FunLearningState = FunLearningState()
)

@Serializable
data class OnboardingData(
    val board: String = "",
    val className: String = "",
    val examDate: String = "",
    val customExamDate: String? = null,
    val completedAt: String? = null
)

@Serializable
data class StudyPlan(
    val subject: String,
    val topic: String,
    val duration: String,
    val color: String,
    val icon: String,
    val priority: String // "high" | "medium" | "low"
)

@Serializable
data class InterviewSession(
    val id: String,
    val type: String,
    val questions: List<InterviewQuestion> = emptyList(),
    val responses: List<InterviewResponse> = emptyList(),
    val startTime: Long = System.currentTimeMillis(),
    val endTime: Long? = null
)

@Serializable
data class InterviewQuestion(
    val id: String,
    val question: String,
    val topic: String
)

@Serializable
data class InterviewResponse(
    val questionId: String,
    val answer: String,
    val audioUri: String? = null,
    val videoUri: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)

// Chat/Messaging models
@Serializable
data class ChatMessage(
    val id: String,
    val senderId: String,
    val senderName: String,
    val senderRole: String,
    val receiverId: String,
    val receiverName: String,
    val text: String,
    val timestamp: Long,
    val read: Boolean = false
)

@Serializable
data class Conversation(
    val id: String,
    val participantId: String,
    val participantName: String,
    val participantRole: String,
    val lastMessage: String,
    val lastMessageTime: Long,
    val unreadCount: Int = 0
)

@Serializable
data class Contact(
    val email: String,
    val name: String,
    val role: String
)

// Study Rooms
@Serializable
data class StudyRoom(
    val id: String,
    val name: String,
    val code: String,
    val createdBy: String,
    val createdByName: String,
    val createdAt: Long = System.currentTimeMillis()
)

@Serializable
data class StudyRoomMember(
    val id: String,
    val roomId: String,
    val email: String,
    val name: String,
    val joinedAt: Long = System.currentTimeMillis()
)

@Serializable
data class StudyRoomMessage(
    val id: String,
    val roomId: String,
    val senderId: String,
    val senderName: String,
    val text: String,
    val createdAt: Long = System.currentTimeMillis()
)

@Serializable
data class CompetitionEntry(
    val id: String = "",
    val userName: String = "",
    val email: String = "",
    val board: String = "CBSE",
    val score: Int = 0,
    val totalQuestions: Int = 0,
    val accuracy: Float = 0f,
    val timeTaken: Int = 0,
    val completedAt: String = "",
    val rank: Int? = null
)

fun todayString(): String {
    return java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
        .format(java.util.Date())
}
