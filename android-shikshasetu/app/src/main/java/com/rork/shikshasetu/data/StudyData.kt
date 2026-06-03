package com.rork.shikshasetu.data

import com.rork.shikshasetu.models.StudyPlan

object StudyData {
    data class DailyQuote(val text: String, val author: String)

    data class StudyTip(
        val title: String,
        val tip: String,
        val color: String,
        val iconEmoji: String
    )

    data class DailyUpdate(
        val title: String,
        val message: String,
        val type: String,
        val color: String
    )

    val quotes: List<DailyQuote> = listOf(
        DailyQuote("Education is the most powerful weapon which you can use to change the world.", "Nelson Mandela"),
        DailyQuote("The beautiful thing about learning is that no one can take it away from you.", "B.B. King"),
        DailyQuote("Live as if you were to die tomorrow. Learn as if you were to live forever.", "Mahatma Gandhi"),
        DailyQuote("Success is not final, failure is not fatal: it is the courage to continue that counts.", "Winston Churchill"),
        DailyQuote("The only way to do great work is to love what you do.", "Steve Jobs"),
        DailyQuote("It does not matter how slowly you go as long as you do not stop.", "Confucius"),
        DailyQuote("The mind is not a vessel to be filled, but a fire to be kindled.", "Plutarch"),
        DailyQuote("An investment in knowledge pays the best interest.", "Benjamin Franklin"),
        DailyQuote("The roots of education are bitter, but the fruit is sweet.", "Aristotle"),
        DailyQuote("You don't have to be great to start, but you have to start to be great.", "Zig Ziglar"),
        DailyQuote("The expert in anything was once a beginner.", "Helen Hayes"),
        DailyQuote("What we learn with pleasure we never forget.", "Alfred Mercier"),
        DailyQuote("In the middle of difficulty lies opportunity.", "Albert Einstein"),
        DailyQuote("The secret of getting ahead is getting started.", "Mark Twain"),
        DailyQuote("Believe you can and you're halfway there.", "Theodore Roosevelt"),
        DailyQuote("The future belongs to those who believe in the beauty of their dreams.", "Eleanor Roosevelt"),
        DailyQuote("Strive not to be a success, but rather to be of value.", "Albert Einstein"),
        DailyQuote("A person who never made a mistake never tried anything new.", "Albert Einstein"),
        DailyQuote("Intelligence plus character — that is the goal of true education.", "Martin Luther King Jr."),
        DailyQuote("The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", "Brian Herbert"),
        DailyQuote("Hard work beats talent when talent doesn't work hard.", "Tim Notke"),
        DailyQuote("Don't let what you cannot do interfere with what you can do.", "John Wooden"),
        DailyQuote("The more that you read, the more things you will know.", "Dr. Seuss"),
        DailyQuote("Tell me and I forget. Teach me and I remember. Involve me and I learn.", "Benjamin Franklin"),
        DailyQuote("Self-discipline is the bridge between goals and accomplishment.", "Jim Rohn"),
        DailyQuote("The only limit to our realization of tomorrow will be our doubts of today.", "Franklin D. Roosevelt"),
        DailyQuote("Knowledge is power. Information is liberating.", "Kofi Annan"),
        DailyQuote("The best time to plant a tree was 20 years ago. The second best time is now.", "Chinese Proverb"),
        DailyQuote("You are never too old to set another goal or to dream a new dream.", "C.S. Lewis")
    )

    val studyTips: List<StudyTip> = listOf(
        StudyTip("Spaced Repetition", "Review material at increasing intervals — 1 day, 3 days, 7 days.", "#8b5cf6", "🧠"),
        StudyTip("Pomodoro Technique", "Study for 25 minutes, then take a 5-minute break. After 4 rounds, take 15 min.", "#0ea5e9", "⏰"),
        StudyTip("Active Recall", "Close your book and try to recall what you just read. 3x more effective than re-reading!", "#10b981", "📑"),
        StudyTip("Teach to Learn", "Explain a concept to a friend or yourself out loud. Teaching forces deeper understanding.", "#f59e0b", "💡"),
        StudyTip("Tackle Weak Topics First", "Start with your weakest subject when your focus is at its peak.", "#ef4444", "📉"),
        StudyTip("Mind Maps", "Create visual mind maps to connect ideas. Visual learners retain 65% more.", "#ec4899", "🧠"),
        StudyTip("Morning Study", "Your brain is freshest in the morning. Use it for complex topics like Maths & Science.", "#14b8a6", "🌅"),
        StudyTip("Interleaving", "Mix different subjects in one session instead of one subject for hours.", "#6366f1", "📑"),
        StudyTip("Before You Sleep", "Revise key formulas right before sleeping. Your brain consolidates during sleep.", "#f97316", "🌙"),
        StudyTip("Practice Tests", "Take timed practice tests regularly. Reduces exam anxiety and improves time management.", "#0077b6", "📝")
    )

