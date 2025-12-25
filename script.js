const paragraphBanks = {
  easy: [
    'The sun shines bright in the sky. Birds sing in the trees. The day is warm and nice. People walk in the park. Children play on the grass. Dogs run and have fun. The air smells fresh and clean.',
    'I like to read books at home. My cat sits on my lap. The room is quiet and calm. Time passes slow and easy. I drink tea and relax. The book tells a good story. I feel happy and at peace.',
    'The store is open all day. People buy food and drinks. The aisles are wide and bright. Music plays in the background. Workers help with a smile. Carts roll down the rows. The checkout line moves fast.',
    'Rain falls from the clouds above. The ground gets wet and dark. Plants drink the water with joy. Puddles form on the street. Kids jump and splash around. The air feels cool and damp. The rain will stop soon.',
    'We went to the beach last week. The sand was soft and warm. Waves crashed on the shore. Seagulls flew in the air. We built a big sandcastle. The sun made the water shine. It was a great day.'
  ],
  medium: [
    'Technology continues to transform our daily lives in remarkable ways. Smartphones connect us to information instantly, while social media platforms enable global communication. Artificial intelligence assists with complex tasks, making our work more efficient. However, we must balance digital convenience with personal wellbeing and meaningful human connections.',
    'Climate change represents one of the most pressing challenges facing humanity today. Rising temperatures affect ecosystems worldwide, causing severe weather patterns and habitat loss. Scientists emphasize the importance of sustainable practices and renewable energy sources. Individual actions, combined with policy changes, can make a significant difference in protecting our planet for future generations.',
    'The art of effective communication extends beyond mere words. Body language, tone of voice, and active listening play crucial roles in conveying messages accurately. Understanding cultural differences enhances our ability to connect with diverse audiences. Strong communication skills are essential in both personal relationships and professional environments.',
    'Education opens doors to endless opportunities and personal growth. Learning new skills builds confidence and expands career prospects. Modern educational technology provides access to knowledge from anywhere in the world. Critical thinking and creativity become increasingly valuable in our rapidly changing society. Lifelong learning keeps minds sharp and spirits engaged.',
    'Physical fitness contributes significantly to overall health and happiness. Regular exercise strengthens the cardiovascular system and improves mental clarity. Balanced nutrition provides the energy needed for daily activities. Adequate sleep allows the body to repair and rejuvenate. Maintaining healthy habits requires dedication but yields tremendous long-term benefits.'
  ],
  hard: [
    'The philosophical implications of consciousness remain one of the most perplexing enigmas in contemporary neuroscience. Despite significant technological advancements in neuroimaging and computational modeling, researchers continue to grapple with the fundamental nature of subjective experience. The hard problem of consciousness, articulated by philosopher David Chalmers, questions how physical processes in the brain give rise to phenomenal awareness and qualia.',
    'Quantum mechanics fundamentally challenged classical physics paradigms through its counterintuitive principles and probabilistic framework. The Copenhagen interpretation, proposed by Niels Bohr and Werner Heisenberg, suggests that particles exist in superposition states until observation collapses the wave function. This revolutionary theory has profound implications for our understanding of reality, determinism, and the role of observers in physical systems.',
    'Anthropological studies reveal fascinating insights into human cultural evolution and societal structures throughout history. Archaeological evidence demonstrates how ancient civilizations developed sophisticated systems of governance, agriculture, and technological innovation. Contemporary ethnographic research examines cultural diversity and universal human experiences, challenging ethnocentric assumptions and promoting cross-cultural understanding in an increasingly interconnected world.',
    'The intersection of artificial intelligence and ethical considerations presents unprecedented challenges for policymakers and technologists. Algorithmic bias, privacy concerns, and the potential displacement of human labor demand careful deliberation and proactive governance frameworks. As machine learning systems become increasingly autonomous and influential, establishing robust ethical guidelines becomes paramount to ensuring beneficial outcomes for humanity.',
    'Biodiversity conservation requires comprehensive strategies that balance ecological preservation with socioeconomic development. Habitat fragmentation, invasive species, and anthropogenic climate change threaten countless ecosystems worldwide. Conservation biology integrates ecological science with policy implementation, emphasizing the intrinsic value of species diversity and the ecosystem services that sustain human civilization and planetary health.'
  ]
};

