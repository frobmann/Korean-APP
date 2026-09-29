'use client';

import { useState, useRef, useEffect } from 'react';
import Avatar from './Avatar';
import { topicPrompts } from '@/lib/topic-prompts';
import { speakKorean, unlockAudio } from '@/lib/tts';
import { useAvatar } from '@/lib/use-avatar';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  html?: string;
}

function escHtml(s: string) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function formatResponse(text: string): string {
  const lines = text.split('\n');
  let html = '';
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^\[TIPP:?\s*/i.test(line)) {
      const tip = line.replace(/^\[TIPP:?\s*/i, '').replace(/\]$/, '');
      html += `<span class="pron-tip">💡 ${escHtml(tip)}</span>`;
      continue;
    }
    if (/^[가-힯㄰-㆏\s!?.,~\-"'()0-9]+$/.test(line) && line.length > 1) {
      html += `<span class="kor">${escHtml(line)}</span><br>`;
    } else if (/^\(.*\)$/.test(line)) {
      html += `<span class="rom">${escHtml(line)}</span><br>`;
    } else {
      html += `<span class="trans">${escHtml(line)}</span><br>`;
    }
  }
  return html || escHtml(text);
}

function getIntroWelcome(): string {
  return (
    '<span class="kor">자기소개를 해 봅시다! 🙋</span><br><span class="trans">Lass uns die Selbstvorstellung üben!</span>' +
    '<div class="intro-template">' +
    '<strong>📖 Sejong 1A — Vorlage:</strong><br><br>' +
    '<span class="kor">안녕하세요.</span> <span class="rom">(annyeonghaseyo)</span><br>' +
    '<span class="trans">Hallo.</span><br><br>' +
    '<span class="kor">저는 [Name]이에요/예요.</span> <span class="rom">(jeoneun ... ieyo/yeyo)</span><br>' +
    '<span class="trans">Ich bin [Name].</span><br><br>' +
    '<span class="kor">저는 [직업]이에요/예요.</span> <span class="rom">(jeoneun ... ieyo/yeyo)</span><br>' +
    '<span class="trans">Ich bin [Beruf].</span><br><br>' +
    '<span class="kor">저는 [나라] 사람이에요.</span> <span class="rom">(jeoneun ... saram-ieyo)</span><br>' +
    '<span class="trans">Ich bin [Nationalität].</span><br><br>' +
    '<span class="kor">만나서 반갑습니다.</span> <span class="rom">(mannaseo bangapseumnida)</span><br>' +
    '<span class="trans">Freut mich, Sie kennenzulernen.</span>' +
    '</div>' +
    '<span class="pron-tip">💡 이에요 nach Konsonant (학생<b>이에요</b>), 예요 nach Vokal (의사<b>예요</b>)</span>' +
    '<br><span class="trans">Fangen wir an! Wie heißt du?<br><span class="kor">이름이 뭐예요?</span> <span class="rom">(ireumi mwoyeyo?)</span></span>'
  );
}

export default function Chat() {
  const [topic, setTopic] = useState('greet');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'speaking' | 'listening'>('normal');
  const { videoUrl, speak: avatarSpeak } = useAvatar();
  const msgsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startTopic('greet');
  }, []);

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [messages, loading]);

  function startTopic(t: string) {
    setTopic(t);
    setMessages([]);

    let welcomeHtml: string;
    if (t === 'pron') {
      welcomeHtml =
        '<span class="kor">발음 연습! 🗣️</span><br>' +
        '<span class="trans">Aussprachetraining! Schreib ein koreanisches Wort und ich erkläre dir genau, wie du es aussprichst — mit Mundstellung, Zungenlage und ähnlichen deutschen Lauten.</span>';
    } else if (t === 'intro') {
      welcomeHtml = getIntroWelcome();
    } else {
      welcomeHtml =
        '<span class="kor">안녕하세요! 🎓</span><br>' +
        '<span class="trans">Lass uns auf Koreanisch üben! Schreib einfach auf Deutsch und ich antworte auf Koreanisch mit Übersetzung.</span>';
    }
    setMessages([{ role: 'assistant', content: '', html: welcomeHtml }]);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    unlockAudio();
    setInput('');
    setLoading(true);
    setExpression('normal');

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);

    const apiMessages = newMessages
      .filter((m) => m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, topic }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const html = formatResponse(data.text);

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.text, html },
      ]);
      setExpression('happy');
      setTimeout(() => setExpression('normal'), 2000);

      const koreanMatch = data.text.match(/^[가-힯㄰-㆏\s!?.,~\-"'()0-9]+/m);
      if (koreanMatch) {
        avatarSpeak(koreanMatch[0]);
        speakKorean(koreanMatch[0]);
      }
    } catch (e) {
      const err = e instanceof Error ? e.message : 'Unbekannt';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '',
          html: `<span class="trans">Fehler: ${escHtml(err)}. Versuche es nochmal!</span>`,
        },
      ]);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Avatar */}
      <div className="flex justify-center py-2">
        <Avatar expression={expression} size={100} videoUrl={videoUrl} />
      </div>

      {/* Topic chips */}
      <div className="flex flex-wrap gap-1.5 mb-2 px-1">
        {Object.entries(topicPrompts).map(([key, info]) => (
          <button
            key={key}
            onClick={() => startTopic(key)}
            className={`topic-chip ${topic === key ? 'active' : ''}`}
          >
            {info.emoji} {info.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={msgsRef} className="chat-messages flex-1 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.role === 'user' ? 'user' : 'tutor'}`}>
            {msg.html ? (
              <div dangerouslySetInnerHTML={{ __html: msg.html }} />
            ) : (
              <span>{msg.content}</span>
            )}
            {msg.role === 'assistant' && msg.content && (
              <button
                className="speak-btn"
                onClick={() => {
                  unlockAudio();
                  const kor = msg.content.match(/^[가-힯㄰-㆏\s!?.,~\-"'()0-9]+/m);
                  if (kor) speakKorean(kor[0]);
                }}
                title="Anhören"
              >
                🔊
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div className="thinking">
            <span /><span /><span />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-2 pb-2">
        <input
          className="chat-input flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Schreib auf Deutsch oder Koreanisch..."
          disabled={loading}
        />
        <button
          className="chat-send"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          →
        </button>
      </div>
    </div>
  );
}
