// A private, client-side PDF record of the progress already shown by the site.
import { LEVELS, ALL_LESSONS, ALL_WORDS, wordsOfLevel } from './content.js';
import { isDone, knownIn, stateSnapshot, streak, testResult, courseChecks } from './state.js';
import { moduleReviewed, COURSE_SKILLS } from './course-plan.js';
import { dayKey } from './utils.js';

const clean = value => String(value || '').replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim();
const dateLabel = value => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const dayLabel = value => dateLabel(`${value}T12:00:00`);

export function certificateSummary(name, issuedAt = new Date()) {
  const snapshot = stateSnapshot();
  const days = Object.entries(snapshot.days).filter(([day, answers]) => day <= dayKey(issuedAt) && answers > 0).sort();
  return {
    name: clean(name).slice(0, 180) || 'Sprachpfad learner',
    issuedAt, date: dateLabel(issuedAt),
    lessons: ALL_LESSONS.filter(isDone).length, totalLessons: ALL_LESSONS.length,
    words: knownIn(ALL_WORDS), totalWords: ALL_WORDS.length,
    activeDays: days.length, answers: days.reduce((sum, [, answers]) => sum + answers, 0),
    firstDay: days[0]?.[0], lastDay: days.at(-1)?.[0], streak: streak(),
    levels: LEVELS.map(level => {
      const result = testResult(level);
      const checkpoints = (level.course?.modules || []).map(module => {
        const checks = courseChecks(level, module.id);
        return { title: module.title, id: module.id, complete: moduleReviewed(level, module),
          skills: COURSE_SKILLS.filter(skill => checks[skill]), score: checks.workshopScore };
      });
      return { name: level.name,
        lessons: level.lessons.filter(isDone).map(lesson => ({ position: lesson.position, title: lesson.germanTitle || lesson.title, topic: lesson.title })),
        totalLessons: level.lessons.length, words: knownIn(wordsOfLevel(level)), totalWords: wordsOfLevel(level).length,
        checkpoints, reviewed: checkpoints.filter(checkpoint => checkpoint.complete).length,
        test: result ? { best: result.best, total: level.test.total, passed: result.best >= level.test.passMark,
          date: dateLabel(result.date), label: level.test.objectiveLabel || 'listening and reading' } : null };
    }),
  };
}

let library;
function loadPDFLibrary() {
  if (!library) library = import('./vendor/pdf-lib-1.17.1.js').then(() => globalThis.PDFLib).catch(error => {
    library = null;
    throw error;
  });
  return library;
}

