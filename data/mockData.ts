import type { Quote } from '@/types';

export const MOCK_QUOTES: Quote[] = [
  {
    id: '1',
    content: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    category: 'Motivation',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    content: 'Simplicity is the ultimate sophistication.',
    author: 'Leonardo da Vinci',
    category: 'Wisdom',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    content: 'Stay hungry, stay foolish.',
    author: 'Stewart Brand',
    category: 'Motivation',
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    content: 'Work hard in silence, let your success be your noise.',
    author: 'Frank Ocean',
    category: 'Success',
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    content: 'Knowledge is power.',
    author: 'Francis Bacon',
    category: 'Wisdom',
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    content: 'It always seems impossible until it\'s done.',
    author: 'Nelson Mandela',
    category: 'Motivation',
    created_at: new Date().toISOString(),
  },
  {
    id: '7',
    content: 'Be the change that you wish to see in the world.',
    author: 'Mahatma Gandhi',
    category: 'Wisdom',
    created_at: new Date().toISOString(),
  },
];

export const MOCK_USER = {
  id: '1',
  name: 'Alex',
  avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Alex',
};