// Game State
let gameState = {
  timer: null,
  gameStart: null,
  currentDifficulty: 'medium',
  currentDuration: 30,
  wordsTyped: 0,
  correctWords: 0,
  incorrectWords: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalKeystrokes: 0,
  correctKeystrokes: 0
};

// TTS State
let ttsState = {
  speech: new SpeechSynthesisUtterance(),
  voices: [],
  currentVoice: null,
  isSpeaking: false
};

// ========================================
// Utility Functions
// ========================================

function addClass(el, name) {
  el?.classList.add(name);
}

function removeClass(el, name) {
  el?.classList.remove(name);
}

function getRandomParagraph(difficulty = 'medium') {
  const paragraphs = paragraphBanks[difficulty];
  const randomIndex = Math.floor(Math.random() * paragraphs.length);
  return paragraphs[randomIndex];
}

function formatWord(word) {
  return `<div class="word">${word.split('').map(letter =>
    `<span class="letter">${letter}</span>`
  ).join('')}</div>`;
}

function createCursor() {
  const cursor = document.createElement('span');
  cursor.id = 'cursor';
  return cursor;
}

function moveCursor(currentLetter) {
  const cursor = document.getElementById('cursor');
  if (cursor && currentLetter) {
    const rect = currentLetter.getBoundingClientRect();
    const wordsContainer = document.getElementById('words');
    const containerRect = wordsContainer.getBoundingClientRect();
    cursor.style.left = `${rect.left - containerRect.left}px`;
    cursor.style.top = `${rect.top - containerRect.top}px`;
  }
}

function checkAndScroll(currentWord) {
  const wordsContainer = document.getElementById('words');
  const currentWordRect = currentWord.getBoundingClientRect();
  const containerRect = wordsContainer.getBoundingClientRect();
  if (currentWordRect.bottom > containerRect.bottom - 100) {
    wordsContainer.scrollTop += currentWordRect.height;
  }
}

// ========================================
// Statistics Functions
// ========================================

function calculateWPM() {
  if (!gameState.gameStart) return 0;
  const currentTime = new Date().getTime();
  const timeInMinutes = (currentTime - gameState.gameStart) / 60000;
  if (timeInMinutes === 0) return 0;
  return Math.round(gameState.correctWords / timeInMinutes);
}

function calculateAccuracy() {
  if (gameState.totalKeystrokes === 0) return 100;
  return Math.round((gameState.correctKeystrokes / gameState.totalKeystrokes) * 100);
}

function updateStats() {
  const wpm = calculateWPM();
  const accuracy = calculateAccuracy();

  document.getElementById('wpmDisplay').textContent = wpm;
  document.getElementById('accuracyDisplay').textContent = `${accuracy}%`;
  document.getElementById('streakDisplay').textContent = gameState.currentStreak;
}

function updateTimer() {
  if (!gameState.gameStart) return;

  const currentTime = new Date().getTime();
  const msPassed = currentTime - gameState.gameStart;
  const sPassed = Math.round(msPassed / 1000);
  const sLeft = gameState.currentDuration - sPassed;

  document.getElementById('timeDisplay').textContent = `${sLeft}s`;

  // Update progress bar
  const progress = (sPassed / gameState.currentDuration) * 100;
  document.getElementById('progressBar').style.width = `${progress}%`;

  if (sLeft <= 0) {
    gameOver();
  }
}

// ========================================
// Text-to-Speech Functions
// ========================================

