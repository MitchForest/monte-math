# Math Academy System Research

## Reference Links
- https://www.mathacademy.com/how-it-works
- https://www.mathacademy.com/how-our-ai-works
- https://www.mathacademy.com/pedagogy
- https://www.justinmath.com/cognitive-science-of-learning-spaced-repetition/
- https://www.justinmath.com/how-math-academy-creates-its-knowledge-graph/
- https://www.justinmath.com/individualized-spaced-repetition-in-hierarchical-knowledge-structures/

## System Overview
Math Academy’s learning platform combines an AI-driven learning engine, a large-scale hierarchical knowledge graph, and individualized spaced-repetition scheduling. The system continuously diagnoses each learner’s mastery, selects the next best task, and tracks retention over time. The components below summarize how the published materials describe the architecture.

## Core Components
- **Knowledge Graph:** Structured network of mathematical concepts with prerequisite, encompassing, and dependency relations that govern instruction order and mastery propagation.
- **Student Model:** Dynamic estimate of learner mastery, retention, and readiness across all nodes, updated after every scored interaction.
- **Learning Engine:** Orchestrator that ingests student-state data and outputs the next activity while coordinating diagnostics, practice, reviews, and lesson generation.
- **Task Selection Algorithm:** Decision layer that ranks potential problems, lessons, and reviews by expected learning impact under the current student model.
- **Spaced-Repetition Scheduler:** Memory model that times reviews based on predicted forgetting curves, leveraging both explicit review tasks and implicit practice opportunities.
- **Adaptive Diagnostics:** Multi-stage assessment process that efficiently calibrates a learner’s starting mastery across thousands of skills.
- **Motivation & Progression Layer:** XP, streaks, badges, and course pacing indicators that communicate mastery progress and sustain engagement.

## Knowledge Graph Structure
- **Nodes:** Fine-grained skills (procedural, conceptual, problem types). Each node stores metadata such as difficulty, content assets, diagnostic items, and review templates.
- **Edges:** Directed relationships capturing instructional dependencies:
  - *Prerequisite edges* specify immediate skills that must be reasonably mastered before attempting a target node.
  - *Component/encompassing edges* indicate hierarchical aggregation (e.g., sub-skills roll up into composite competencies) to support implicit practice.
  - *Lateral/supporting links* highlight helpful but non-mandatory connections for enrichment or alternate strategies.
- **Hierarchy:** The graph spans elementary through advanced collegiate mathematics with layered depth; nodes may inherit properties from ancestors (e.g., notation, representations) while propagating mastery credit upward.
- **Versioning & Expansion:** According to Math Academy’s articles, the graph is curated through iterative subject-matter expert review plus automated consistency checks to keep prerequisite chains acyclic and instructionally coherent.

## Mastery Calculation & Student Model
- **Bayesian/Probabilistic Updates:** Every graded interaction updates the mastery probability of the directly assessed node and its ancestors using a factor that accounts for difficulty, response correctness, and time. The published materials describe logistic-style updates similar to Item Response Theory.
- **Mastery Thresholds:** Nodes transition between states (Unknown → Learning → Mastered → Reinforcement) when posterior mastery passes specific probability thresholds.
- **Implicit Practice Credit:** Working on advanced nodes implicitly practices prerequisite nodes; the student model grants partial credit to ancestor skills proportional to their contribution to the current task.
- **Forgetting Dynamics:** Retention is tracked via a per-node decay parameter. The student model predicts mastery drift over time and flags nodes whose recall probability falls below target.
- **Diagnostic Seeding:** Initial mastery estimates come from adaptive diagnostic tasks that jump around the graph to reduce uncertainty quickly, then backfill children/prerequisites using probabilistic inference.

## XP, Gamification, and Motivation Systems
- **XP Economy:** Every completed task (lesson, practice set, multistep problem, review, quiz) awards eXperience Points scaled by performance—perfect runs yield bonus multipliers, while partial mastery grants proportionally less XP.
- **Progress Gates:** Course progress bars, level thresholds, and mastery heatmaps tie XP accrual to tangible milestones, reinforcing the mastery-based philosophy.
- **Streaks & Consistency Rewards:** Daily activity streaks unlock additional XP or cosmetic badges, encouraging regular practice that keeps the spaced-repetition queue manageable.
- **Unlockables:** Reaching mastery thresholds or accumulating XP can unlock enrichment topics, challenge problems, or “boss” quizzes that cap units.
- **Feedback Loop:** XP breakdowns after each task show contributions from accuracy, speed, and difficulty, guiding students toward deliberate improvement.

## Topic Composition & Task Types
- **Topics:** Cohesive bundles of nodes that share a thematic objective (e.g., “Solving Linear Equations”). Each topic typically includes:
  - *Introductory Lesson* with explanations and worked examples.
  - *Guided Practice* tasks targeting the primary node and its immediate prerequisites.
  - *Multistep Problems* that integrate several sibling nodes and require transfer.
  - *Targeted Reviews* surfaced by the spaced-repetition scheduler for retention of earlier subskills.
  - *Periodic Quizzes* or “mastery checks” assessing mastery across the topic’s scope.
- **Task Metadata:** Each task references the nodes it exercises, estimated duration, difficulty, XP payout, and mastery impact weights for direct and implicit skills.
- **Topic Completion:** Mastery of all constituent nodes and successful completion of the topic quiz transitions the learner to the next frontier or unlocks enrichment branches.

