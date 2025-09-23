# 🌟 User Journey

### 1. Entry & Setup

- **Parent/Student Setup Screen**
  - Create profile (student name/avatar).
  - Set **daily XP goal** (e.g. 20 XP ≈ 20 min).
  - Explain XP → minutes mapping in plain language.

- **Diagnostic Test Intro**
  - Quick explanation: “We’ll ask you some questions to see what you already know.”
  - Target \~15–45 min, adaptive.
  - **Two metrics**:
    - _Mastery_ (correctness)
    - _Automaticity_ (speed, fact fluency)

### 2. Adaptive Diagnostic

- **Question Player (Diagnostic Mode)**
  - Mix of conceptual & fluency checks.
  - Skip logic: engine quickly finds ceiling/floor in each strand.
  - Visual progress indicator (“10 min left…”).

- **Results Page (for parent & student)**
  - Simple: “You are here” marker on a path.
  - Behind the scenes: engine sets initial mastery states in the skill graph.

### 3. Daily Learning Flow

- **Home Dashboard**
  - Shows:
    - XP goal for today (progress bar).
    - Streak & total XP.
    - Next lesson/quiz queued by engine.

- **Lesson Flow**
  - Tutorial → Worked Example(s) → Practice → Review.
  - Each step visibly earns XP (e.g. Tutorial 2 XP, Worked Example 1 XP, each Practice Q \~1 XP).
  - Progress bar shows both _skill mastery_ and _XP earned_.

- **Periodic Quizzes**
  - Engine injects checkpoints (multi-skill).
  - Clearly branded as “Checkpoint” to reduce anxiety.
  - Earn XP as normal, plus bonus for streaks.

### 4. Review & Retrieval Practice

- **Spaced Review Screen**
  - “Let’s see if you still remember…”
  - Engine picks older mastered skills for retrieval.
  - Quicker format (flash style, \~5–10 items).

- **Decay Visualization (Parent View)**
  - Dashboard shows skills that are “green (fresh) → yellow (needs review) → red (forgotten).”

### 5. Parent/Student Oversight

- **Parent View**
  - Daily/weekly XP log.
  - Current mastered skills, pending reviews.
  - Time-on-task vs. XP alignment.

- **Student View**
  - Simple: XP earned today, streaks, avatar leveling up.
  - No overwhelming curriculum map — focus stays on “next step.”

---

# 🖥️ Pages & Components

### Onboarding

- Profile creation
- XP goal setting (slider: 10–60 XP/day)

### Diagnostic Player

- Adaptive question player
- Timer/progress bar
- Results screen (simple skill-path view)

### Home / Dashboard

- XP goal tracker
- Next Lesson card
- Review queue card
- Streaks & badges

### Lesson Player

- **Tutorial view**: video/interactive demo
- **Worked Example**: step-through w/ hinting
- **Practice Qs**: item player w/ timer feedback
- **Review card**: summary of what was just learned

### Quiz / Checkpoint Player

- Multi-skill items
- End-screen feedback: strengths & gaps
- XP bonus for streak

### Review Player

- Quick retrieval practice session
- Color-coded feedback (fresh vs. forgotten)

### Parent Dashboard

- XP progress (daily/weekly)
- Mastery vs. fluency overview
- Retrieval schedule (what’s coming up)
- Option to adjust XP goal

---

# 🔑 Design Principles

- **No course selection**: engine chooses what’s next, student just hits “Start.”
- **XP is time proxy**: \~1 XP/minute of focused effort.
- **Skills invisible to student**: they see lessons, not skill IDs.
- **Spaced review is lightweight**: framed as quick checkups, not tests.
- **Parent transparency**: parents see the underlying mastery/fluency, not the child.
- **Student motivation**: streaks, avatars, XP milestones.

---
