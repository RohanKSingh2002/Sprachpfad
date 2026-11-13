import { sentencePreferences, sitePreferences } from "./state.js";

export const STUDY_LANGUAGES = { en: "English", es: "Español", fr: "Français" };

const instructions = {
  "Home": ["Inicio", "Accueil"],
  "Lessons": ["Lecciones", "Leçons"],
  "Flashcards": ["Tarjetas", "Cartes mémoire"],
  "Practice": ["Práctica", "Entraînement"],
  "Sentence practice": ["Práctica de frases", "Pratique des phrases"],
  "Mock test": ["Examen de prueba", "Examen blanc"],
  "Profile": ["Perfil", "Profil"],
  "Settings": ["Ajustes", "Paramètres"],
  "Today": ["Hoy", "Aujourd’hui"],
  "Course roadmap": ["Plan del curso", "Parcours du cours"],
  "Review today": ["Repaso de hoy", "Révision du jour"],
  "Exercises": ["Ejercicios", "Exercices"],
  "Mock tests": ["Simulacros", "Examens blancs"],
  "Lessons and checkpoints": ["Lecciones y controles", "Leçons et bilans"],
  "Search lessons and checkpoints": ["Buscar lecciones y controles", "Rechercher des leçons et des bilans"],
  "Next up": ["A continuación", "À suivre"],
  "In progress": ["En curso", "En cours"],
  "Completed": ["Completado", "Terminé"],
  "Review": ["Repasar", "Réviser"],
  "Browse": ["Explorar", "Parcourir"],
  "Browse sentences": ["Explorar frases", "Parcourir les phrases"],
  "Back to browse": ["Volver a explorar", "Retour à la liste"],
  "Your collections": ["Tus colecciones", "Vos collections"],
  "Search collections": ["Buscar colecciones", "Rechercher des collections"],
  "Clear selection": ["Borrar selección", "Effacer la sélection"],
  "Select all": ["Seleccionar todo", "Tout sélectionner"],
  "Undo": ["Deshacer", "Annuler"],
  "Export TSV": ["Exportar TSV", "Exporter en TSV"],
  "Practice sets": ["Series de ejercicios", "Séries d’exercices"],
  "Grammar review": ["Repaso de gramática", "Révision de grammaire"],
  "Lesson exercise layout": ["Diseño de los ejercicios", "Présentation des exercices"],
  "Full list": ["Lista completa", "Liste complète"],
  "One at a time": ["Uno a la vez", "Un à la fois"],
  "Dual audio": ["Audio doble", "Double audio"],
  "Play slower": ["Reproducir más despacio", "Écouter plus lentement"],
  "Back to missed exercises": ["Volver a los ejercicios fallados", "Retour aux exercices manqués"],
  "Review by topic": ["Repasar por tema", "Réviser par thème"],
  "Related lessons": ["Lecciones relacionadas", "Leçons associées"],
  "Dialogue": ["Diálogo", "Dialogue"],
  "Play dialogue": ["Reproducir diálogo", "Écouter le dialogue"],
  "Stop dialogue": ["Detener diálogo", "Arrêter le dialogue"],
  "Show English translation": ["Mostrar traducción al inglés", "Afficher la traduction anglaise"],
  "Missed exercises": ["Ejercicios fallados", "Exercices manqués"],
  "Review missed exercises": ["Repasar ejercicios fallados", "Revoir les exercices manqués"],
  "Progress saved on this device": ["Progreso guardado en este dispositivo", "Progression enregistrée sur cet appareil"],
  "Draft saved on this device": ["Borrador guardado en este dispositivo", "Brouillon enregistré sur cet appareil"],
  "Record checkpoint feedback": ["Registrar la revisión del control", "Consigner le bilan"],
  "Save checkpoint feedback": ["Guardar la revisión del control", "Enregistrer le bilan"],
  "Activity details": ["Detalles de actividad", "Détails de l’activité"],
  "Sentence practice activity": ["Actividad de práctica de frases", "Activité de pratique des phrases"],
  "Let's get started.": ["Empecemos.", "C’est parti."],
  "Your daily German": ["Tu alemán diario", "Votre allemand au quotidien"],
  "Your next step": ["Tu próximo paso", "Votre prochaine étape"],
  "Daily study goal": ["Meta diaria de estudio", "Objectif d’étude quotidien"],
  "Daily goal reached": ["Meta diaria alcanzada", "Objectif quotidien atteint"],
  "Guided session": ["Sesión guiada", "Séance guidée"],
  "Open lesson exercises": ["Abrir los ejercicios de la lección", "Ouvrir les exercices de la leçon"],
  "Continue to lesson": ["Continuar a la lección", "Continuer vers la leçon"],
  "Continue to sentence review": ["Continuar al repaso de frases", "Continuer vers la révision des phrases"],
  "Finish guided session": ["Terminar la sesión guiada", "Terminer la séance guidée"],
  "Review later": ["Repasar más tarde", "Réviser plus tard"],
  "Study settings": ["Ajustes de estudio", "Réglages d’étude"],
  "If you want to keep going": ["Si quieres seguir", "Si vous voulez continuer"],
  "Change goal": ["Cambiar meta", "Modifier l’objectif"],
  "Today's Smart Review": ["Repaso inteligente de hoy", "Révision intelligente du jour"],
  "Start Smart Review": ["Iniciar repaso inteligente", "Démarrer la révision"],
  "Review settings": ["Ajustes de repaso", "Réglages de révision"],
  "Recent lessons": ["Lecciones recientes", "Leçons récentes"],
  "Today's plan": ["Plan de hoy", "Programme du jour"],
  "Favorites": ["Favoritos", "Favoris"],
  "Your profile": ["Tu perfil", "Votre profil"],
  "Study activity": ["Actividad de estudio", "Activité d’étude"],
  "Level progress": ["Progreso por nivel", "Progression par niveau"],
  "Mock test results": ["Resultados de simulacros", "Résultats des examens blancs"],
  "Audio & display": ["Audio y pantalla", "Audio et affichage"],
  "Audio playback": ["Reproducción de audio", "Lecture audio"],
  "Playback speed": ["Velocidad de reproducción", "Vitesse de lecture"],
  "Play sample": ["Reproducir ejemplo", "Écouter un exemple"],
  "Reset to 1×": ["Volver a 1×", "Revenir à 1×"],
  "Display & accessibility": ["Pantalla y accesibilidad", "Affichage et accessibilité"],
  "Appearance": ["Apariencia", "Apparence"],
  "App text size": ["Tamaño del texto", "Taille du texte"],
  "Motion": ["Movimiento", "Animations"],
  "Light": ["Claro", "Clair"],
  "Dark": ["Oscuro", "Sombre"],
  "Device": ["Dispositivo", "Appareil"],
  "Normal": ["Normal", "Normal"],
  "Large": ["Grande", "Grand"],
  "Extra large": ["Muy grande", "Très grand"],
  "Reduced": ["Reducido", "Réduit"],
  "Full": ["Completo", "Complet"],
  "Sentence practice defaults": ["Ajustes de práctica de frases", "Réglages par défaut des phrases"],
  "Sentence text size": ["Tamaño del texto de las frases", "Taille du texte des phrases"],
  "Show translations": ["Mostrar traducciones", "Afficher les traductions"],
  "Rating guidance": ["Ayuda sobre las valoraciones", "Aide sur les évaluations"],
  "Study plan": ["Plan de estudio", "Plan d’étude"],
  "Home starts with": ["Mostrar primero en Inicio", "Afficher en premier à l’accueil"],
  "Mix course progress and due review": ["Combinar el curso y el repaso", "Alterner cours et révision"],
  "Continue the course": ["Continuar el curso", "Continuer le cours"],
  "Prioritize due review": ["Priorizar el repaso pendiente", "Prioriser la révision prévue"],
  "Daily goal": ["Meta diaria", "Objectif quotidien"],
  "Save goal": ["Guardar meta", "Enregistrer l’objectif"],
  "Save review settings": ["Guardar ajustes de repaso", "Enregistrer les réglages"],
  "Default review mode": ["Modo de repaso", "Mode de révision"],
  "Language": ["Idioma", "Langue"],
  "App language": ["Idioma de la aplicación", "Langue de l’application"],
  "Translation and prompt language": ["Idioma de las traducciones y las pistas", "Langue des traductions et des indices"],
  "Save prompt language": ["Guardar idioma de las pistas", "Enregistrer la langue des indices"],
  "Reminders": ["Recordatorios", "Rappels"],
  "Study days": ["Días de estudio", "Jours d’étude"],
  "Reminder time": ["Hora del recordatorio", "Heure du rappel"],
  "Browser notification": ["Notificación del navegador", "Notification du navigateur"],
  "Pause reminders": ["Pausar recordatorios", "Suspendre les rappels"],
  "Resume reminders": ["Reanudar recordatorios", "Reprendre les rappels"],
  "Save reminder": ["Guardar recordatorio", "Enregistrer le rappel"],
  "Download calendar reminder": ["Descargar recordatorio", "Télécharger le rappel"],
  "Downloads": ["Descargas", "Téléchargements"],
  "Downloaded lessons": ["Lecciones descargadas", "Leçons téléchargées"],
  "Search downloaded lessons": ["Buscar lecciones descargadas", "Rechercher les leçons téléchargées"],
  "Browse lessons to download": ["Buscar lecciones para descargar", "Parcourir les leçons à télécharger"],
  "Download lesson": ["Descargar lección", "Télécharger la leçon"],
  "Downloaded": ["Descargado", "Téléchargé"],
  "Remove": ["Quitar", "Retirer"],
  "Account & data": ["Cuenta y datos", "Compte et données"],
  "Download backup": ["Descargar copia", "Télécharger la sauvegarde"],
  "Sync now": ["Sincronizar ahora", "Synchroniser"],
  "Reset progress": ["Borrar progreso", "Réinitialiser la progression"],
  "Sign in": ["Iniciar sesión", "Se connecter"],
  "Sign out": ["Cerrar sesión", "Se déconnecter"],
  "Sign out?": ["¿Cerrar sesión?", "Se déconnecter ?"],
  "Cancel": ["Cancelar", "Annuler"],
  "Sign out of Sprachpfad on this device?": ["¿Quieres cerrar sesión en Sprachpfad en este dispositivo?", "Se déconnecter de Sprachpfad sur cet appareil ?"],
  "Some progress is still waiting to sync. A copy will stay in this browser for your account.": ["Parte de tu progreso está pendiente de sincronización. Se guardará una copia en este navegador para tu cuenta.", "Une partie de votre progression est en attente de synchronisation. Une copie restera dans ce navigateur pour votre compte."],
  "Some progress is only saved in this tab. If you sign out now, you’ll lose it. Cancel to download a backup first.": ["Parte de tu progreso solo se guarda en esta pestaña. Si cierras sesión ahora, se perderá. Cancela para descargar primero una copia.", "Une partie de votre progression est enregistrée uniquement dans cet onglet. Si vous vous déconnectez maintenant, elle sera perdue. Annulez pour télécharger une sauvegarde d’abord."],
  "Jump to a section": ["Ir a una sección", "Aller à une section"],
  "Deck settings": ["Ajustes de tarjetas", "Réglages des cartes"],
  "Find a deck": ["Buscar una baraja", "Rechercher un jeu de cartes"],
  "Deck": ["Baraja", "Jeu de cartes"],
  "Start round": ["Iniciar ronda", "Démarrer la série"],
  "Direction": ["Dirección", "Sens"],
  "Round size": ["Tamaño de la ronda", "Taille de la série"],
  "Only missed words": ["Solo palabras falladas", "Mots manqués uniquement"],
  "Before you start": ["Antes de empezar", "Avant de commencer"],
  "Rehearsal": ["Simulacro", "Simulation"],
  "Start rehearsal": ["Iniciar simulacro", "Commencer la simulation"],
  "Start practice": ["Iniciar práctica", "Commencer l’entraînement"],
  "Audio speed": ["Velocidad del audio", "Vitesse audio"],
  "Overview": ["Resumen", "Aperçu"],
  "Examples": ["Ejemplos", "Exemples"],
  "Vocabulary": ["Vocabulario", "Vocabulaire"],
  "Exercises": ["Ejercicios", "Exercices"],
  "Listening": ["Comprensión oral", "Écoute"],
  "Reading": ["Lectura", "Lecture"],
  "Writing": ["Escritura", "Écriture"],
  "Speaking": ["Expresión oral", "Expression orale"],
  "Play examples": ["Reproducir ejemplos", "Écouter les exemples"],
  "Practise these sentences": ["Practicar estas frases", "Pratiquer ces phrases"],
  "Review lesson words": ["Repasar vocabulario", "Revoir le vocabulaire"],
  "Practice mode": ["Modo de práctica", "Mode d’entraînement"],
  "Search sentences": ["Buscar frases", "Rechercher des phrases"],
  "Repeats": ["Repeticiones", "Répétitions"],
  "Stop playback": ["Detener reproducción", "Arrêter la lecture"],
  "Loop": ["Bucle", "Boucle"],
  "Speed": ["Velocidad", "Vitesse"],
  "Next exercise": ["Ejercicio siguiente", "Exercice suivant"],
  "Check answer": ["Comprobar respuesta", "Vérifier la réponse"],
  "Skip for now": ["Saltar por ahora", "Passer pour l’instant"],
  "I knew it": ["Lo sabía", "Je le savais"],
  "Back to lesson": ["Volver a la lección", "Retour à la leçon"],
  "Back to review": ["Volver al repaso", "Retour à la révision"],
  "Back to collections": ["Volver a las colecciones", "Retour aux collections"],
  "Play": ["Reproducir", "Écouter"],
  "Skip": ["Omitir", "Passer"],
  "Active recall": ["Recuerdo activo", "Rappel actif"],
  "Listen and repeat": ["Escucha y repite", "Écoutez et répétez"],
  "Build the sentence": ["Construye la frase", "Construisez la phrase"],
  "Recall the German from its English prompt, then reveal it and rate your recall.": [
    "Di la frase en alemán a partir de la traducción. Después, muestra la respuesta y valora tu recuerdo.",
    "Retrouvez la phrase allemande à partir de la traduction. Affichez ensuite la réponse et évaluez votre rappel.",
  ],
  "Listen to each sentence and repeat it aloud. Show the German text when you need it.": [
    "Escucha cada frase y repítela en voz alta. Muestra el texto en alemán si lo necesitas.",
    "Écoutez chaque phrase et répétez-la à voix haute. Affichez le texte allemand au besoin.",
  ],
  "Put the German words in order, then compare your answer with the model.": [
    "Ordena las palabras en alemán y compara tu respuesta con el modelo.",
    "Remettez les mots allemands dans l’ordre, puis comparez votre réponse au modèle.",
  ],
  "Try saying or writing your answer before revealing it": [
    "Intenta decir o escribir la respuesta antes de mostrarla",
    "Essayez de dire ou d’écrire votre réponse avant de l’afficher",
  ],
  "Choose the words in order. Select a word in your answer to move it back.": [
    "Elige las palabras en orden. Selecciona una palabra de tu respuesta para devolverla a la lista.",
    "Choisissez les mots dans l’ordre. Sélectionnez un mot de votre réponse pour le remettre dans la liste.",
  ],
  "Reveal German": ["Mostrar en alemán", "Afficher l’allemand"],
  "Hide answer": ["Ocultar respuesta", "Masquer la réponse"],
  "How well did you know it?": ["¿Qué tan bien la sabías?", "À quel point connaissiez-vous cette phrase ?"],
  "Again": ["Repetir", "À revoir"],
  "Hard": ["Difícil", "Difficile"],
  "Good": ["Bien", "Bien"],
  "Easy": ["Fácil", "Facile"],
  "Mastered": ["Dominada", "Maîtrisée"],
  "Playback settings": ["Ajustes de reproducción", "Réglages de lecture"],
  "Show German text": ["Mostrar texto en alemán", "Afficher le texte allemand"],
  "Hide German text": ["Ocultar texto en alemán", "Masquer le texte allemand"],
  "Translation": ["Traducción", "Traduction"],
  "Listen to the sentence": ["Escucha la frase", "Écoutez la phrase"],
  "Done, next sentence": ["Listo, frase siguiente", "Terminé, phrase suivante"],
  "Check order": ["Comprobar el orden", "Vérifier l’ordre"],
  "Clear": ["Borrar", "Effacer"],
  "Reveal model": ["Mostrar el modelo", "Afficher le modèle"],
  "Next sentence": ["Frase siguiente", "Phrase suivante"],
  "Skip sentence": ["Omitir la frase", "Passer la phrase"],
};

