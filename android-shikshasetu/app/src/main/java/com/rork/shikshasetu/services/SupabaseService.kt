package com.rork.shikshasetu.services

import com.rork.shikshasetu.AppConfig
import com.rork.shikshasetu.models.*
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonPrimitive

class SupabaseService {
    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    private val client = HttpClient {
        install(ContentNegotiation) {
            json(json)
        }
    }

    private val baseUrl: String = AppConfig.SUPABASE_URL
    private val anonKey: String = AppConfig.SUPABASE_ANON_KEY
    private val isConfigured: Boolean = baseUrl.isNotBlank() && anonKey.isNotBlank() &&
            !baseUrl.contains("placeholder")

    private fun headersBuilder(builder: HttpRequestBuilder) {
        if (isConfigured) {
            builder.header("apikey", anonKey)
            builder.header("Authorization", "Bearer $anonKey")
        }
    }

    // --- Contacts ---
    suspend fun getTeachers(): List<Contact> {
        return getContacts().filter { it.role == "teacher" }
    }

    suspend fun getStudents(): List<Contact> {
        return getContacts().filter { it.role == "student" }
    }

    suspend fun getContacts(): List<Contact> {
        if (!isConfigured) return emptyList()
        return try {
            val resp: JsonObject = client.get("$baseUrl/rest/v1/app_contacts") {
                headersBuilder(this)
                parameter("select", "email,name,role")
            }.body()
            resp.jsonArray.map { el ->
                val obj = el as JsonObject
                Contact(
                    email = obj["email"]?.jsonPrimitive?.content ?: "",
                    name = obj["name"]?.jsonPrimitive?.content ?: "",
                    role = obj["role"]?.jsonPrimitive?.content ?: "student"
                )
            }
        } catch (e: Exception) { emptyList() }
    }

    suspend fun registerContact(email: String, name: String, role: String) {
        if (!isConfigured) return
        try {
            client.post("$baseUrl/rest/v1/app_contacts") {
                headersBuilder(this)
                header("Prefer", "resolution=merge-duplicates")
                contentType(ContentType.Application.Json)
                setBody(mapOf("email" to email, "name" to name, "role" to role))
            }
        } catch (_: Exception) {}
    }