function loadVoices() {
  ttsState.voices = window.speechSynthesis.getVoices();
  const voiceSelect = document.getElementById('voiceSelect');
  voiceSelect.innerHTML = '';

  if (ttsState.voices.length === 0) {
    voiceSelect.innerHTML = '<option>Loading voices...</option>';
    return;
  }

  ttsState.voices.forEach((voice, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });

  ttsState.currentVoice = ttsState.voices[0];
}

function speakText(text) {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }

  const voiceSelect = document.getElementById('voiceSelect');
  const speedSelect = document.getElementById('speedSelect');
  const selectedVoiceIndex = parseInt(voiceSelect.value);
  const selectedSpeed = parseFloat(speedSelect.value);

  ttsState.speech.text = text;
  ttsState.speech.voice = ttsState.voices[selectedVoiceIndex] || ttsState.voices[0];
  ttsState.speech.rate = selectedSpeed;

  ttsState.speech.onstart = () => {
    ttsState.isSpeaking = true;
    document.getElementById('ttsIndicator').classList.add('active');
  };

  ttsState.speech.onend = () => {
    ttsState.isSpeaking = false;
    document.getElementById('ttsIndicator').classList.remove('active');
  };

  window.speechSynthesis.speak(ttsState.speech);
}

function pauseSpeech() {
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();
  }
}

function resumeSpeech() {
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
}

function stopSpeech() {
  window.speechSynthesis.cancel();
  ttsState.isSpeaking = false;
  document.getElementById('ttsIndicator').classList.remove('active');
}

function speakGameWords() {
  const words = [...document.querySelectorAll('.word')]
    .slice(0, 30)
    .map(word => word.textContent)
    .join(' ');

  speakText(words);
}

// ========================================
// Game Functions
// ========================================

function newGame() {
  // Stop any ongoing speech
  stopSpeech();

  // Get settings
  const difficulty = document.getElementById('difficultySelect').value;
  const duration = parseInt(document.getElementById('durationSelect').value);

  // Reset game state
  gameState = {
    timer: null,
    gameStart: null,
    currentDifficulty: difficulty,
    currentDuration: duration,
    wordsTyped: 0,
    correctWords: 0,
    incorrectWords: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalKeystrokes: 0,
    correctKeystrokes: 0
  };

  // Generate words from logical paragraphs
  const wordsContainer = document.getElementById('words');
  wordsContainer.innerHTML = '';
  let htmlContent = '';

  // Get multiple paragraphs to create enough content
  let allWords = [];
  for (let i = 0; i < 10; i++) {
    const paragraph = getRandomParagraph(difficulty);
    const words = paragraph.split(' ');
    allWords = allWords.concat(words);
  }

  // Format all words
  allWords.forEach(word => {
    htmlContent += formatWord(word);
  });

  wordsContainer.innerHTML = htmlContent;

  // Set first word and letter as current
  const firstWord = document.querySelector('.word');
  const firstLetter = firstWord?.querySelector('.letter');
  if (firstWord) addClass(firstWord, 'current');
  if (firstLetter) addClass(firstLetter, 'current');

  // Add cursor
  const cursor = createCursor();
  wordsContainer.appendChild(cursor);
  moveCursor(firstLetter);

  // Reset UI
  wordsContainer.scrollTop = 0;
  removeClass(document.getElementById('game'), 'over');
  document.getElementById('timeDisplay').textContent = `${duration}s`;
  document.getElementById('wpmDisplay').textContent = '0';
  document.getElementById('accuracyDisplay').textContent = '100%';
  document.getElementById('streakDisplay').textContent = '0';
  document.getElementById('progressBar').style.width = '0%';

  // Hide modal
  document.getElementById('gameOverModal').classList.remove('active');

  // Focus game
  document.getElementById('game').focus();

  // Auto-speak if enabled
  if (document.getElementById('autoSpeakToggle').checked) {
    setTimeout(() => speakGameWords(), 500);
  }
}

