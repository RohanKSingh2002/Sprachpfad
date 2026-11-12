from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.section import WD_SECTION
from pathlib import Path

OUT = Path(r"R:\Projects\sprachpfad\output\hyperlingua-course-and-study-path-audit.docx")
OUT.parent.mkdir(parents=True, exist_ok=True)

NAVY = "172842"
BLUE = "315B84"
PALE = "EEF3F8"
MID = "D6E0EA"
INK = "202A36"
MUTED = "526579"

doc = Document()
sec = doc.sections[0]
sec.top_margin = Inches(.65)
sec.bottom_margin = Inches(.65)
sec.left_margin = Inches(.75)
sec.right_margin = Inches(.75)

styles = doc.styles
normal = styles["Normal"]
normal.font.name = "Aptos"
normal.font.size = Pt(9.5)
normal.font.color.rgb = RGBColor.from_string(INK)
normal.paragraph_format.space_after = Pt(5)
normal.paragraph_format.line_spacing = 1.08

for name, size, color in [("Title", 25, NAVY), ("Heading 1", 16, NAVY), ("Heading 2", 11, BLUE)]:
    st = styles[name]
    st.font.name = "Aptos Display" if name != "Heading 2" else "Aptos"
    st.font.size = Pt(size)
    st.font.bold = True
    st.font.color.rgb = RGBColor.from_string(color)
    st.paragraph_format.keep_with_next = True
    st.paragraph_format.space_before = Pt(10 if name != "Title" else 0)
    st.paragraph_format.space_after = Pt(5)

def shade(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)

def cell_margins(cell, top=85, start=95, bottom=85, end=95):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    mar = OxmlElement("w:tcMar")
    for side, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = OxmlElement(f"w:{side}")
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")
        mar.append(node)
    tc_pr.append(mar)

def style_table(table, widths=None):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.style = "Table Grid"
    for row_i, row in enumerate(table.rows):
        tr_pr = row._tr.get_or_add_trPr()
        cant_split = OxmlElement("w:cantSplit")
        tr_pr.append(cant_split)
        for col_i, cell in enumerate(row.cells):
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            cell_margins(cell)
            if widths:
                cell.width = Inches(widths[col_i])
            if row_i == 0:
                shade(cell, NAVY)
            elif row_i % 2 == 0:
                shade(cell, PALE)
            for p in cell.paragraphs:
                p.paragraph_format.space_after = Pt(1)
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.line_spacing = 1.0
                for run in p.runs:
                    run.font.name = "Aptos"
                    run.font.size = Pt(8.1)
                    if row_i == 0:
                        run.font.bold = True
                        run.font.color.rgb = RGBColor(255, 255, 255)

def add_table(headers, rows, widths=None):
    t = doc.add_table(rows=1, cols=len(headers))
    for c, text in zip(t.rows[0].cells, headers):
        c.text = text
    for row in rows:
        cells = t.add_row().cells
        for c, text in zip(cells, row):
            c.text = str(text)
    style_table(t, widths)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)
    return t

def p(text="", style=None, bold_lead=None):
    para = doc.add_paragraph(style=style)
    if bold_lead and text.startswith(bold_lead):
        para.add_run(bold_lead).bold = True
        para.add_run(text[len(bold_lead):])
    else:
        para.add_run(text)
    return para

def bullet(text, level=0):
    para = doc.add_paragraph(style="List Bullet" if level == 0 else "List Bullet 2")
    para.paragraph_format.space_after = Pt(2)
    para.add_run(text)
    return para

def h(text, level=1):
    doc.add_heading(text, level=level)

# A quiet running footer helps readers orient themselves without crowding the pages.
footer = sec.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.RIGHT
footer.paragraph_format.space_before = Pt(2)
r = footer.add_run("Sprachpfad course research  |  6 November 2026")
r.font.name = "Aptos"
r.font.size = Pt(8)
r.font.color.rgb = RGBColor.from_string(MUTED)