    // --- Messages ---
    suspend fun getMessages(email: String): List<ChatMessage> {
        if (!isConfigured) return emptyList()
        return try {
            val resp: JsonObject = client.get("$baseUrl/rest/v1/app_messages") {
                headersBuilder(this)
                parameter("select", "*")
                parameter("or", "(sender_id.eq.$email,receiver_id.eq.$email)")
                parameter("order", "created_at.asc")
            }.body()
            resp.jsonArray.map { el ->
                val obj = el as JsonObject
                ChatMessage(
                    id = obj["id"]?.jsonPrimitive?.content ?: "",
                    senderId = obj["sender_id"]?.jsonPrimitive?.content ?: "",
                    senderName = obj["sender_name"]?.jsonPrimitive?.content ?: "",
                    senderRole = obj["sender_role"]?.jsonPrimitive?.content ?: "student",
                    receiverId = obj["receiver_id"]?.jsonPrimitive?.content ?: "",
                    receiverName = obj["receiver_name"]?.jsonPrimitive?.content ?: "",
                    text = obj["text"]?.jsonPrimitive?.content ?: "",
                    timestamp = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault())
                        .parse(obj["created_at"]?.jsonPrimitive?.content ?: "2024-01-01T00:00:00")?.time
                        ?: System.currentTimeMillis(),
                    read = obj["read"]?.jsonPrimitive?.content?.toBoolean() ?: false
                )
            }
        } catch (e: Exception) { emptyList() }
    }

    suspend fun sendMessage(
        msg: ChatMessage
    ) {
        if (!isConfigured) return
        try {
            client.post("$baseUrl/rest/v1/app_messages") {
                headersBuilder(this)
                header("Prefer", "return=minimal")
                contentType(ContentType.Application.Json)
                setBody(mapOf(
                    "id" to msg.id,
                    "sender_id" to msg.senderId,
                    "sender_name" to msg.senderName,
                    "sender_role" to msg.senderRole,
                    "receiver_id" to msg.receiverId,
                    "receiver_name" to msg.receiverName,
                    "text" to msg.text,
                    "read" to msg.read
                ))
            }
        } catch (_: Exception) {}
    }

    suspend fun markMessagesRead(ids: List<String>) {
        if (!isConfigured || ids.isEmpty()) return
        try {
            client.patch("$baseUrl/rest/v1/app_messages") {
                headersBuilder(this)
                parameter("id", "in.(${ids.joinToString(",")})")
                contentType(ContentType.Application.Json)
                setBody(mapOf("read" to true))
            }
        } catch (_: Exception) {}
    }

    // --- Study Rooms ---
    suspend fun getStudyRooms(): List<StudyRoom> {
        if (!isConfigured) return emptyList()
        return try {
            val resp: JsonObject = client.get("$baseUrl/rest/v1/study_rooms") {
                headersBuilder(this)
                parameter("select", "*")
            }.body()
            resp.jsonArray.map { el ->
                val obj = el as JsonObject
                StudyRoom(
                    id = obj["id"]?.jsonPrimitive?.content ?: "",
                    name = obj["name"]?.jsonPrimitive?.content ?: "",
                    code = obj["code"]?.jsonPrimitive?.content ?: "",
                    createdBy = obj["created_by"]?.jsonPrimitive?.content ?: "",
                    createdByName = obj["created_by_name"]?.jsonPrimitive?.content ?: ""
                )
            }
        } catch (e: Exception) { emptyList() }
    }

    suspend fun createStudyRoom(room: StudyRoom) {
        if (!isConfigured) return
        try {
            client.post("$baseUrl/rest/v1/study_rooms") {
                headersBuilder(this)
                header("Prefer", "return=minimal")
                contentType(ContentType.Application.Json)
                setBody(mapOf(
                    "id" to room.id,
                    "name" to room.name,
                    "code" to room.code,
                    "created_by" to room.createdBy,
                    "created_by_name" to room.createdByName
                ))
            }
        } catch (_: Exception) {}
    }

    suspend fun getRoomMembers(roomId: String): List<StudyRoomMember> {
        if (!isConfigured) return emptyList()
        return try {
            val resp: JsonObject = client.get("$baseUrl/rest/v1/study_room_members") {
                headersBuilder(this)
                parameter("select", "*")
                parameter("room_id", "eq.$roomId")
            }.body()
            resp.jsonArray.map { el ->
                val obj = el as JsonObject
                StudyRoomMember(
                    id = obj["id"]?.jsonPrimitive?.content ?: "",
                    roomId = obj["room_id"]?.jsonPrimitive?.content ?: "",
                    email = obj["email"]?.jsonPrimitive?.content ?: "",
                    name = obj["name"]?.jsonPrimitive?.content ?: ""
                )
            }
        } catch (e: Exception) { emptyList() }
    }

    suspend fun joinRoom(roomId: String, email: String, name: String) {
        if (!isConfigured) return
        try {
            client.post("$baseUrl/rest/v1/study_room_members") {
                headersBuilder(this)
                header("Prefer", "resolution=merge-duplicates")
                contentType(ContentType.Application.Json)
                setBody(mapOf(
                    "id" to "${roomId}_$email",
                    "room_id" to roomId,
                    "email" to email,
                    "name" to name
                ))
            }
        } catch (_: Exception) {}
    }

    suspend fun getRoomMessages(roomId: String): List<StudyRoomMessage> {
        if (!isConfigured) return emptyList()
        return try {
            val resp: JsonObject = client.get("$baseUrl/rest/v1/study_room_messages") {
                headersBuilder(this)
                parameter("select", "*")
                parameter("room_id", "eq.$roomId")
                parameter("order", "created_at.asc")
            }.body()
            resp.jsonArray.map { el ->
                val obj = el as JsonObject
                StudyRoomMessage(
                    id = obj["id"]?.jsonPrimitive?.content ?: "",
                    roomId = obj["room_id"]?.jsonPrimitive?.content ?: "",
                    senderId = obj["sender_id"]?.jsonPrimitive?.content ?: "",
                    senderName = obj["sender_name"]?.jsonPrimitive?.content ?: "",
                    text = obj["text"]?.jsonPrimitive?.content ?: "",
                    createdAt = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault())
                        .parse(obj["created_at"]?.jsonPrimitive?.content ?: "2024-01-01T00:00:00")?.time
                        ?: System.currentTimeMillis()
                )
            }
        } catch (e: Exception) { emptyList() }
    }

    suspend fun sendRoomMessage(msg: StudyRoomMessage) {
        if (!isConfigured) return
        try {
            client.post("$baseUrl/rest/v1/study_room_messages") {
                headersBuilder(this)
                header("Prefer", "return=minimal")
                contentType(ContentType.Application.Json)
                setBody(mapOf(
                    "id" to msg.id,
                    "room_id" to msg.roomId,
                    "sender_id" to msg.senderId,
                    "sender_name" to msg.senderName,
                    "text" to msg.text
                ))
            }
        } catch (_: Exception) {}
    }
}
