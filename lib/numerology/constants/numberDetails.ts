export type NumberDetailSource = 'pythagorean' | 'chaldean' | 'mulank' | 'bhagyank';

export interface NumberDetail {
  number: number;
  title: string;
  rulingPlanet: string;
  good: string;
  bad: string;
  famousPersonalities: string;
  description: string[];
}

export const NUMBER_DETAILS: Record<number, NumberDetail> = {
  1: {
    number: 1,
    title: 'The Originator',
    rulingPlanet: 'Sun',
    good: 'Honest, Good Leaders',
    bad: 'Arrogant, Stubborn',
    famousPersonalities:
      'Captain Cook, Alexander – The Great, Hulk Hogan, Annie Besant, Tom Hanks',
    description: [
      'Good planner with independent views.',
      'Inborn qualities of administration and leadership.',
      'Serious nature with firm thinking.',
      'Respected in social circles.',
      'More influenced by the Sun if born between July 21 and August 21.',
      'Attractive personality and progressing in life.',
      'Brilliant and not accepting defeat easily.',
      'Suitable for business in Jewellery, Gold, medical, medicines, army, scientific equipment, fire extinguishers, paper, cloth, and grains.',
      'Difficulty remaining under someone in administrative services; prefers roles like CEO or head of department.',
      "Warning: Avoid business of IRON despite success in other fields under the Sun's influence.",
      'Suggested directions for business, house, and employment: West, North-East, and North-West.',
    ],
  },
  2: {
    number: 2,
    title: 'The Peacemaker',
    rulingPlanet: 'Moon',
    good: 'Diplomatic, Intuitive, Cooperative',
    bad: 'Over-sensitive, Indecisive',
    famousPersonalities: 'Barack Obama, Jennifer Aniston, Johnny Depp',
    description: [
      'Natural diplomats with strong intuition.',
      'Cooperative and work well in partnerships.',
      'Creative and artistic inclinations.',
      'Emotionally sensitive; need emotional security.',
      'Suitable for fields like hospitality, nursing, arts, and water-related businesses.',
      'Favourable directions: North-West and West.',
    ],
  },
  3: {
    number: 3,
    title: 'The Communicator',
    rulingPlanet: 'Jupiter',
    good: 'Optimistic, Wise, Generous',
    bad: 'Overconfident, Extravagant',
    famousPersonalities: 'Albert Einstein, Steven Spielberg, Madonna',
    description: [
      'Wise and optimistic; natural teachers and advisors.',
      'Generous and religious or philosophical leanings.',
      'Success in education, law, banking, and consultancy.',
      'Favourable directions: North-East, North, and East.',
    ],
  },
  4: {
    number: 4,
    title: 'The Builder',
    rulingPlanet: 'Rahu',
    good: 'Practical, Disciplined, Hardworking',
    bad: 'Stubborn, Pessimistic',
    famousPersonalities: 'Bill Gates, Oprah Winfrey, Arnold Schwarzenegger',
    description: [
      'Practical and disciplined; strong work ethic.',
      'Good at building systems and structures.',
      'Success in real estate, construction, technology, and unconventional fields.',
      'Favourable directions: South-West and South.',
    ],
  },
  5: {
    number: 5,
    title: 'The Free Spirit',
    rulingPlanet: 'Mercury',
    good: 'Quick-witted, Adaptable, Intelligent',
    bad: 'Restless, Nervous',
    famousPersonalities: 'Angelina Jolie, David Beckham, Mark Zuckerberg',
    description: [
      'Quick-witted and adaptable; excellent communicators.',
      'Success in trade, media, writing, and communication-related fields.',
      'Favourable directions: North and North-East.',
    ],
  },
  6: {
    number: 6,
    title: 'The Nurturer',
    rulingPlanet: 'Venus',
    good: 'Loving, Artistic, Harmonious',
    bad: 'Possessive, Indulgent',
    famousPersonalities: 'John Lennon, Michael Jackson, Marilyn Monroe',
    description: [
      'Artistic and love beauty and harmony.',
      'Success in arts, fashion, entertainment, and luxury-related businesses.',
      'Favourable directions: South-East and South.',
    ],
  },
  7: {
    number: 7,
    title: 'The Seeker',
    rulingPlanet: 'Ketu',
    good: 'Spiritual, Analytical, Mystical',
    bad: 'Aloof, Skeptical',
    famousPersonalities: 'Johnny Depp, Leonardo DiCaprio, Michael Douglas',
    description: [
      'Spiritual and analytical; drawn to mystery and research.',
      'Success in research, spirituality, healing, and unconventional paths.',
      'Favourable directions: North-East and North-West.',
    ],
  },
  8: {
    number: 8,
    title: 'The Achiever',
    rulingPlanet: 'Saturn',
    good: 'Ambitious, Disciplined, Authoritative',
    bad: 'Pessimistic, Rigid',
    famousPersonalities: 'Pablo Picasso, Neil Armstrong, Paul McCartney',
    description: [
      'Ambitious with strong sense of responsibility.',
      'Success in administration, mining, labour, and long-term ventures.',
      'Favourable directions: West and South-West.',
    ],
  },
  9: {
    number: 9,
    title: 'The Humanitarian',
    rulingPlanet: 'Mars',
    good: 'Courageous, Energetic, Leadership',
    bad: 'Aggressive, Impatient',
    famousPersonalities: 'Mahatma Gandhi, Jim Carrey, Harrison Ford',
    description: [
      'Courageous and energetic; natural leaders.',
      'Success in army, sports, surgery, real estate, and fire-related industries.',
      'Favourable directions: South, South-East, and North-East.',
    ],
  },
};

export function getNumberDetail(n: number): NumberDetail | null {
  const single = n > 9 ? (n % 9 === 0 ? 9 : n % 9) : n;
  if (single >= 1 && single <= 9) {
    return NUMBER_DETAILS[single];
  }
  return null;
}

