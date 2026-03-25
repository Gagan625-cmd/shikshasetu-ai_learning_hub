export interface GKQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export const GK_QUESTIONS: GKQuestion[] = [
  { question: "What is the capital of France?", options: ["Berlin", "Madrid", "Paris", "Rome"], correctAnswer: 2 },
  { question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctAnswer: 1 },
  { question: "How many continents are there on Earth?", options: ["5", "6", "7", "8"], correctAnswer: 2 },
  { question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctAnswer: 3 },
  { question: "Who painted the Mona Lisa?", options: ["Picasso", "Da Vinci", "Van Gogh", "Rembrandt"], correctAnswer: 1 },
  { question: "What is the chemical symbol for water?", options: ["CO2", "H2O", "O2", "NaCl"], correctAnswer: 1 },
  { question: "Which is the smallest country in the world?", options: ["Monaco", "Vatican City", "Nauru", "San Marino"], correctAnswer: 1 },
  { question: "How many bones are in the adult human body?", options: ["186", "206", "226", "246"], correctAnswer: 1 },
  { question: "What gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correctAnswer: 2 },
  { question: "Which animal is known as the King of the Jungle?", options: ["Tiger", "Elephant", "Lion", "Bear"], correctAnswer: 2 },
  { question: "What is the largest planet in our solar system?", options: ["Saturn", "Neptune", "Jupiter", "Uranus"], correctAnswer: 2 },
  { question: "How many colors are in a rainbow?", options: ["5", "6", "7", "8"], correctAnswer: 2 },
  { question: "Which organ pumps blood in the human body?", options: ["Lungs", "Brain", "Liver", "Heart"], correctAnswer: 3 },
  { question: "What is the speed of light?", options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "100,000 km/s"], correctAnswer: 0 },
  { question: "Which country is home to the kangaroo?", options: ["New Zealand", "South Africa", "Australia", "India"], correctAnswer: 2 },
  { question: "What is the hardest natural substance?", options: ["Gold", "Iron", "Diamond", "Platinum"], correctAnswer: 2 },
  { question: "Who discovered gravity?", options: ["Einstein", "Newton", "Galileo", "Tesla"], correctAnswer: 1 },
  { question: "What is the currency of Japan?", options: ["Yuan", "Won", "Yen", "Ringgit"], correctAnswer: 2 },
  { question: "How many teeth does an adult human have?", options: ["28", "30", "32", "34"], correctAnswer: 2 },
  { question: "Which vitamin is obtained from sunlight?", options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"], correctAnswer: 3 },
  { question: "What is the tallest mountain in the world?", options: ["K2", "Kangchenjunga", "Mount Everest", "Makalu"], correctAnswer: 2 },
  { question: "Which blood cells fight infection?", options: ["Red cells", "White cells", "Platelets", "Plasma"], correctAnswer: 1 },
  { question: "What is the boiling point of water?", options: ["90°C", "95°C", "100°C", "105°C"], correctAnswer: 2 },
  { question: "Which is the longest river in the world?", options: ["Amazon", "Nile", "Yangtze", "Mississippi"], correctAnswer: 1 },
  { question: "What is the national bird of India?", options: ["Sparrow", "Eagle", "Peacock", "Parrot"], correctAnswer: 2 },
  { question: "How many players are on a cricket team?", options: ["9", "10", "11", "12"], correctAnswer: 2 },
  { question: "What is the largest desert in the world?", options: ["Sahara", "Gobi", "Antarctic", "Arabian"], correctAnswer: 2 },
  { question: "Which element has the symbol 'Fe'?", options: ["Fluorine", "Iron", "Fermium", "Francium"], correctAnswer: 1 },
  { question: "What is the square root of 144?", options: ["10", "11", "12", "13"], correctAnswer: 2 },
  { question: "Which is the fastest land animal?", options: ["Lion", "Cheetah", "Horse", "Leopard"], correctAnswer: 1 },
];

export function getRandomGKQuestions(count: number): GKQuestion[] {
  const shuffled = [...GK_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