function gameOver() {
  clearInterval(gameState.timer);
  addClass(document.getElementById('game'), 'over');

  stopSpeech();

  const wpm = calculateWPM();
  const accuracy = calculateAccuracy();

  // Update final stats
  document.getElementById('finalWpm').textContent = wpm;
  document.getElementById('finalAccuracy').textContent = `${accuracy}%`;
  document.getElementById('finalCorrect').textContent = gameState.correctWords;
  document.getElementById('finalStreak').textContent = gameState.bestStreak;

  // Performance message
  let message = '';
  if (wpm >= 80) {
    message = '🔥 Incredible! You\'re a typing master!';
  } else if (wpm >= 60) {
    message = '🎉 Excellent work! You\'re very fast!';
  } else if (wpm >= 40) {
    message = '👍 Good job! Keep practicing!';
  } else if (wpm >= 20) {
    message = '💪 Not bad! You\'re improving!';
  } else {
    message = '📚 Keep practicing, you\'ll get better!';
  }

  document.getElementById('performanceMessage').textContent = message;

  // Show modal
  document.getElementById('gameOverModal').classList.add('active');
}

// ========================================
// Event Listeners
// ========================================

// CRITICAL FIX: Prevent space bar from scrolling the page AND handle input
// Must preventDefault on keydown to stop scrolling
document.addEventListener('keydown', (ev) => {
  const key = ev.key;
  
  // Prevent default behavior for space bar to stop page scrolling
  if (key === ' ' || key === 'Spacebar') {
    ev.preventDefault();
    return false;
  }
});

// Keyboard events for typing logic - using keydown for immediate response
document.addEventListener('keydown', (ev) => {
  // Skip if already processed (for space bar prevention)
  if (ev.defaultPrevented && ev.key !== ' ' && ev.key !== 'Spacebar') return;
  
  const key = ev.key;
  const currentWord = document.querySelector('.word.current');
  const currentLetter = document.querySelector('.letter.current');
  const expected = currentLetter ? currentLetter.textContent : '';

  const isLetter = key.length === 1 && key !== ' ';
  const isSpace = key === ' ' || key === 'Spacebar';
  const isBackspace = key === 'Backspace';

  if (document.getElementById('game').classList.contains('over')) return;

  // Start timer on first keystroke
  if (!gameState.timer && (isLetter || isSpace)) {
    gameState.gameStart = new Date().getTime();
    gameState.timer = setInterval(() => {
      updateTimer();
      updateStats();
    }, 100);
  }

  if (!currentWord || !currentLetter) return;

  // Handle letter input
  if (isLetter) {
    gameState.totalKeystrokes++;

    if (key === expected) {
      addClass(currentLetter, 'correct');
      removeClass(currentLetter, 'incorrect');
      gameState.correctKeystrokes++;
    } else {
      addClass(currentLetter, 'incorrect');
    }

    removeClass(currentLetter, 'current');
    const nextLetter = currentLetter.nextElementSibling;

    if (nextLetter) {
      addClass(nextLetter, 'current');
      moveCursor(nextLetter);
    } else {
      // At end of word - wait for space
      // Keep cursor on last letter
      addClass(currentLetter, 'current');
    }
  }

  // Handle space - move to next word
  if (isSpace) {
    ev.preventDefault(); // Prevent any default action
    
    // Count space as a keystroke
    gameState.totalKeystrokes++;

    // Get all letters in current word
    const letters = [...currentWord.querySelectorAll('.letter')];

    // Find current letter position
    const currentLetterIndex = letters.indexOf(currentLetter);

    // Mark any untyped letters as incorrect
    letters.forEach((letter, index) => {
      if (index >= currentLetterIndex && !letter.classList.contains('correct')) {
        addClass(letter, 'incorrect');
      }
    });

    // Check if the word was typed correctly
    const allCorrect = letters.every(letter =>
      letter.classList.contains('correct')
    );

    if (allCorrect) {
      gameState.correctWords++;
      gameState.currentStreak++;
      gameState.correctKeystrokes++; // Count space as correct
      if (gameState.currentStreak > gameState.bestStreak) {
        gameState.bestStreak = gameState.currentStreak;
      }
    } else {
      gameState.incorrectWords++;
      gameState.currentStreak = 0;
    }

    // Move to next word
    removeClass(currentWord, 'current');
    removeClass(currentLetter, 'current');
    
    const nextWord = currentWord.nextElementSibling;

    if (nextWord) {
      addClass(nextWord, 'current');
      const firstLetter = nextWord.querySelector('.letter');
      if (firstLetter) {
        addClass(firstLetter, 'current');
        moveCursor(firstLetter);
        checkAndScroll(nextWord);
      }
    } else {
      // No more words - end game
      gameOver();
    }
    
    updateStats();
    return false;
  }

  // Handle backspace
  if (isBackspace) {
    const prevLetter = currentLetter.previousElementSibling;
    if (prevLetter) {
      removeClass(currentLetter, 'current');
      addClass(prevLetter, 'current');
      removeClass(prevLetter, 'incorrect');
      removeClass(prevLetter, 'correct');
      moveCursor(prevLetter);
    } else {
      // At start of word, go to previous word
      const prevWord = currentWord.previousElementSibling;
      if (prevWord) {
        removeClass(currentWord, 'current');
        addClass(prevWord, 'current');
        const lastLetter = prevWord.querySelector('.letter:last-child');
        if (lastLetter) {
          removeClass(currentLetter, 'current');
          addClass(lastLetter, 'current');
          removeClass(lastLetter, 'incorrect');
          removeClass(lastLetter, 'correct');
          moveCursor(lastLetter);
        }
      }
    }
  }

  if (currentWord) checkAndScroll(currentWord);
  updateStats();
});

