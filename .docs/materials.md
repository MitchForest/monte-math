# Tech Stack & Interactive Materials Plan

## Implementation Stack

- **Scene Runtime**: React + PixiJS (via `@pixi/react`) inside the existing Next.js app to render performant 2D canvases, reuse React state, and keep lesson UI in standard components.
- **State & Data**: Centralize lesson/material configuration in shared TypeScript schemas (see `packages/shared`) so each material instance reads skills/topics/XP metadata directly from curriculum JSON.
- **Interaction Layer**: Compose drag/drop, snapping, highlighting, and timed prompts with Pixi interaction events, backed by Zustand for deterministic replay and analytics.
- **Design Tokens**: Define shared color, spacing, and typography tokens in a small JSON/TSS module to ensure visual consistency across dynamically generated assets.

## Build Workflow

1. **Bootstrap** a `materials` feature package that exports reusable Pixi scene wrappers, touch/mouse helpers, and animation utilities.
2. **Define Schemas** describing each material’s configurable parameters (e.g., rod lengths, fraction partitions, allowed digit range) using `zod` alongside existing curriculum types.
3. **Scene Prototypes**: Implement 2–3 representative manipulatives (Number Rods, Fraction Circles, Equation Balance) to validate runtime performance and API shape.
4. **Authoring Configs**: Create JSON/YAML lesson bindings that map lessons/skills to materials plus parameter presets; surface these through the lesson player.
5. **Lesson Integration**: Extend the Lesson Player (from the upcoming web flow in `.docs/ui-ux.md`) to mount a material scene during Tutorial/Worked Example phases and log interactions for XP/assessment events.
6. **Testing & QA**: Ship Storybook stories or Playwright visual tests for each material, covering keyboard/touch accessibility and correctness checks.
7. **Deployment Hooks**: Cache generated Pixi textures per session and expose a debug overlay so designers can inspect hit areas/IDs.

## Asset Generation Strategy

- **Runtime Generation (Recommended)**: Use Pixi `Graphics` to programmatically draw rods, tiles, grids, counters, and fraction wedges on demand; this keeps assets resolution-independent, easy to theme, and curriculum-configurable.
- **Texture Caching**: After drawing, convert to textures/sprites so repeated pieces (e.g., ten-rod) are reused without redrawing every frame.
- **Sparse Static Assets**: Only store external files for brand elements (logos, background parchment), specialized icons, fonts, or optional audio cues. Everything else derives from code and configuration.
- **Export Option**: If designers need static previews, provide a build script that snapshots runtime-generated assets to PNG/SVG; these remain artifacts, not source of truth.
- **Pre-generation Tradeoff**: Pre-rendering every material variant would inflate bundles, complicate theming/localization, and reduce flexibility. Runtime generation with caching keeps bundle size small and makes it trivial to adjust colors, labels, or language based on user profile.

## Implementation Considerations

- Keep interaction logic declarative so time-travel debugging and telemetry align with mastery/fluency metrics (`.docs/engine.md`).
- Ensure every material exposes accessibility affordances (tab focus, narration hooks) in line with the lesson flow described in `.docs/ui-ux.md`.
- Provide a lightweight developer playground page that mounts any material with ad-hoc props for rapid iteration.

---

# Canonical 2D Materials Catalogue

Each material lists a description plus the key lessons (from `.docs/content.md`) where it appears. Many lessons share manipulatives; tune parameters per lesson.

## Number Sense & Early Operations

- **Counting Rods & Loose Counters**  
  Description: Colored rods and individual counters to model one-to-one counting, early patterns, and skip-counting.  
  Lessons: `Counting & One-to-One`, `Teens and Tens Composition`, `Skip-count chains` within `01 Math: Introduction to Whole Numbers`.
- **Sandpaper Numerals / Finger Trace Pad**  
  Description: Tactile tracing surface with visual stroke guides reinforcing numeral formation.  
  Lessons: `Numerals & Zero`, `Read/Write/Compare to 100`.
- **Spindle Box & Numeral Cards**  
  Description: Bins that accept dragged spindles with numeral labels, emphasizing zero and quantity grouping.  
  Lessons: `Numerals & Zero`, `Counting & One-to-One`.
