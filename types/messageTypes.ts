// types/messageTypes.ts
// This file is used to handle the message types
// It is used to handle the message types that are used to generate the messages for the users daily messages

export type MessageTheme = {
  id: string
  name: string
  description: string
  prompt: string
}

export const MESSAGE_THEMES: MessageTheme[] = [
  {
    id: 'faith',
    name: 'Faith & Trust',
    description: 'Messages about building faith and trust in God',
    prompt: 'Create an inspiring spiritual message about strengthening faith and trust in God during challenging times. Include a relevant Bible verse. The message should be encouraging and uplifting. Keep the message under 160 characters.'
  },
  {
    id: 'healing',
    name: 'Healing & Comfort',
    description: 'Messages for those seeking emotional or physical healing',
    prompt: 'Create a comforting spiritual message for someone seeking emotional or physical healing. Focus on God\'s healing power and presence. Include a relevant Bible verse about healing or comfort. Keep the message under 160 characters.'
  },
  {
    id: 'purpose',
    name: 'Purpose & Direction',
    description: 'Messages about finding God\'s purpose for your life',
    prompt: 'Create an empowering message about discovering and fulfilling God\'s purpose for one\'s life. Include a relevant Bible verse about purpose or calling. Keep the message under 160 characters.'
  },
  {
    id: 'strength',
    name: 'Inner Strength',
    description: 'Messages about finding strength through God',
    prompt: 'Create an encouraging message about finding strength in God during difficult times. Focus on overcoming challenges through faith. Include a relevant Bible verse about God\'s strength. Keep the message under 160 characters.'
  },
  {
    id: 'peace',
    name: 'Peace & Serenity',
    description: 'Messages about finding peace in God\'s presence',
    prompt: 'Create a calming message about finding peace and serenity through God\'s presence. Focus on inner peace and spiritual tranquility. Include a relevant Bible verse about peace. Keep the message under 160 characters.'
  },
  {
    id: 'wisdom',
    name: 'Wisdom & Guidance',
    description: 'Messages about seeking God\'s wisdom and guidance',
    prompt: 'Create an insightful message about seeking and applying God\'s wisdom in daily life. Include a relevant Bible verse about wisdom or divine guidance. Keep the message under 160 characters.'
  },
  {
    id: 'love',
    name: 'Love & Relationships',
    description: 'Messages about God\'s love and loving others',
    prompt: 'Create a heartfelt message about experiencing and sharing God\'s love in relationships. Focus on divine and human love. Include a relevant Bible verse about love. Keep the message under 160 characters.'
  },
  {
    id: 'gratitude',
    name: 'Gratitude & Joy',
    description: 'Messages about cultivating gratitude and finding joy',
    prompt: 'Create an uplifting message about practicing gratitude and finding joy in God\'s blessings. Include a relevant Bible verse about thankfulness or joy. Keep the message under 160 characters.'
  },
  {
    id: 'forgiveness',
    name: 'Forgiveness & Grace',
    description: 'Messages about forgiveness, mercy, and grace',
    prompt: 'Create a compassionate message about experiencing and extending forgiveness through God\'s grace. Include a relevant Bible verse about forgiveness or grace. Keep the message under 160 characters.'
  },
  {
    id: 'perseverance',
    name: 'Perseverance & Hope',
    description: 'Messages about maintaining hope and persevering in faith',
    prompt: 'Create an encouraging message about persevering through challenges with hope in God\'s promises. Include a relevant Bible verse about hope or endurance. Keep the message under 160 characters.'
  }
] 