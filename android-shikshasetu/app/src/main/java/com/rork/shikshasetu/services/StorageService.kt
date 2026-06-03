package com.rork.shikshasetu.services

import android.content.Context
import android.content.SharedPreferences
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import com.rork.shikshasetu.models.*

class StorageService(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("shikshasetu_prefs", Context.MODE_PRIVATE)

    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    fun getUserEmail(): String? = prefs.getString("current_user_email", null)

    fun saveUserEmail(email: String) = prefs.edit().putString("current_user_email", email).apply()

    fun clearUserEmail() = prefs.edit().remove("current_user_email").apply()

    private fun userKey(key: String): String {
        val email = getUserEmail()
        val prefix = if (email != null && email != "guest@app.com") "user_$email" else "guest"
        return "${prefix}_$key"
    }

    fun saveUser(user: ShikshaUser) {
        prefs.edit().putString("user", json.encodeToString(user)).apply()
        saveUserEmail(user.email)
    }

    fun loadUser(): ShikshaUser? {
        val raw = prefs.getString("user", null) ?: return null
        return try { json.decodeFromString<ShikshaUser>(raw) } catch (_: Exception) { null }
    }

    fun clearUser() {
        prefs.edit().remove("user").apply()
        clearUserEmail()
    }

    fun saveUsers(users: Map<String, StoredUser>) {
        prefs.edit().putString("users", json.encodeToString(users)).apply()
    }

    fun loadUsers(): Map<String, StoredUser> {
        val raw = prefs.getString("users", null) ?: return emptyMap()
        return try { json.decodeFromString<Map<String, StoredUser>>(raw) } catch (_: Exception) { emptyMap() }
    }

    fun saveAuthCodes(codes: Map<String, String>) {
        prefs.edit().putString("authCodes", json.encodeToString(codes)).apply()
    }

    fun loadAuthCodes(): Map<String, String> {
        val raw = prefs.getString("authCodes", null) ?: return emptyMap()
        return try { json.decodeFromString<Map<String, String>>(raw) } catch (_: Exception) { emptyMap() }
    }

    fun saveRole(role: String) {
        prefs.edit().putString(userKey("userRole"), role).apply()
    }

    fun loadRole(): String? = prefs.getString(userKey("userRole"), null)

    fun saveLanguage(language: String) {
        prefs.edit().putString(userKey("language"), language).apply()
    }

    fun loadLanguage(): String = prefs.getString(userKey("language"), "english") ?: "english"

    fun saveProgress(progress: UserProgress) {
        prefs.edit().putString(userKey("userProgress"), json.encodeToString(progress)).apply()
    }

    fun loadProgress(): UserProgress? {
        val raw = prefs.getString(userKey("userProgress"), null) ?: return null
        return try { json.decodeFromString<UserProgress>(raw) } catch (_: Exception) { null }
    }

    fun saveOnboardingData(data: OnboardingData) {
        prefs.edit().putString("student_onboarding_data", json.encodeToString(data)).apply()
    }

    fun loadOnboardingData(): OnboardingData? {
        val raw = prefs.getString("student_onboarding_data", null) ?: return null
        return try { json.decodeFromString<OnboardingData>(raw) } catch (_: Exception) { null }
    }

    fun saveOnboardingDone() {
        prefs.edit().putBoolean("student_onboarding_done", true).apply()
    }

    fun isOnboardingDone(): Boolean = prefs.getBoolean("student_onboarding_done", false)

    fun saveAIUsage(usage: AIUsageState) {
        prefs.edit().putString(userKey("aiUsage"), json.encodeToString(usage)).apply()
    }

    fun loadAIUsage(): AIUsageState {
        val raw = prefs.getString(userKey("aiUsage"), null) ?: return AIUsageState()
        return try { json.decodeFromString<AIUsageState>(raw) } catch (_: Exception) { AIUsageState() }
    }

    fun saveGamePlayToday(date: String, game: String) {
        val key = "${userKey("game_plays")}_$date"
        val plays = prefs.getStringSet(key, emptySet()) ?: emptySet()
        prefs.edit().putStringSet(key, plays + game).apply()
    }

    fun getGamePlaysToday(date: String): Set<String> {
        return prefs.getStringSet("${userKey("game_plays")}_$date", emptySet()) ?: emptySet()
    }

    fun saveQuizAttempted(date: String) {
        prefs.edit().putBoolean("${userKey("quiz_attempted")}_$date", true).apply()
    }

    fun isQuizAttempted(date: String): Boolean {
        return prefs.getBoolean("${userKey("quiz_attempted")}_$date", false)
    }

    fun saveDarkMode(isDark: Boolean) {
        prefs.edit().putBoolean("dark_mode", isDark).apply()
    }

    fun isDarkMode(): Boolean = prefs.getBoolean("dark_mode", true)
}

@kotlinx.serialization.Serializable
data class StoredUser(
    val password: String,
    val name: String,
    val authCode: String? = null
)

@kotlinx.serialization.Serializable
data class AIUsageState(
    val date: String = "",
    val count: Int = 0
)