    val dailyUpdateList: List<DailyUpdate> = listOf(
        DailyUpdate("Study Smart", "Students who study in 25-min focused blocks score 23% higher on average.", "tip", "#0ea5e9"),
        DailyUpdate("Stay Hydrated", "Drinking water before studying improves concentration by 14%.", "reminder", "#10b981"),
        DailyUpdate("You Got This!", "Every expert was once a beginner. Keep pushing forward!", "motivation", "#f59e0b"),
        DailyUpdate("Did You Know?", "NCERT books cover 80-90% of board exam questions. Focus on NCERT first!", "fact", "#8b5cf6"),
        DailyUpdate("Quick Win", "Revise yesterday's notes for just 10 minutes. Strengthens memory by 60%.", "tip", "#0ea5e9"),
        DailyUpdate("Break Time", "Taking a 5-min walk between study sessions boosts creativity and focus.", "reminder", "#10b981"),
        DailyUpdate("Believe In Yourself", "Consistency beats intensity. 1 hour daily > 7 hours on Sunday.", "motivation", "#f59e0b"),
        DailyUpdate("Exam Hack", "Practice previous year papers in exam conditions. Reduces anxiety by 40%.", "fact", "#8b5cf6"),
        DailyUpdate("Morning Power", "Your brain retains complex concepts best between 6-10 AM.", "tip", "#0ea5e9"),
        DailyUpdate("Sleep Matters", "7-8 hours of sleep consolidates memory. Never sacrifice sleep for studies.", "reminder", "#10b981")
    )

    fun getDailyQuote(): DailyQuote {
        val dayIndex = (System.currentTimeMillis() / (1000 * 60 * 60 * 24)) % quotes.size
        return quotes[dayIndex.toInt()]
    }

    fun getDailyTips(): List<StudyTip> {
        val dayIndex = (System.currentTimeMillis() / (1000 * 60 * 60 * 24)).toInt()
        return listOf(
            studyTips[dayIndex % studyTips.size],
            studyTips[(dayIndex + 7) % studyTips.size],
            studyTips[(dayIndex + 3) % studyTips.size]
        )
    }

    fun getDailyUpdates(): List<DailyUpdate> {
        val dayIndex = (System.currentTimeMillis() / (1000 * 60 * 60 * 24)).toInt()
        return listOf(
            dailyUpdateList[dayIndex % dailyUpdateList.size],
            dailyUpdateList[(dayIndex + 5) % dailyUpdateList.size]
        )
    }

