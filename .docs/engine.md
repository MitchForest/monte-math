# 📖 Canonical Reference: Montessori-Inspired Digital Curriculum & Learning Engine

## 1. Curriculum Hierarchy

**Areas**

* Practical Life
* Sensorial
* Language
* Mathematics ✅ (starting point)
* Cultural Studies

**Domains**
Broad strands within each area (e.g., *Number & Operations*, *Geometry*, *Measurement & Data*, *Algebraic Thinking*).

**Topics**
Specific units (e.g., *Introduction to Whole Numbers*, *Column Multiplication*).

**Lessons**
The core instructional container. Each lesson can have:

* **Tutorial** — interactive explainer or video (often with a digital material).
* **Worked Examples** — guided, done-with-you steps; each tied to a *single skill*.
* **Practice Questions** — auto-scored items; each tied to a *single skill*; multiple per skill.
* **Review** — re-iteration of main takeaways.
* **(Optional) Mini-quiz** — short assessment across the skills in this lesson.

**Skills**
Atomic, assessable abilities (“can do in <60s”). Tracked in the knowledge graph.

**Quizzes / Checkpoints**
Periodic, larger assessments that sample across multiple skills. Each quiz item still maps back to a single primary skill.

---

## 2. Knowledge Graph

**Node = Skill**

* atomic, measurable, tagged with XP & difficulty.

**Relationships**

* `prerequisite(Skill → Skill)`
* `taught_by(Skill → Lesson)`
* `assessed_by(Skill → Item)`

**Lessons**

* may use one or more **materials** (digital number rods, golden beads, stamp game, etc.).
* skills don’t “own” materials; they inherit them via lessons.

---

## 3. Learning Flow (per Skill)

1. **Tutorial** — explanation/demo (interactive or video).
2. **Worked Example(s)** — step-through with scaffolds (skill-specific).
3. **Practice Questions** — multiple items per skill, auto-scored.
4. **Review** — quick recap.
5. **Assessment** — correctness + fluency.

---

## 4. Mastery & Fluency

* **Mastery (Correctness)**: % correct threshold, e.g., 3 of last 4, 8 of last 10.
* **Fluency (Speed)**: answer within skill-appropriate time.
* Both must be satisfied for a skill to count as mastered.

---

## 5. Decay & Retrieval Practice

* Skills decay over time. Even mastered skills re-surface.
* Reappearance intervals: 1 week → 1 month → 3 months → 6 months…
* Intervals reset or shorten if errors appear.
* Retrieval practice = learners periodically re-prove they can recall & apply the skill.

---

## 6. XP & Motivation

* XP awarded for:

  * completing tutorials
  * finishing worked examples
  * answering practice questions
  * completing quizzes/checkpoints
* Bonus XP for: fluency streaks, spaced-review mastery.
* XP tracks effort & engagement; mastery/fluency govern actual progression.

---

## 7. Entity Definitions

* **Area / Domain / Topic** = organizational containers.
* **Lesson** = unit of instruction (with tutorial, worked examples, practice, review).
* **Skill** = atomic ability (node in the knowledge graph).
* **Material** = digital manipulative used in lessons.
* **Item** = assessment unit (practice Q, worked example check, quiz item).
* **Quiz** = container for multiple items spanning skills.

---

## 8. Example (Topic: Column Multiplication)

**Skills**

* `mult_facts_mastery`
* `partial_products_single_digit`
* `place_value_shifts_tens_hundreds`
* `column_mult_2x1_with_regroup`
* `column_mult_2x2_no_zero`
* `column_mult_with_internal_zeros`

**Lessons**

* *Checkerboard Multiplication* (uses checkerboard; teaches partial products & place value shifts).
* *Large Bead Frame Multiplication* (uses bead frame; teaches 2×1 with regroup).
* *Paper Algorithm Multiplication* (abstract; teaches 2×2 with/without zeros).

**Flow (for one skill, `column_mult_2x1_with_regroup`)**

* Tutorial: interactive demo with bead frame.
* Worked Example: guided solve (234 × 6).
* Practice: 10+ items, timed.
* Review: regrouping recap.
* Quiz: part of checkpoint with related multiplication skills.

---