// Button event listeners
document.getElementById('newGameButton')?.addEventListener('click', () => {
  if (gameState.timer) {
    gameOver();
  }
  newGame();
});

document.getElementById('playAgainButton')?.addEventListener('click', () => {
  newGame();
});

// TTS button listeners
document.getElementById('speakButton')?.addEventListener('click', () => {
  speakGameWords();
});

document.getElementById('pauseButton')?.addEventListener('click', () => {
  if (window.speechSynthesis.paused) {
    resumeSpeech();
  } else {
    pauseSpeech();
  }
});

document.getElementById('stopButton')?.addEventListener('click', () => {
  stopSpeech();
});

// ========================================
// Initialization
// ========================================

// Load voices
if (window.speechSynthesis.onvoiceschanged !== undefined) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
}
loadVoices();

// Start game on load
window.addEventListener('load', () => {
  newGame();
});

// Create particles
function createParticles() {
  const particlesContainer = document.getElementById('particles');
  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = Math.random() * 3 + 'px';
    particle.style.height = particle.style.width;
    particle.style.background = `rgba(139, 92, 246, ${Math.random() * 0.5})`;
    particle.style.borderRadius = '50%';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animation = `float ${Math.random() * 10 + 10}s infinite ease-in-out`;
    particle.style.animationDelay = Math.random() * 5 + 's';
    particlesContainer.appendChild(particle);
  }
}

createParticles();





























































































































































































// const words = 'The sun began to set, casting a golden hue over the quiet town as the streets slowly emptied'.split(' ');
// const wordsCount = words.length;
// const gameTime = 30 * 1000; // 30 seconds
// window.timer = null;
// window.gameStart = null;

// function addClass(el, name) {
//     el?.classList.add(name);
// }

// function removeClass(el, name) {
//     el?.classList.remove(name);
// }

// function randomWord() {
//     const randomIndex = Math.floor(Math.random() * wordsCount);
//     return words[randomIndex];
// }

// function formatWord(word) {
//     return `<div class="word">${word.split('').map(letter => `<span class="letter">${letter}</span>`).join('')}</div>`;
// }

// function createCursor() {
//     const cursor = document.createElement('span');
//     cursor.id = 'cursor';
//     return cursor;
// }

