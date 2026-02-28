export interface ChatMessage {
  sender: 'me' | 'them';
  text: string;
  time: string;
}

export const mockMessages: Record<string, ChatMessage[]> = {
  's1': [
    { sender: 'them', text: 'Oi! Vi que a gente tem bastante compatibilidade 😊', time: '10:30' },
    { sender: 'me', text: 'Oi Ana! Sim, vi que você também é organizada e diurna!', time: '10:32' },
    { sender: 'them', text: 'Exato! Tô procurando república perto do Umuarama, você conhece alguma?', time: '10:33' },
    { sender: 'me', text: 'Tem umas opções boas no marketplace, posso te mandar os links!', time: '10:35' },
  ],
  's2': [
    { sender: 'them', text: 'E aí! Bora dividir um apê perto do Santa Mônica?', time: '14:00' },
    { sender: 'me', text: 'Opa Lucas! Qual sua faixa de preço?', time: '14:05' },
    { sender: 'them', text: 'Tô pensando em algo entre 500 e 800, dividindo fica suave', time: '14:06' },
    { sender: 'me', text: 'Perfeito, tá na minha faixa também. Vamos marcar pra visitar uns imóveis?', time: '14:10' },
    { sender: 'them', text: 'Bora! Semana que vem tô livre 🤙', time: '14:11' },
  ],
  's3': [
    { sender: 'them', text: 'Oi! Você aceita pets? Tenho uma gatinha 🐱', time: '09:00' },
    { sender: 'me', text: 'Oi Mariana! Eu não tenho pet mas não me importo, adoro gatos!', time: '09:15' },
    { sender: 'them', text: 'Que bom! Ela é super tranquila. Tá procurando quarto ou república?', time: '09:16' },
  ],
  's4': [
    { sender: 'me', text: 'Fala Pedro! Vi que você é de Computação também, qual período?', time: '20:00' },
    { sender: 'them', text: 'Salve! Tô no 5º, e você?', time: '20:10' },
    { sender: 'me', text: 'Também 5º! Preciso de internet boa pra codar, você também né?', time: '20:12' },
    { sender: 'them', text: 'Com certeza! Sem internet boa não rola haha', time: '20:13' },
  ],
  's5': [
    { sender: 'them', text: 'Olá! Vi que somos compatíveis. Busco um lugar tranquilo pra estudar.', time: '08:00' },
    { sender: 'me', text: 'Oi Juliana! Também prefiro ambiente calmo. Você já viu algum imóvel?', time: '08:30' },
    { sender: 'them', text: 'Tenho alguns favoritados no app, posso compartilhar!', time: '08:31' },
  ],
};
