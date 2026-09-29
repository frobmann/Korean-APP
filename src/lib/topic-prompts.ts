export const topicPrompts: Record<string, { label: string; emoji: string; systemPrompt: string }> = {
  greet: {
    label: 'Begrüßung',
    emoji: '👋',
    systemPrompt: 'Begrüßung und sich vorstellen auf Koreanisch (안녕하세요, 저는..., 만나서 반갑습니다 etc.)',
  },
  intro: {
    label: 'Vorstellen',
    emoji: '🙋',
    systemPrompt:
      'Sich vorstellen nach dem Muster des King Sejong Institute Lehrbuchs (세종한국어 1A, Lektion 1-2). ' +
      'Übe mit dem Lernenden eine strukturierte Selbstvorstellung: ' +
      '1) Name: 저는 [Name]이에요/예요 (이에요 nach Konsonant, 예요 nach Vokal). ' +
      '2) Beruf: 저는 [직업]이에요/예요 (학생 Student, 회사원 Büroangestellte/r, 의사 Arzt/Ärztin, 선생님 Lehrer/in, 간호사 Krankenpfleger/in, 요리사 Koch/Köchin, 기자 Journalist/in, 엔지니어 Ingenieur/in). ' +
      '3) Nationalität: 저는 [나라] 사람이에요 (독일 Deutschland, 한국 Korea, 일본 Japan, 중국 China, 미국 USA, 베트남 Vietnam, 태국 Thailand, 프랑스 Frankreich, 영국 England, 인도 Indien). ' +
      '4) Abschluss: 만나서 반갑습니다 (Freut mich Sie kennenzulernen). ' +
      'Führe den Dialog Schritt für Schritt: Frag zuerst nach dem Namen (이름이 뭐예요?), dann nach dem Beruf (직업이 뭐예요?), dann nach der Nationalität (어느 나라 사람이에요?). ' +
      'Erkläre die 이에요/예요 Regel wenn nötig. Gib immer Romanisierung und deutsche Übersetzung. ' +
      'Zeige am Ende das vollständige Vorstellungsmuster als Zusammenfassung.',
  },
  friends: {
    label: 'Freunde',
    emoji: '🧑‍🤝‍🧑',
    systemPrompt: 'Alltägliche Gespräche unter Freunden (Hobbys, Wochenende, Pläne etc.)',
  },
  food: {
    label: 'Essen',
    emoji: '🍜',
    systemPrompt: 'Über Essen und Trinken sprechen, im Restaurant bestellen',
  },
  shopping: {
    label: 'Einkaufen',
    emoji: '🛍️',
    systemPrompt: 'Im Laden einkaufen, nach dem Preis fragen (얼마예요?, 이거 주세요 etc.)',
  },
  family: {
    label: 'Familie',
    emoji: '👨‍👩‍👧',
    systemPrompt: 'Über die Familie sprechen (가족 소개)',
  },
  pron: {
    label: 'Aussprache',
    emoji: '🗣️',
    systemPrompt:
      'Aussprachetraining. Erkläre Mundstellung, Zungenlage, ähnliche deutsche Laute. ' +
      'Gib Silben-für-Silben-Anleitungen. Vergleiche koreanische Laute mit deutschen Wörtern ' +
      '(z.B. ㅓ klingt wie das ö in "Köln" ohne Lippenrundung). Nutze die Notation [TIPP: Erklärung] für jede schwierige Silbe.',
  },
  free: {
    label: 'Frei',
    emoji: '✨',
    systemPrompt: 'Freies Gespräch auf Koreanisch - antworte natürlich auf das Thema des Lernenden',
  },
};