title = doc.add_paragraph(style="Title")
title.add_run("HyperLingua Course and Study Path Audit")
subtitle = doc.add_paragraph()
subtitle.paragraph_format.space_after = Pt(11)
sr = subtitle.add_run("Signed-in app review for improving Sprachpfad")
sr.font.name = "Aptos"
sr.font.size = Pt(12)
sr.font.color.rgb = RGBColor.from_string(MUTED)

h("Purpose and conclusion")
p("This document maps the German course structure and the study controls visible in HyperLingua's signed-in web app. The strongest reusable idea for Sprachpfad is a sentence-level practice loop: listen, repeat, retrieve the target-language sentence from a prompt, rebuild it, rate confidence, and schedule the next review from that rating. HyperLingua wraps this loop in topic collections, flexible practice filters, audio controls, and a configurable daily target.")
p("The review is intended to guide original Sprachpfad design. It records course organization, item counts, exercise formats, and settings; it does not reproduce HyperLingua's lesson sentences or other lesson text.")

h("Review coverage")
p("I inspected the signed-in Home and Lessons views, the German Language Islands topic map and all eight topic lists, representative island cards, Vocabulary Builder, My Collections and its import wizard, Community content, practice controls, Stats, Badges, Leaderboard, Messages, and Profile settings. The app was left on Home. I did not rate material, save settings, submit imported text, opt in to the leaderboard, buy an upgrade, or change account details.")
p("The inventory below is a complete catalog of the 54 German islands displayed across the eight topic groups at the time of review. Individual lesson content was not copied or exhaustively read. Counts are the counts displayed on island cards and are not a claim that every sentence is unique across groups.")

h("Product map")
add_table(["Area", "Observed organization and role"], [
    ("Home", "Today and Lessons tabs; Smart Review combines due and fresh sentences; daily goal, source and batch controls; links to challenge, vocabulary, islands, collections and community."),
    ("Language Islands", "Eight everyday or interest-based topics containing 54 German islands. Islands may include sentence lists, dialogues and narrations; some are tagged as Pro."),
    ("Vocabulary Builder", "Twenty categories grouped into Beginner, Intermediate and Advanced bands; category/frequency framing and favorite controls."),
    ("My Collections", "A learner library for imported or AI-generated islands. Import flow previews and edits sentence splitting before voice and island generation."),
    ("Community content", "A beta directory of shared islands and authors, adding discovery beyond the learner's own collections."),
    ("Progress and motivation", "Skills, Practice and Charts views; daily points, badges and an optional leaderboard."),
    ("Profile", "Separate learning and native language choices, Light/Dark/Auto appearance, replayable tips, account and subscription information."),
], [1.35, 5.65])

h("Course structure")
p("The German Islands map is organized around practical topics rather than a visible, single linear course. The topic picker showed these groups and island totals:")
add_table(["Topic group", "Islands", "Focus shown in the app"], [
    ("Learn the Basics", "14", "Alphabet, core grammar and survival phrases"),
    ("Family & Relationships", "3", "Family, friendship and relationships"),
    ("Household & Daily Life", "7", "Home routines, chores and everyday needs"),
    ("Social Interactions", "3", "Plans, politeness, preferences and opinions"),
    ("Hobbies", "11", "Leisure, interests and activities"),
    ("Work", "9", "Office, careers and professional fields"),
    ("Travel & Abroad", "4", "Airports, lodging, sightseeing and transport"),
    ("Eating Out & Shopping", "3", "Restaurants, cafes and shopping"),
], [1.75, .7, 4.55])
p("The topic picker presents a short four-step cue: Listen, Say, Build, Rate. It also tells learners to pick one topic and says they do not need to finish it. This makes each island a reusable practice pool, while the Home Smart Review selects a daily batch across the chosen source.")