- **Teens & Tens Boards with Bead Bars**  
  Description: Board slots for ten-bars and unit beads to compose numbers 11–99.  
  Lessons: `Teens and Tens Composition`, `Compose/Decompose Numbers`.
- **Hundred Board & Skip-Count Chains**  
  Description: 10×10 grid revealing number patterns, with bead chains overlay for skip-counting.  
  Lessons: `Read/Write/Compare to 100`, `Skip-count by 2s/5s/10s` (within `01 Math`, `10 Math`).

## Place Value & Arithmetic Algorithms

- **Place Value Mat & Digit Discs**  
  Description: Columnar mat (ones→thousands) with draggable digit discs for regrouping.  
  Lessons: `Hundreds & Thousands`, `Column Addition (with regroup)`, `Column Subtraction (with regroup/borrow)`.
- **Stamp Game Tiles**  
  Description: Flat tiles representing units/tens/hundreds/thousands for concrete addition/subtraction/multiplication/division work.  
  Lessons: `Compose/Decompose Numbers`, `Column Addition`, `Column Subtraction`, `Multi-digit × 1-digit`, `Long Division Setup`.
- **Golden Bead Addition Mat**  
  Description: Place-value mat with golden bead units, tens, hundreds, and thousands plus large number cards to model multi-digit addition trades.  
  Lessons: `Column Addition (with regroup)`, `Compose/Decompose Numbers`, `Addition Word Problems`.
- **Addition & Subtraction Strip Boards**  
  Description: Number strips that combine to 10, supporting fact families and mental strategies.  
  Lessons: `Addition as Combining`, `Subtraction as Taking/Comparing`, `Addition Facts Fluency`, `Subtraction Facts Fluency`.
- **Snake Game / Bead Stair**  
  Description: Colored bead sequences converting snake chains into golden tens, reinforcing make-10 strategies.  
  Lessons: `Properties & Mental Strategies`, `Fact Families & Mental Agility`.
- **Checkerboard Multiplication (2D)**  
  Description: Colored checkerboard highlighting partial products with digit cards and bead bars.  
  Lessons: `Partial Products (concept)`, `2×1 Column Multiplication`, `2×2 Column Multiplication`.
- **Long Division Board**  
  Description: Scaffolded workspace showing partial quotients, divisor columns, and remainder trays.  
  Lessons: `Division Concepts & Remainders`, `Long Division Setup & Place-Value Reasoning`, `÷ by 2-Digits`.

## Fractions, Decimals, and Percents

- **Fraction Circles & Bars**  
  Description: Partitionable circles and bars with snap-to overlays for equivalence, comparison, and operations.  
  Lessons: `Partitioning & Unit Fractions`, `Equivalence & Simplification`, `Compare Fractions`, `Fraction Word Problems & Estimation`.
- **Fraction Number Line**  
  Description: Zoomable number line with tick marks and draggable fractions for placement and ordering.  
  Lessons: `Fractions on the Number Line`, `Compare/Order with Common Denominators`, `Estimate Fraction Sums/Differences`.
- **Decimal Place Value Board**  
  Description: Tenths/hundredths/thousandths grid with highlights for rounding and comparison.  
  Lessons: `Decimal Place Value (to thousandths)`, `Compare/Order & Round Decimals`, `Add/Subtract Decimals`.
- **Percent Hundred Grid & Ratio Bars**  
  Description: 10×10 shading grid plus double number line for percent, ratio, and rate problems.  
  Lessons: `Percent as Per-Hundred; Conversions`, `Percent of a Quantity`, `Unit Rates`, `Solve Proportions`, `Scale Drawings`.
- **Applied Measurement Workspace**  
  Description: Canvas combining rulers, measuring tapes, and conversion sliders for decimal measurement contexts.  
  Lessons: `Measurement with Decimals & Conversions`, `Multi-step Decimal Word Problems`.

## Measurement & Data Displays

- **Interactive Clock (Analog & Digital)**  
  Description: Draggable clock hands with synchronized digital readout to explore elapsed time.  
  Lessons: `Tell Time to the Minute`, `Elapsed Time`.