/** Vector text stays crisp when printed. Non-Latin account names use the browser's font fallback. */
export async function createCertificatePDF(summary, PDFLib) {
  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  const doc = await PDFDocument.create();
  doc.setTitle('Sprachpfad - Certificate of progress');
  doc.setAuthor('Sprachpfad');
  doc.setSubject('Personal German learning progress; not an official language qualification');
  doc.setCreationDate(new Date(summary.issuedAt));
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.09, 0.15, 0.24), muted = rgb(0.36, 0.40, 0.46), line = rgb(0.84, 0.86, 0.88);
  const gold = rgb(0.90, 0.71, 0.16);
  const W = 595.28, H = 841.89, M = 48, CW = W - 2 * M;
  const pages = [];
  let page, cursor;
  const pdfText = value => clean(value).replace(/[–—‑]/g, '-').replace(/→/g, '>');
  function text(value, x, top, size = 11, weight = false, color = ink) {
    page.drawText(pdfText(value), { x, y: H - top - size, size, font: weight ? bold : regular, color });
  }
  function rule(top, color = line, width = 0.6) {
    page.drawLine({ start: { x: M, y: H - top }, end: { x: W - M, y: H - top }, color, thickness: width });
  }
  function wrap(value, maxWidth, size = 11, weight = false) {
    const font = weight ? bold : regular, lines = [];
    let current = '';
    for (const word of pdfText(value).split(' ')) {
      if (current && font.widthOfTextAtSize(`${current} ${word}`, size) > maxWidth) { lines.push(current); current = ''; }
      for (const char of word) {
        if (font.widthOfTextAtSize(current + char, size) > maxWidth) { lines.push(current); current = ''; }
        current += char;
      }
      current += ' ';
    }
    if (current.trim()) lines.push(current.trim());
    return lines;
  }
  function paragraph(value, top, size = 10, color = muted, maxWidth = CW) {
    const lines = wrap(value, maxWidth, size);
    lines.forEach((value, i) => text(value, M, top + i * (size + 5), size, false, color));
    return top + lines.length * (size + 5);
  }
  function newPage(details = false) {
    page = doc.addPage([W, H]); pages.push(page);
    text('Sprachpfad', M, 36, 13, true);
    text('GERMAN LEARNING / A1 - B1', 330, 39, 8, false, muted);
    rule(65, gold, 1.5);
    if (details) {
      text('Completed learning', M, 89, 25, true);
      text(`Progress record issued ${summary.date}`, M, 126, 10, false, muted);
      cursor = 162;
    }
  }
  function ensure(height) { if (cursor + height > H - 92) newPage(true); }

  newPage();
  text('Certificate of progress', M, 105, 31, true);
  text('A record of personal learning on Sprachpfad', M, 150, 11, false, muted);
  text('PREPARED FOR', M, 195, 8, true, muted);
  let nameBottom = 249;
  try {
    let size = 25;
    while (size > 7 && wrap(summary.name, CW, size, true).length > 2) size--;
    const lines = wrap(summary.name, CW, size, true);
    lines.forEach((value, i) => text(value, M, 214 + i * (size + 5), size, true));
    nameBottom = Math.max(nameBottom, 214 + lines.length * (size + 5));
  } catch {
    // Preserve non-Latin names without uploading them or relying on a remote font service.
    const canvas = document.createElement('canvas');
    canvas.width = 1500; canvas.height = 180;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not prepare the certificate. Please try another browser.');
    context.font = 'bold 72px Arial, sans-serif'; context.fillStyle = '#17263d';
    context.textBaseline = 'middle';
    context.fillText(summary.name, 0, 90, 1490);
    const nameImage = await doc.embedPng(canvas.toDataURL('image/png'));
    page.drawImage(nameImage, { x: M, y: H - 265, width: CW, height: 60 });
    nameBottom = 265;
  }
  const introBottom = paragraph('The following learning activity and completed work are recorded in your progress.', nameBottom + 13);
  const metricsTop = introBottom + 28;
  const metrics = [[`${summary.lessons} / ${summary.totalLessons}`, 'Lessons completed'],
    [`${summary.words} / ${summary.totalWords}`, 'Words marked known'],
    [summary.activeDays, 'Days practised'], [summary.answers, 'Answers recorded']];
  metrics.forEach(([value, label], i) => {
    text(value, M + i * CW / 4, metricsTop, 21, true);
    text(label, M + i * CW / 4, metricsTop + 32, 8.5, false, muted);
  });
  const tableTop = metricsTop + 81;
  text('Your progress by level', M, tableTop, 14, true);
  const columns = [M, M + 58, M + 151, M + 256, M + 370];
  ['Level', 'Lessons', 'Words known', 'Checkpoints', 'Best mock test'].forEach((label, i) => text(label, columns[i], tableTop + 36, 9, true, muted));
  rule(tableTop + 57);
  summary.levels.forEach((level, i) => {
    const top = tableTop + 71 + i * 38;
    const values = [level.name, `${level.lessons.length} / ${level.totalLessons}`, `${level.words} / ${level.totalWords}`,
      `${level.reviewed} / ${level.checkpoints.length}`, level.test ? `${level.test.best} / ${level.test.total}${level.test.passed ? ' - passed' : ''}` : 'Not taken'];
    values.forEach((value, index) => text(value, columns[index], top, index === 4 ? 9 : 11, index === 0));
    rule(top + 25);
  });
  let y = tableTop + 196;
  y = paragraph('Checkpoints include the required lesson scores, comprehension result and recorded skill reviews. Mock-test scores cover objective tasks; writing and speaking are self-reviewed.', y, 8.5) + 18;
  const activity = summary.firstDay
    ? `Recorded practice: ${dayLabel(summary.firstDay)} to ${dayLabel(summary.lastDay)}. Current streak: ${summary.streak} ${summary.streak === 1 ? 'day' : 'days'}.`
    : 'Your learning record is ready. No practice activity has been recorded yet.';
  y = paragraph(activity, y, 9) + 8;
  paragraph('Practice totals include repeated answers across lessons, flashcards, practice and mock tests.', y, 8.5);

  // Keep the certificate itself brief; include a complete, paginated inventory when there is one.
  const hasDetails = summary.levels.some(level => level.lessons.length || level.test || level.checkpoints.some(c => c.skills.length || c.score !== undefined));
  if (hasDetails) {
    newPage(true);
    for (const level of summary.levels) {
      const checkpoints = level.checkpoints.filter(c => c.skills.length || c.score !== undefined);
      if (!level.lessons.length && !level.test && !checkpoints.length) continue;
      ensure(82);
      text(`${level.name} / ${level.lessons.length} lessons completed`, M, cursor, 15, true); cursor += 28;
      if (!level.lessons.length) { text('No completed lessons recorded.', M, cursor, 10, false, muted); cursor += 24; }
      for (const lesson of level.lessons) {
        const lines = wrap(`${lesson.position}. ${lesson.title} - ${lesson.topic}`, CW - 12, 10);
        ensure(lines.length * 15 + 10);
        lines.forEach(value => { text(value, M + 8, cursor, 10); cursor += 15; }); cursor += 6;
      }
      if (checkpoints.length) {
        ensure(58); text('Checkpoint practice and reviews', M, cursor + 6, 11, true); cursor += 29;
        for (const checkpoint of checkpoints) {
          const heading = `Module ${checkpoint.id}: ${checkpoint.title}${checkpoint.complete ? ' - completed' : ' - in progress'}`;
          const detail = [checkpoint.score !== undefined ? `Comprehension: ${checkpoint.score}/6` : '',
            checkpoint.skills.length ? `Recorded reviews: ${checkpoint.skills.join(', ')}` : ''].filter(Boolean).join('. ');
          const headingLines = wrap(heading, CW - 12, 10), detailLines = wrap(detail, CW - 12, 9);
          ensure(headingLines.length * 15 + detailLines.length * 14 + 12);
          headingLines.forEach(value => { text(value, M + 8, cursor, 10); cursor += 15; });
          detailLines.forEach(value => { text(value, M + 8, cursor, 9, false, muted); cursor += 14; }); cursor += 10;
        }
      }
      if (level.test) {
        const value = `Best mock test: ${level.test.best}/${level.test.total}${level.test.passed ? ' - passed' : ' - keep practising'}. Saved ${level.test.date}. Scoring covers ${level.test.label}.`;
        const lines = wrap(value, CW, 10);
        ensure(lines.length * 15 + 22);
        cursor = paragraph(value, cursor + 6, 10, ink) + 16;
      }
      cursor += 15;
    }
  }
  pages.forEach((current, i) => {
    page = current;
    rule(H - 67);
    text('Personal learning record. Not an official language qualification.', M, H - 54, 8, false, muted);
    text(`Issued ${summary.date}`, M, H - 38, 8, false, muted);
    const pageLabel = `${i + 1} / ${pages.length}`;
    text(pageLabel, W - M - regular.widthOfTextAtSize(pageLabel, 8), H - 38, 8, false, muted);
  });
  return doc.save();
}

export async function downloadProgressCertificate(name) {
  const summary = certificateSummary(name);
  const bytes = await createCertificatePDF(summary, await loadPDFLibrary());
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sprachpfad-progress-certificate-${dayKey(summary.issuedAt)}.pdf`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