h("Island formats and exercise families")
add_table(["Format", "What the app exposes", "Design pattern"], [
    ("Sentence collections", "Cards show a title and sentence count. A list supports audio, reveal, favorites, ratings, copy, and selection of a range." , "Teach with small, searchable banks of usable sentences rather than only chapter-sized lessons."),
    ("Dialogues", "Some islands include dialogue counts alongside sentences." , "Put target language into turn-taking and conversational context."),
    ("Narrations", "Some islands include narration counts alongside sentences." , "Add connected speech and longer listening practice."),
    ("Question and answer sets", "The Basics includes three large Questions & Answers parts." , "Use prompt-response pairs to rehearse common information exchange."),
    ("Language patterns", "The Basics includes three Language Patterns parts." , "Practice a reusable structure across varied examples."),
    ("Survival kit", "A Pro-tagged 300 Spartan island is described as high-impact real-life sentences." , "Prioritize immediate utility and offer focused starter packs."),
    ("Vocabulary sets", "A separate categorized builder has level bands and favorites." , "Keep lexical study available alongside sentence production."),
], [1.25, 2.55, 3.2])
p("Each sentence can be approached in two modes. Listen & Repeat supports shadowing with playback and repeat controls. Active Recall asks the learner to produce or reconstruct the target-language sentence from a native-language prompt, then reveal and check the answer. A Challenge workflow uses word tiles to rebuild the sentence, and Focus Mode presents a dedicated one-sentence session.")

h("The four-step sentence loop")
add_table(["Step", "Learner action", "Purpose"], [
    ("1 Listen and repeat", "Hear the target sentence and say it aloud, with repeat and pause controls.", "Build sound, rhythm and pronunciation familiarity."),
    ("2 Recall", "Translate the prompt from the native language into the language being learned, then reveal the reference sentence.", "Retrieve meaning and wording from memory."),
    ("3 Build", "Reconstruct the sentence from word tiles in the challenge flow.", "Notice word order and sentence parts."),
    ("4 Rate", "Give a 1-5 knowledge rating.", "Use confidence to determine review timing; lower ratings return sooner, while five marks mastery."),
], [.85, 3.5, 2.65])
p("The guide describes the same four actions as shadowing, active recall, challenge, and rating. The app's broader Smart Review combines due items with new items and shows a daily count, so a learner can alternate curated course material with sentence-level spaced review.")

h("Practice controls")
add_table(["Control area", "Options observed"], [
    ("Sentence selection", "All items, 10, 20 or a custom range; search; rating range; include unrated; rate all; select a sentence range and play or save it."),
    ("Quick display", "Show or hide translation; enable dual-language audio."),
    ("Audio", "Repeat each line 1-5 times; set the pause between repeats; choose playback speed from 0.5x to 2x; loop playback. Dual audio can play native-language audio once and pause between languages."),
    ("Text and order", "Four text sizes; Original, Easy-to-Hard and Hard-to-Easy sort; filter by star rating; choose when rating feedback appears (first three, always or off)."),
    ("Session modes", "Listen & Repeat, Active Recall, Focus Mode and Challenge. Focus Mode is a single-sentence session; Challenge awards points in Stats."),
    ("Favorites and ranges", "Favorite islands or vocabulary sets; select a sentence range and play it or save it to a collection."),
], [1.5, 5.5])