## Quizzes, Assessments, and Checkpoints
- **Periodic Quizzes:** Scheduled after major topics or units; they synthesize recent nodes and serve both as diagnostic refresh and XP milestone. Performance can trigger remediation loops or accelerated advancement.
- **Unit Reviews:** Larger cumulative assessments appear at strategic points (e.g., mid-course) to ensure knowledge graph coverage is solid before unlocking advanced clusters.
- **Adaptive Follow-up:** Quiz misses feed the diagnostic system—incorrect items spawn targeted lessons or reviews, and mastery probabilities for the associated nodes are reduced until relearned.
- **Summative Diagnostics:** End-of-course exams re-estimate mastery across the entire knowledge graph slice, informing placement for subsequent courses and updating long-term retention scheduling.

## Spaced Repetition & Retention Management
- **Spacing Function:** Each review candidate carries a predicted recall probability computed from the time since last successful practice, the learner’s history with the node, and difficulty-based decay constants.
- **Scheduling Policy:** The scheduler surfaces items when their recall probability approaches a forgetting threshold. Items can be serviced via dedicated review tasks or incidentally when the task selector assigns higher-level problems that include the skill (implicit practice).
- **Adaptive Intervals:** Successful reviews lengthen the next interval (raising confidence), while errors shorten it and may trigger targeted remedial practice.
- **Curriculum Flow Integration:** Spaced repetition is interleaved with new learning, ensuring that review load never overwhelms exploratory progress; the engine balances calendar-due reviews against forward motion priorities.

## Task Selection Algorithm
- **Candidate Generation:** For each session, the engine gathers a candidate set containing lessons, practice problems, mixed reviews, and diagnostics filtered by prerequisite readiness and time budget.
- **Scoring Dimensions:** Published descriptions reference multiple scoring axes—expected mastery gain, urgency (e.g., low recall probability), novelty, and learner preferences.
- **Exploration vs. Reinforcement:** The selector mixes frontier skills (unlocking new nodes once prerequisites are solid) with reinforcement tasks required by the spaced-repetition scheduler.
- **Optimization:** A utility function (often comparing expected learning gain per minute) ranks candidates. The engine deploys the top-ranked task, then re-runs the selection loop after each completion.
- **Constraints:** Hard constraints include prerequisite satisfaction, avoidance of redundant exposure, and alignment with long-term course pacing.

## Adaptive Diagnostics
- **Multi-Stage Assessment:** Initial placement uses rapid branching diagnostics that probe different strata of the knowledge graph, allowing the system to converge on the learner’s zone of proximal development in minutes.
- **Inference:** Diagnostic responses update entire subtrees: a correct answer on an advanced node implies likely mastery of prerequisites; an incorrect answer triggers targeted follow-up probing lower in the hierarchy.
- **Ongoing Micro-Diagnostics:** The engine periodically injects diagnostic-style questions to validate mastery when uncertainty grows or when a learner speeds through new material unusually fast.

## Learning Engine Workflow
1. **State Snapshot:** Pulls the latest mastery estimates, recall probabilities, and engagement metrics from the student model.
2. **Due Review Check:** Consults the spaced-repetition scheduler for urgent reviews; queues them as high-priority candidates.
3. **Frontier Expansion:** Identifies graph nodes that have all prerequisites mastered and match the learner’s goals.
4. **Candidate Scoring:** Applies the task selection algorithm to reviews, new lessons, practice problem sets, and diagnostics.
5. **Assignment Delivery:** Presents the highest-utility task with instructional scaffolding (lesson, example, or assessment).
6. **Mastery Update:** Logs the learner’s performance, updates mastery and retention, propagates implicit practice credit, and records telemetry for analytics.
7. **Loop:** Repeats the cycle, adjusting pacing and workload as the student progresses.

## Data & Feedback Loops
- **Telemetry Capture:** Every attempt stores time-on-task, hints used, error types, and mastery delta to refine difficulty calibrations.
- **Content Analytics:** Aggregated data inform edits to problem statements, lessons, and knowledge graph edges when anomalies arise (e.g., high failure rate despite prerequisites satisfied).
- **Instructor Dashboard:** Teachers can view mastery heatmaps keyed to the knowledge graph, schedule interventions, or pin supplemental lessons.
- **Learner Feedback:** Students see mastery summaries, upcoming reviews, and explanations of why a task was assigned, reinforcing metacognitive awareness.

## How the Pieces Fit Together
- The **knowledge graph** defines the instructional universe and governs allowable learning paths.
- The **student model** maintains probabilistic mastery and retention per node, feeding real-time data to other components.
- The **spaced-repetition scheduler** watches mastery decay and injects timely reviews, leveraging implicit practice from higher-level tasks.
- The **task selection algorithm** balances urgent reviews against forward progress, ensuring the learner stays on the optimal frontier.
- The **adaptive diagnostics** ensure the model remains calibrated, both at onboarding and during ongoing study.
- The **learning engine** orchestrates the workflow, using incoming performance data to iterate the cycle and personalize the experience.

This integrated architecture enables Math Academy to deliver individualized, mastery-based progression with tight coupling between content structure, cognitive science-informed spacing, and AI-driven task orchestration.