// function moveCursor(currentLetter) {
//     const cursor = document.getElementById('cursor');
//     if (cursor && currentLetter) {
//         const rect = currentLetter.getBoundingClientRect();
//         const wordsContainer = document.getElementById('words');
//         const containerRect = wordsContainer.getBoundingClientRect();
//         cursor.style.left = `${rect.left - containerRect.left}px`;
//         cursor.style.top = `${rect.top - containerRect.top}px`;
//     }
// }

// function gameOver() {
//     clearInterval(window.timer);
//     addClass(document.getElementById('game'), 'over');
//     const wpm = getWpm();
//     document.getElementById('info').innerHTML = `Game Over! WPM: ${wpm}`;
//     alert(`Game Over! Your WPM: ${wpm}`);
// }

// function newGame() {
//     const wordsContainer = document.getElementById('words');
//     wordsContainer.innerHTML = '';
//     let htmlContent = '';

//     // Create random words for the game
//     for (let i = 0; i < 200; i++) {
//         htmlContent += formatWord(randomWord());
//     }

//     wordsContainer.innerHTML = htmlContent;

//     // Set the first word and letter as 'current'
//     const firstWord = document.querySelector('.word');
//     const firstLetter = firstWord?.querySelector('.letter');
//     if (firstWord) addClass(firstWord, 'current');
//     if (firstLetter) addClass(firstLetter, 'current');

//     wordsContainer.scrollTop = 0;

//     // Add the cursor to the container
//     const cursor = createCursor();
//     wordsContainer.appendChild(cursor);
//     moveCursor(firstLetter);

//     // Focus the words container
//     wordsContainer.tabIndex = -1;
//     wordsContainer.focus();

//     window.timer = null;
//     window.gameStart = null;
//     removeClass(document.getElementById('game'), 'over');
//     document.getElementById('info').innerHTML = '0';

//     // --------- SPEECH SYNTHESIS LOGIC ---------
//     // Collect the generated words and speak them
//     const generatedText = [...document.querySelectorAll('.word')]
//         .slice(0, 20) // Only use the first 20 words for TTS
//         .map(word => word.innerText) // Extract text content from each word element
//         .join(' '); // Join the words into a single string

//     // Set up the speech synthesis
//     let speech = new SpeechSynthesisUtterance(generatedText);
//     window.speechSynthesis.cancel(); // Cancel any previous speech
//     window.speechSynthesis.speak(speech); // Speak the generated text
// }

// // --------- SPEECH SYNTHESIS FIX ----------
// let voices = [];
// let voiceSelect = document.querySelector("select");
// let speakButton = document.querySelector("button");
// let textarea = document.querySelector("textarea");

// function populateVoices() {
//     voices = window.speechSynthesis.getVoices();
//     voiceSelect.innerHTML = '';

//     voices.forEach((voice, i) => {
//         const option = new Option(voice.name, i);
//         voiceSelect.add(option);
//     });

//     speech.voice = voices[0]; // Default
// }

// window.speechSynthesis.onvoiceschanged = populateVoices;

// speakButton?.addEventListener("click", () => {
//     const selectedIndex = voiceSelect.value;
//     if (voices[selectedIndex]) {
//         speech.voice = voices[selectedIndex];
//     }
//     speech.text = textarea.value;
//     window.speechSynthesis.speak(speech);
// });

// // --------- WORD CHECK & GAME LOGIC ---------
// function checkAndScroll(currentWord) {
//     const wordsContainer = document.getElementById('words');
//     const currentWordRect = currentWord.getBoundingClientRect();
//     const containerRect = wordsContainer.getBoundingClientRect();
//     if (currentWordRect.bottom > containerRect.bottom - 250) {
//         wordsContainer.scrollTop += currentWordRect.height;
//     }
// }