    private val boardClassStudyPlans: Map<String, List<StudyPlan>> = mapOf(
        "CBSE_10" to listOf(
            StudyPlan("Mathematics", "Quadratic Equations - Practice factoring", "30 min", "#3b82f6", "📐", "high"),
            StudyPlan("Science", "Chemical Reactions & Balancing", "25 min", "#10b981", "🧪", "high"),
            StudyPlan("English", "Letter Writing - Formal format", "20 min", "#8b5cf6", "✍️", "medium"),
            StudyPlan("Social Science", "French Revolution key events", "20 min", "#f59e0b", "🌍", "medium"),
            StudyPlan("Hindi", "Vyakaran - Samas Practice", "15 min", "#ef4444", "📖", "low"),
            StudyPlan("Mathematics", "Trigonometry - Sin, Cos, Tan identities", "35 min", "#3b82f6", "📐", "high"),
            StudyPlan("Science", "Electricity - Ohm's Law problems", "30 min", "#10b981", "⚡", "high"),
            StudyPlan("English", "Comprehension passage practice", "20 min", "#8b5cf6", "📝", "medium"),
            StudyPlan("Social Science", "Resources & Development - Map work", "20 min", "#06b6d4", "🗺️", "medium"),
            StudyPlan("Mathematics", "Statistics - Mean, Median, Mode", "25 min", "#3b82f6", "📊", "high"),
            StudyPlan("Science", "Life Processes - Nutrition in plants", "25 min", "#10b981", "🌱", "high"),
            StudyPlan("Social Science", "Indian Economy - Sectors", "20 min", "#f59e0b", "💹", "medium"),
            StudyPlan("Mathematics", "Coordinate Geometry - Distance formula", "30 min", "#3b82f6", "📏", "high"),
            StudyPlan("Science", "Light - Reflection & Refraction", "30 min", "#10b981", "💡", "high"),
            StudyPlan("English", "Grammar - Active & Passive Voice", "20 min", "#8b5cf6", "📚", "medium")
        ),
        "CBSE_9" to listOf(
            StudyPlan("Mathematics", "Number Systems - Rational & Irrational", "30 min", "#3b82f6", "📐", "high"),
            StudyPlan("Science", "Matter in Our Surroundings", "25 min", "#10b981", "🧪", "high"),
            StudyPlan("English", "Beehive - The Fun They Had", "20 min", "#8b5cf6", "📖", "medium"),
            StudyPlan("Social Science", "India - Size and Location", "20 min", "#f59e0b", "🌍", "medium"),
            StudyPlan("Mathematics", "Polynomials - Factorization", "30 min", "#3b82f6", "📊", "high"),
            StudyPlan("Science", "Motion - Speed, Velocity, Acceleration", "30 min", "#10b981", "⚡", "high")
        ),
        "ICSE_10" to listOf(
            StudyPlan("Physics", "Force, Work, Power & Energy", "35 min", "#3b82f6", "⚡", "high"),
            StudyPlan("Chemistry", "Periodic Table - Groups & Periods", "30 min", "#10b981", "🧪", "high"),
            StudyPlan("Mathematics", "Quadratic Equations - Discriminant", "30 min", "#8b5cf6", "📐", "high"),
            StudyPlan("Biology", "Cell Division - Mitosis & Meiosis", "25 min", "#ef4444", "🔬", "high"),
            StudyPlan("English Literature", "Merchant of Venice - Act 1", "20 min", "#f59e0b", "📚", "medium"),
            StudyPlan("Geography", "Map Study - Topographic Sheets", "25 min", "#06b6d4", "🗺️", "medium")
        )
    )

    val defaultStudyPlans: List<StudyPlan> = listOf(
        StudyPlan("Mathematics", "Quadratic Equations - Practice factoring", "30 min", "#3b82f6", "📐", "high"),
        StudyPlan("Science", "Chemical Reactions & Balancing", "25 min", "#10b981", "🧪", "high"),
        StudyPlan("English", "Letter Writing - Formal format", "20 min", "#8b5cf6", "✍️", "medium"),
        StudyPlan("Social Science", "French Revolution key events", "20 min", "#f59e0b", "🌍", "medium"),
        StudyPlan("Hindi", "Vyakaran - Samas Practice", "15 min", "#ef4444", "📖", "low"),
        StudyPlan("Mathematics", "Trigonometry identities", "35 min", "#3b82f6", "📐", "high"),
        StudyPlan("Science", "Electricity - Ohm's Law problems", "30 min", "#10b981", "⚡", "high"),
        StudyPlan("English", "Comprehension passage practice", "20 min", "#8b5cf6", "📝", "medium"),
        StudyPlan("Geography", "Resources & Development", "20 min", "#06b6d4", "🗺️", "medium"),
        StudyPlan("Mathematics", "Statistics - Mean, Median, Mode", "25 min", "#3b82f6", "📊", "high"),
        StudyPlan("Science", "Life Processes - Nutrition", "25 min", "#10b981", "🌱", "high"),
        StudyPlan("Social Science", "Indian Economy - Sectors", "20 min", "#f59e0b", "💹", "medium"),
        StudyPlan("Mathematics", "Coordinate Geometry", "30 min", "#3b82f6", "📏", "high"),
        StudyPlan("Science", "Light - Reflection & Refraction", "30 min", "#10b981", "💡", "high"),
        StudyPlan("English", "Grammar - Active & Passive Voice", "20 min", "#8b5cf6", "📚", "medium")
    )

    fun getDailyStudyPlan(board: String? = null, classId: String? = null): List<StudyPlan> {
        val dayIndex = (System.currentTimeMillis() / (1000 * 60 * 60 * 24)).toInt()
        var pool = defaultStudyPlans

        if (board != null && classId != null) {
            val key = "${board}_$classId"
            boardClassStudyPlans[key]?.let { pool = it }
        }

        return listOf(
            pool[dayIndex % pool.size],
            pool[(dayIndex + 4) % pool.size],
            pool[(dayIndex + 8) % pool.size]
        )
    }

    fun getExamCountdown(examDate: String): String? {
        val examMap = mapOf(
            "weekly" to 7,
            "monthly" to 30,
            "3months" to 90,
            "board" to 180
        )
        return examMap[examDate]?.let { "~$it days" }
    }
}