- **Coin & Bill Drawer**  
  Description: Currency trays allowing count, exchange, and change-making scenarios.  
  Lessons: `Money: Values & Change`, `Money Word Problems`, `Money Applications`.
- **Ruler, Tape, and Geoboard Toolkit**  
  Description: Snap-to grid with adjustable rulers and coordinate pegs for measuring length, perimeter, and area.  
  Lessons: `Length: Measuring & Converting`, `Perimeter Basics`, `Area of Rectangles & Composites`, `Composite Area`.
- **Balance Scale & Weight Sets**  
  Description: Dual-pan balance with unit weights to compare masses and support algebraic thinking.  
  Lessons: `Mass/Weight`, `Balance equations in One-Step Equations`.
- **Thermometer & Volume Lab**  
  Description: Adjustable thermometer graphic and pourable cylinders/jugs for temperature and volume work.  
  Lessons: `Liquid Volume`, `Temperature`, `Measurement with Decimals & Conversions`.
- **Data Plotter & Graph Builder**  
  Description: Drag data cards into bar, line, and pie chart templates with statistical summaries.  
  Lessons: `Read/Interpret Graphs`, `Create Graphs from Data`, `Mean/Median/Mode/Range`, `Data Interpretation & Conclusions`.

## Geometry & Spatial Reasoning

- **Constructive Triangles & Polygon Cabinet**  
  Description: Triangle sets and shape frames for classification and composition tasks.  
  Lessons: `Polygons Overview`, `Triangles (by sides & angles)`, `Quadrilaterals`, `Polygon Classification`.
- **Symmetry Mirror & Pattern Blocks**  
  Description: Reflective axis with polygons for symmetry, congruence, and tessellation exploration.  
  Lessons: `Symmetry & Composition`, `Congruence via Rigid Motions`, `Similarity & Scale Factor`.
- **Angle Maker with Protractor**  
  Description: Adjustable rays with live angle readout and snap-to increments.  
  Lessons: `Angles: Types & Relationships`, `Measure Angles`, `Angle Relationships`, `Angle Sums`.
- **Pythagorean Dissection Board**  
  Description: Moveable square areas showing `a² + b² = c²` via rearrangement, plus coordinate grid for distance.  
  Lessons: `Understand Relationship`, `Compute Missing Sides`, `Distance on Grid (extension)`.
- **Area & Perimeter Playground**  
  Description: Composite shape builder to decompose/recompose and compare perimeters/areas.  
  Lessons: `Area of Triangles & Parallelograms`, `Area of Trapezoids & Regular Polygons`, `Composite Area`, `Perimeter Review in Context`.

## Algebra & Advanced Number

- **Integer Two-Color Counters & Number Line**  
  Description: Positive/negative chips with center-zero number line for signed operations.  
  Lessons: `Integers on the Number Line; Compare/Order`, `Add/Subtract Integers`, `Multiply/Divide Integers`, `Absolute Value`.
- **Equation Balance & Algebra Tiles**  
  Description: Scale visualization with variable and constant tiles to model equation solving.  
  Lessons: `One-Step Equations (±, ×/÷)`, `Two-Step & Distributive in Equations`.
- **Expression Builder & Order Tracker**  
  Description: Drag operators, parentheses, and exponents into slots with live evaluation.  
  Lessons: `Evaluate Expressions & Order of Operations`, `Translate Words ↔ Expressions`, `Order of Operations with Exponents`.
- **Exponent & Root Explorer**  
  Description: Stackable exponent blocks and slider-based square/cube root visuals.  
  Lessons: `Exponent Notation & Evaluation`, `Powers of 10 (place-value link)`, `Square Root Concept; Perfect Squares`, `Cube Root Concept & Perfect Cubes`.
- **Sequence & Function Machines**  
  Description: Input/output cards with adjustable rules to explore sequences, unit rates, and proportional reasoning.  
  Lessons: `Unit Rates`, `Solve Proportions`, `Mixtures & Concentrations`, `Speed–Time–Distance`, `Evaluate Expressions & Order of Operations`.

---

This catalogue will evolve as we build authoring tools; the recommended workflow above keeps materials data-driven and responsive while minimizing asset overhead.