// function getWpm() {
//     const words = [...document.querySelectorAll('.word')];
//     const lastTypedWord = document.querySelector('.word.current');
//     const lastTypedWordIndex = words.indexOf(lastTypedWord);
//     const typedWords = words.slice(0, lastTypedWordIndex + 1);
//     const correctWords = typedWords.filter(word => {
//         const letters = [...word.children];
//         const incorrectLetters = letters.filter(letter => letter.classList.contains('incorrect'));
//         return incorrectLetters.length === 0;
//     });
//     const totalTimeInMinutes = gameTime / 60000;
//     return Math.round(correctWords.length / totalTimeInMinutes);
// }

// document.addEventListener('keyup', (ev) => {
//     const key = ev.key;
//     const currentWord = document.querySelector('.word.current');
//     const currentLetter = document.querySelector('.letter.current');
//     const expected = currentLetter ? currentLetter.innerHTML || ' ' : '';

//     const isLetter = key.length === 1 && key !== ' ';
//     const isSpace = key === ' ';
//     const isBackspace = key === 'Backspace';

//     if (document.getElementById('game').classList.contains('over')) return;

//     if (!window.timer && isLetter) {
//         window.timer = setInterval(() => {
//             if (!window.gameStart) {
//                 window.gameStart = (new Date()).getTime();
//             }

//             const currentTime = (new Date()).getTime();
//             const msPassed = currentTime - window.gameStart;
//             const sPassed = Math.round(msPassed / 1000);
//             const sLeft = (gameTime / 1000) - sPassed;

//             if (sLeft <= 0) gameOver();

//             document.getElementById('info').innerHTML = `${sPassed}`;
//         }, 1000);
//     }

//     if (!currentWord || !currentLetter) return;

//     if (isLetter) {
//         if (key === expected) {
//             addClass(currentLetter, 'correct');
//             removeClass(currentLetter, 'incorrect');
//         } else {
//             addClass(currentLetter, 'incorrect');
//         }

//         removeClass(currentLetter, 'current');
//         const nextLetter = currentLetter.nextElementSibling;
//         if (nextLetter) {
//             addClass(nextLetter, 'current');
//             moveCursor(nextLetter);
//         } else {
//             removeClass(currentWord, 'current');
//             const nextWord = currentWord.nextElementSibling;
//             if (nextWord) {
//                 addClass(nextWord, 'current');
//                 const firstLetter = nextWord.querySelector('.letter');
//                 if (firstLetter) {
//                     addClass(firstLetter, 'current');
//                     moveCursor(firstLetter);
//                 }
//             }
//         }
//     }

//     if (isSpace) {
//         [...currentWord.querySelectorAll('.letter:not(.correct)')].forEach(letter => addClass(letter, 'incorrect'));
//         removeClass(currentWord, 'current');
//         const nextWord = currentWord.nextElementSibling;
//         if (nextWord) {
//             addClass(nextWord, 'current');
//             const firstLetter = nextWord.querySelector('.letter');
//             if (firstLetter) {
//                 addClass(firstLetter, 'current');
//                 moveCursor(firstLetter);
//             }
//         }
//     }

//     if (isBackspace) {
//         const prevLetter = currentLetter.previousElementSibling;
//         if (prevLetter) {
//             removeClass(currentLetter, 'current');
//             addClass(prevLetter, 'current');
//             removeClass(prevLetter, 'incorrect');
//             removeClass(prevLetter, 'correct');
//             moveCursor(prevLetter);
//         } else {
//             const prevWord = currentWord.previousElementSibling;
//             if (prevWord) {
//                 removeClass(currentWord, 'current');
//                 addClass(prevWord, 'current');
//                 const lastLetter = prevWord.lastElementChild;
//                 if (lastLetter) {
//                     addClass(lastLetter, 'current');
//                     removeClass(lastLetter, 'incorrect');
//                     removeClass(lastLetter, 'correct');
//                     moveCursor(lastLetter);
//                 }
//             }
//         }
//     }

//     if (currentWord) checkAndScroll(currentWord);
// });

// // Button to restart the game
// document.getElementById('newGameButton')?.addEventListener('click', () => {
//     gameOver();
//     newGame();
// });

// // Start game on load
// newGame();