let engine, engineLanguage = "", pending;
const translated = new Map();

export function localInstruction(text) {
  return instructions[text]?.[["es", "fr"].indexOf(sitePreferences().appLanguage)] || text;
}

const originalLabels = new WeakMap();
export function refreshInterface(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (!parent || parent.closest('[lang="de"], [data-study-prompt], textarea, script, style, [contenteditable]')) continue;
    const original = originalLabels.get(node) ?? node.nodeValue.trim();
    if (!Object.hasOwn(instructions, original)) continue;
    originalLabels.set(node, original);
    const translated = localInstruction(original);
    if (node.nodeValue.trim() !== translated) node.nodeValue = node.nodeValue.replace(node.nodeValue.trim(), translated);
  }
}

export function promptFor(text) {
  const language = sentencePreferences().language;
  const translation = translated.get(`${language}\n${text}`);
  return translation ? { text: translation, language } : { text, language: "en" };
}

export async function prepareStudyLanguage(language, userInitiated = false) {
  if (language === "en") return true;
  if (engine && engineLanguage === language) return true;
  const api = globalThis.Translator;
  if (!api) return false;
  if (pending?.language === language && (!userInitiated || pending.userInitiated)) return pending.result;
  const options = { sourceLanguage: "en", targetLanguage: language };
  const request = { language, userInitiated };
  pending = request;
  request.result = (async () => {
    try {
      if (!userInitiated && await api.availability(options) !== "available") return false;
      if (pending !== request) return false;
      const next = await api.create(options);
      if (pending !== request || sentencePreferences().language !== language) {
        next.destroy();
        return false;
      }
      engine?.destroy();
      engine = next;
      engineLanguage = language;
      return true;
    } catch {
      return false;
    } finally {
      if (pending === request) pending = undefined;
    }
  })();
  return request.result;
}

export async function refreshSentencePrompts(root) {
  const language = sentencePreferences().language;
  const fields = root?.querySelectorAll("[data-study-prompt]");
  if (language === "en" || !fields?.length) return;
  if (!await prepareStudyLanguage(language)) return;
  for (const field of fields) {
    if (!root.isConnected || sentencePreferences().language !== language) return;
    if (!field.isConnected) continue;
    const original = field.dataset.studyPrompt;
    const key = `${language}\n${original}`;
    try {
      if (!translated.has(key)) {
        const text = (await engine.translate(original)).trim();
        if (text) translated.set(key, text);
      }
      const { text, language: resultLanguage } = promptFor(original);
      if (field.isConnected) {
        field.textContent = text;
        field.lang = resultLanguage;
      }
    } catch { /* Keep the English prompt when the browser translator fails. */ }
  }
}