h("Controls that shape a study path")
add_table(["Setting", "Observed behavior", "Implication for Sprachpfad"], [
    ("Daily goal", "Suggested target is five minutes or 150 repetitions. A personal goal can use minutes or repetitions, and reaching either target completes the day.", "Let learners choose a manageable target and avoid forcing one measure of effort."),
    ("Review source", "Home can draw from all islands, the learner's collection, or the collection only.", "Let learners mix authored curriculum and personal material."),
    ("Daily batch size", "The visible options are 20, 30, 50, 75 or 100 sentences. The screen says a smaller count takes effect the next day.", "Separate today's queue from future workload changes and state when changes apply."),
    ("Rating schedule", "Ratings 1-4 are scheduled sooner; five indicates mastery and contributes words to the learner's level.", "Use transparent, simple rating consequences in the review queue."),
    ("Course/source choice", "Topic, collection, favorites and custom sentence ranges can focus a session.", "Allow learners to practice targeted material without restructuring the whole course."),
    ("Language pair", "Separate selectors set the target language and native language; the target selector includes regional variants and options marked beta.", "Treat prompt language and target language as distinct learner settings."),
    ("Appearance and guidance", "Light, Dark and Auto appearance; replayable tips and a multi-step method guide.", "Make guidance repeatable and support user-controlled display preferences."),
], [1.2, 3.0, 2.8])
p("The app exposes several ways to shape the next session, but no central visual curriculum planner or editable long-term course sequence was visible in the reviewed screens. The controls shape source, workload, difficulty and session practice more directly than a multi-week path.")

h("Custom content and discovery")
p("My Collections offers a three-stage import flow: enter text, review sentence splitting and content type, then choose a voice and island. The import can begin in either language. Dual audio can be selected at the final step. The free web flow displayed limits of 1,000 characters, 200 lines and five imports per period. I viewed the wizard without entering or submitting content.")
p("The collection library is positioned for imported and AI-generated islands. Community content adds a beta author directory. These features make personal material reusable and let learners discover shared topic packs, while also creating needs for review, editing, favorites and content quality controls.")

h("Progress and motivation")
add_table(["View", "Measures and behavior observed"], [
    ("Skills", "Separate Listen & Repeat and Active Recall skill views with CEFR progress from A0 through C2."),
    ("Practice", "Reviewed sentences, active sentences, learned words, repetition count and practice time; daily activity."),
    ("Charts", "Seven- and 30-day views for repetitions and minutes, plus Challenge points."),
    ("Badges", "Point tiers and earned badges; the reviewed app showed 17 badge entries."),
    ("Leaderboard", "Optional public ranking. No opt-in was selected."),
    ("Messages", "Practice reminders and target-language reminders are described in app update notes; no reminder control was found in the reviewed profile settings."),
], [1.3, 5.7])

h("Recommended additions for Sprachpfad")
add_table(["Priority", "Addition", "First useful version"], [
    ("High", "Sentence review queue", "Add a sentence-level queue beside the current vocabulary review. Let learners mark again, difficult, good or mastered and schedule sentence returns."),
    ("High", "Personal sentence collections", "Save lines from lessons, workshops and learner writing into named topic sets; allow reorder, edit and favorites."),
    ("High", "Focused recall session", "Show a German prompt, let the learner answer aloud or type, reveal the reference, then rate recall."),
    ("High", "Listen and reconstruct loop", "Reuse recorded German audio, add repeat/pause controls, and offer word-order reconstruction before self-rating."),
    ("Medium", "Practice filters", "Start with range selection, favorites, due/unrated filters and a small set of sort options."),
    ("Medium", "Personal goal controls", "Keep the existing weekly plan and add a personal minutes or repetitions target with clear completion rules."),
    ("Medium", "Paired-language audio", "Offer optional German-English audio with a controllable pause and simple playback speed."),
    ("Explore", "Text import with review", "Draft sentence cards from learner text, show the split and generated translation for correction before audio or saving."),
    ("Later", "Community sharing and points", "Consider only after adding privacy controls, moderation and a clear opt-in."),
], [.8, 1.6, 4.6])
p("The best first release is a personal sentence collection connected to a due-review queue. It makes existing lesson lines reusable, gives recall and audio controls a clear home, and can be introduced without replacing Sprachpfad's A1-B1 course plan.")

doc.add_page_break()
h("Appendix A German island inventory")
p("The following 54 titles and card counts were visible in the eight German topic lists. Sentence totals can overlap between topic groupings and should not be added as unique content.")

