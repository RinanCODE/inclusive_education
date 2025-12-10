import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit {
  messages: { role: 'user' | 'bot', text: string }[] = [
    { role: 'bot', text: "Hello! I'm your AI learning assistant. How can I help you today?" }
  ];
  inputText: string = '';
  sending = false;
  speechSupported = false;
  listening = false;
  private recognition: any;
  showArchived = false;
  archived: { message: string; response: string; original_timestamp?: string; archived_at?: string }[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadHistory();
    // Initialize Web Speech API if available
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      this.speechSupported = true;
      this.recognition = new SR();
      this.recognition.lang = 'en-US';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          this.inputText = (this.inputText ? this.inputText + ' ' : '') + transcript;
        }
      };
      this.recognition.onend = () => { this.listening = false; };
      this.recognition.onerror = () => { this.listening = false; };
    }
  }

  loadHistory(): void {
    this.api.getChatHistory(30).subscribe({
      next: (data) => {
        if (Array.isArray(data?.conversations)) {
          // conversations are oldest-first due to reverse in backend
          const history = data.conversations.map((c: any) => ({
            role: 'user' as const,
            text: c.message
          })).flatMap((uMsg: any, idx: number) => [
            uMsg,
            { role: 'bot' as const, text: data.conversations[idx]?.response || '' }
          ]);
          if (history.length) {
            // keep initial greeting, then append history
            this.messages = [{ role: 'bot', text: this.messages[0].text }, ...history];
          }
        }
      },
      error: () => {}
    });
  }

  loadArchived(): void {
    this.api.getArchivedChatHistory(100).subscribe({
      next: (data: any) => {
        this.archived = Array.isArray(data?.archived) ? data.archived : [];
        this.showArchived = true;
      },
      error: () => {
        this.archived = [];
        this.showArchived = true;
      }
    });
  }

  archiveHistory(): void {
    if (this.sending) return;
    this.sending = true;
    this.api.archiveChatHistory().subscribe({
      next: (res: any) => {
        const n = res?.archived ?? 0;
        this.messages.push({ role: 'bot', text: `Archived ${n} conversation entries.` });
        this.sending = false;
      },
      error: () => {
        this.messages.push({ role: 'bot', text: 'Failed to archive chat history.' });
        this.sending = false;
      }
    });
  }

  send(): void {
    const text = this.inputText?.trim();
    if (!text || this.sending) return;
    this.sending = true;
    this.messages.push({ role: 'user', text });
    this.inputText = '';
    this.api.chatWithAI(text).subscribe({
      next: (res) => {
        const reply = res?.response || '...';
        this.messages.push({ role: 'bot', text: reply });
        this.sending = false;
      },
      error: () => {
        this.messages.push({ role: 'bot', text: 'There was a problem contacting the AI assistant.' });
        this.sending = false;
      }
    });
  }

  toggleMic(): void {
    if (!this.speechSupported) return;
    if (this.listening) {
      try { this.recognition.stop(); } catch {}
      this.listening = false;
    } else {
      try { this.recognition.start(); this.listening = true; } catch {}
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    this.messages.push({ role: 'user', text: `Uploaded file: ${file.name}. Please summarize.` });
    this.api.summarizeFile(file).subscribe({
      next: (res) => {
        const parts = [res?.summary || '(no summary)'];
        if (Array.isArray(res?.examples) && res.examples.length) {
          parts.push('\nExamples:\n- ' + res.examples.join('\n- '));
        }
        if (Array.isArray(res?.references) && res.references.length) {
          parts.push('\nReferences:\n- ' + res.references.join('\n- '));
        }
        this.messages.push({ role: 'bot', text: parts.join('\n') });
      },
      error: () => {
        this.messages.push({ role: 'bot', text: 'Failed to summarize the uploaded file.' });
      }
    });
    // reset input
    (event.target as HTMLInputElement).value = '';
  }
}
