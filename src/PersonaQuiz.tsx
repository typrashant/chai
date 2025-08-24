import React, { useState } from 'react';
import { type User, updateUserPersona, awardPoints } from './db';

interface PersonaQuizProps {
  user: User;
  onQuizComplete: (user: User) => void;
}

const quizQuestions = [
  {
    question: "When it comes to investing, I'm more concerned about...",
    answers: [
      { text: 'Missing out on potential gains.', value: { risk: 2, discipline: 0 } },
      { text: 'Losing my initial investment.', value: { risk: -2, discipline: 0 } },
      { text: 'A balance of both.', value: { risk: 0, discipline: 0 } },
    ],
  },
  {
    question: 'Imagine you receive a surprise bonus of ₹50,000. What\'s your first instinct?',
    answers: [
      { text: 'Invest it aggressively in stocks for high growth.', value: { risk: 2, discipline: 0 } },
      { text: 'Put it straight into a safe fixed deposit or savings account.', value: { risk: -2, discipline: 0 } },
      { text: 'Split it between safe options and some moderate-risk investments.', value: { risk: 0, discipline: 0 } },
    ],
  },
  {
    question: 'My ideal financial future involves:',
    answers: [
      { text: 'Building significant wealth, even if it means taking big risks.', value: { risk: 2, discipline: 0 } },
      { text: 'Ensuring my money is safe and secure, with slow, steady growth.', value: { risk: -2, discipline: 0 } },
      { text: 'A comfortable lifestyle with a mix of growth and security.', value: { risk: 0, discipline: 0 } },
    ],
  },
  {
    question: 'How often do you track your monthly income and expenses?',
    answers: [
        { text: 'Diligently. I follow a budget.', value: { risk: 0, discipline: 2 } },
        { text: 'Sometimes, but not consistently.', value: { risk: 0, discipline: 0 } },
        { text: 'Rarely or never.', value: { risk: 0, discipline: -2 } },
    ]
  },
  {
    question: 'Which statement best describes your approach to financial goals?',
    answers: [
        { text: 'I have specific, written long-term goals I\'m working towards.', value: { risk: 0, discipline: 2 } },
        { text: 'I have some general ideas about what I want in the future.', value: { risk: 0, discipline: 0 } },
        { text: 'I focus more on my short-term needs and wants.', value: { risk: 0, discipline: -2 } },
    ]
  }
];

const personaTypes = {
    Guardian: {
        description: "You are a meticulous planner who prioritizes capital preservation. Your financial strategy is built on safety, security, and predictable outcomes.",
    },
    Planner: {
        description: "You are goal-oriented and methodical. You follow a well-defined financial plan, balancing growth and security to achieve your long-term objectives.",
    },
    Adventurer: {
        description: "You are a calculated risk-taker. You thoroughly research high-growth opportunities and strategically add them to your portfolio to maximize returns.",
    },
    Spender: {
        description: "You prioritize your present lifestyle and tend to live in the moment. You prefer keeping your money accessible rather than planning for the distant future.",
    },
    Seeker: {
        description: "You are interested in growing your money but lack a concrete strategy. You might have a mix of investments but are looking for guidance to create a more structured plan.",
    },
    Accumulator: {
        description: "You are an optimistic and spontaneous investor, often drawn to the excitement of high-growth trends. You are motivated by potential big wins but may lack a formal long-term strategy.",
    }
};

const POINTS_FOR_COMPLETION = 30;

const PersonaQuiz: React.FC<PersonaQuizProps> = ({ user, onQuizComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [riskScore, setRiskScore] = useState(0);
  const [disciplineScore, setDisciplineScore] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [persona, setPersona] = useState('');
  const [updatedUser, setUpdatedUser] = useState<User | null>(null);

  const handleAnswerClick = (value: { risk: number; discipline: number }) => {
    const newRiskScore = riskScore + value.risk;
    const newDisciplineScore = disciplineScore + value.discipline;
    setRiskScore(newRiskScore);
    setDisciplineScore(newDisciplineScore);

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz(newRiskScore, newDisciplineScore);
    }
  };

  const finishQuiz = (finalRiskScore: number, finalDisciplineScore: number) => {
    let finalPersona: keyof typeof personaTypes;

    if (finalDisciplineScore > 0) { // High Discipline
        if (finalRiskScore > 1) {
            finalPersona = 'Adventurer';
        } else if (finalRiskScore < -1) {
            finalPersona = 'Guardian';
        } else {
            finalPersona = 'Planner';
        }
    } else { // Low Discipline
        if (finalRiskScore > 1) {
            finalPersona = 'Accumulator';
        } else if (finalRiskScore < -1) {
            finalPersona = 'Spender';
        } else {
            finalPersona = 'Seeker';
        }
    }
    
    setPersona(finalPersona);
    updateUserPersona(user.clientID, finalPersona);
    const finalUpdatedUser = awardPoints(user.clientID, 'personaQuiz', POINTS_FOR_COMPLETION);
    
    if(finalUpdatedUser) {
        setUpdatedUser(finalUpdatedUser);
        setIsQuizFinished(true);
    }
  };

  if (isQuizFinished) {
    return (
      <div className="container quiz-container">
        <div className="persona-result">
            <p>Congratulations, you're a...</p>
            <h2>{persona}</h2>
            <p>{personaTypes[persona as keyof typeof personaTypes].description}</p>
            <p className="points-earned">✨ You've earned {POINTS_FOR_COMPLETION} points! ✨</p>
            <button className="auth-button" onClick={() => updatedUser && onQuizComplete(updatedUser)}>
                Continue to Dashboard
            </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

  return (
    <div className="container quiz-container">
      <h1>Let's Discover Your Persona</h1>
      <p>Answer a few questions to get personalized advice.</p>
      <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar-inner" style={{ width: `${progress}%` }}></div>
      </div>
      <div>
        <h2 className="question-text">{currentQuestion.question}</h2>
        <div className="answer-options">
          {currentQuestion.answers.map((answer, index) => (
            <button key={index} onClick={() => handleAnswerClick(answer.value)}>
              {answer.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PersonaQuiz;