catalog = [
    ("Learn the Basics", [
        "300 Spartan: The Language Survival Kit - 300 sentences (Pro)",
        "300 Questions & Answers - Part 1 - 194 sentences, 1 dialogue, 10 narrations",
        "300 Questions & Answers - Part 2 - 203 sentences, 10 narrations",
        "300 Questions & Answers - Part 3 - 189 sentences, 10 narrations",
        "Language Patterns - Part 1 - 261 sentences",
        "Language Patterns - Part 2 - 242 sentences",
        "Language Patterns - Part 3 - 234 sentences",
        "Location & Directions - 100 sentences",
        "Talking about Yourself - 78 sentences",
        "Time - 108 sentences",
        "Daily Routine - 300 sentences, 10 narrations",
        "Habits - 296 sentences, 1 narration",
        "Language Learning - 196 sentences",
        "100 basic sentences - 100 sentences, 10 dialogues, 10 narrations",
    ]),
    ("Family & Relationships", [
        "Family - 189 sentences", "Friends & Friendships - 100 sentences", "Dating & Relationships - 114 sentences",
    ]),
    ("Household & Daily Life", [
        "300 Spartan: The Language Survival Kit - 300 sentences (Pro)", "At Home - 144 sentences", "Cooking & Meals - 134 sentences", "Grocery Shopping - 121 sentences", "Health & Fitness - 114 sentences", "Maintenance & Bills - 140 sentences", "Running Errands - 120 sentences",
    ]),
    ("Social Interactions", [
        "Making Plans - 105 sentences", "Politeness - 102 sentences", "Preferences & Opinions - 117 sentences",
    ]),
    ("Hobbies", [
        "300 Spartan: The Language Survival Kit - 300 sentences (Pro)", "Creative & Artistic - 198 sentences", "DIY & Practical Skills - 137 sentences", "Intellectual & Learning - 195 sentences", "Music & Performance Arts - 145 sentences", "Outdoor & Nature - 168 sentences", "Pets & Animals - 118 sentences", "Social & Lifestyle - 176 sentences", "Sports & Physical Activities - 211 sentences", "Talking about your Hobbies - 92 sentences", "Video Games & Board Games - 112 sentences",
    ]),
    ("Work", [
        "300 Spartan: The Language Survival Kit - 190 sentences (Pro)", "At the Office - 262 sentences", "Hospitality Industry - 250 sentences", "Investments - 199 sentences", "Job Interviews - 194 sentences", "Law - 115 sentences", "Sales & Marketing - 219 sentences", "Entrepreneurship & Business - 208 sentences", "Airline industry - 134 sentences",
    ]),
    ("Travel & Abroad", [
        "Hotels & Accommodation - 121 sentences", "Plane & Airport - 110 sentences", "Sightseeing & Culture - 101 sentences", "Taxi & Public Transport - 86 sentences",
    ]),
    ("Eating Out & Shopping", [
        "Bars & Restaurants - 93 sentences", "In the café - 98 sentences", "Shopping - 190 sentences",
    ]),
]
for group, items in catalog:
    h(f"{group} with {len(items)} islands", 2)
    for item in items:
        bullet(item)

h("Appendix B Sources and limits")
p("Signed-in app reviewed on 6 November 2026: https://practice.hyperlingua.app/. Public method references: https://hyperlingua.app/method/ ; https://hyperlingua.app/method/active-recall/ ; https://hyperlingua.app/method/language-islands/. Public plan details: https://hyperlingua.app/pricing/.")
p("Signed-in observations describe the web app as it appeared during this review. Public pages and release notes can describe features beyond those directly seen in the app. This report distinguishes observed workflows from product claims and uses the app's visible labels and item counts only where they help map its structure.")

doc.core_properties.title = "HyperLingua Course and Study Path Audit"
doc.core_properties.subject = "Signed-in course structure and study settings reviewed for Sprachpfad improvement"
doc.core_properties.author = "Sprachpfad"
doc.core_properties.keywords = "language learning, course design, active recall, spaced repetition, study settings"
doc.save(OUT)
print(OUT)
