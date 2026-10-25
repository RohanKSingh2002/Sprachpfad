// Compact strategy and transfer activities shared by every course level.
import { esc } from '../utils.js';

export function strategiesHTML(course) {
  if (!course.skillStrategies?.length) return '';
  return `<section class="panel course-support"><h2>Make each practice session count</h2><p class="muted">Try first, check the evidence, then use the language in a new situation.</p>${course.skillStrategies.map(strategy => `<details><summary>${esc(strategy.title)}</summary><ol>${strategy.steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol></details>`).join('')}${course.reviewRoutine?.length ? `<details><summary>Bring earlier learning back</summary><ul>${course.reviewRoutine.map(item => `<li>${esc(item)}</li>`).join('')}</ul><p class="muted small">These are suggested review intervals; use them alongside your due-word queue.</p></details>` : ''}</section>`;
}

export function transferHTML(level, module) {
  const activity = module.transfer;
  if (!activity) return '';
  const lessons = (activity.lessonIds || []).map(id => level.lessons.find(l => l.id === id)).filter(Boolean);
  return `<details class="course-transfer"><summary>Use it in a new situation</summary><p>${esc(activity.task)}</p><h3 class="h3">Check your attempt</h3><ul>${activity.checklist.map(item => `<li>${esc(item)}</li>`).join('')}</ul><p class="muted"><b>If you get stuck:</b> ${esc(activity.retry)}</p>${lessons.length ? `<p class="small">Bring back earlier language:</p><div class="course-topic-links">${lessons.map(l => `<a class="tlink" href="#/${level.id}/lektion/${l.id}">Lesson ${l.position}: ${esc(l.germanTitle)}</a>`).join('')}</div>` : ''}<p class="muted small">This is ungraded transfer practice. Use invented personal details and review your response with a partner or tutor.</p></details>`;
}
