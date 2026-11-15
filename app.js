// ===== الحالة =====
let state = {
  known: JSON.parse(localStorage.getItem('known') || '[]'),
  mistakes: JSON.parse(localStorage.getItem('mistakes') || '[]'),
  reviewQueue: [],
  reviewIndex: 0,
  currentWord: null,
  mcqQueue: [],
  mcqIndex: 0,
  writeQueue: [],
  writeIndex: 0,
  mistakesMode: false
};

// ===== الحفظ =====
function saveState() {
  localStorage.setItem('known', JSON.stringify(state.known));
  localStorage.setItem('mistakes', JSON.stringify(state.mistakes));
}

// ===== التنقل بين الشاشات =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function goHome() {
  updateStats();
  showScreen('homeScreen');
}

// ===== الإحصاءات =====
function updateStats() {
  const known = state.known.length;
  const mistakes = state.mistakes.length;
  const remaining = WORDS_DATA.length - known;
  
  document.getElementById('statKnown').textContent = known;
  document.getElementById('statMistakes').textContent = mistakes;
  document.getElementById('statRemaining').textContent = remaining;
  
  const pct = (known / WORDS_DATA.length) * 100;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressText').textContent = known + ' من ' + WORDS_DATA.length;
}

// ===== المراجعة =====
function startReview() {
  state.mistakesMode = false;
  // الكلمات غير المعروفة فقط
  state.reviewQueue = WORDS_DATA.filter(w => !state.known.includes(w.id));
  if (state.reviewQueue.length === 0) {
    alert('أنهيتِ مراجعة جميع الكلمات! ما شاء الله.');
    return;
  }
  state.reviewIndex = 0;
  showReviewCard();
}

function startMistakesReview() {
  if (state.mistakes.length === 0) {
    alert('لا توجد أخطاء مسجلة. أحسنتِ!');
    return;
  }
  state.mistakesMode = true;
  state.reviewQueue = WORDS_DATA.filter(w => state.mistakes.includes(w.id));
  state.reviewIndex = 0;
  showReviewCard();
}

function showReviewCard() {
  if (state.reviewIndex >= state.reviewQueue.length) {
    alert('أنهيتِ هذه الجولة! ما شاء الله.');
    goHome();
    return;
  }
  state.currentWord = state.reviewQueue[state.reviewIndex];
  document.getElementById('reviewWord').textContent = state.currentWord.word;
  document.getElementById('reviewMeaning').textContent = state.currentWord.meaning;
  document.getElementById('reviewMeaning').classList.add('hidden');
  document.getElementById('showMeaningBtn').classList.remove('hidden');
  document.getElementById('knowBtn').classList.add('hidden');
  document.getElementById('dontKnowBtn').classList.add('hidden');
  showScreen('reviewScreen');
}

function showMeaning() {
  document.getElementById('reviewMeaning').classList.remove('hidden');
  document.getElementById('showMeaningBtn').classList.add('hidden');
  document.getElementById('knowBtn').classList.remove('hidden');
  document.getElementById('dontKnowBtn').classList.remove('hidden');
}

function markKnown() {
  if (!state.known.includes(state.currentWord.id)) {
    state.known.push(state.currentWord.id);
  }
  // إزالة من الأخطاء إن كانت
  state.mistakes = state.mistakes.filter(id => id !== state.currentWord.id);
  saveState();
  state.reviewIndex++;
  showReviewCard();
}

function markUnknown() {
  if (!state.mistakes.includes(state.currentWord.id)) {
    state.mistakes.push(state.currentWord.id);
  }
  saveState();
  state.reviewIndex++;
  showReviewCard();
}

// ===== الاختيار من متعدد =====
function startQuiz(type) {
  state.mistakesMode = false;
  // خلط الكلمات
  const shuffled = [...WORDS_DATA].sort(() => Math.random() - 0.5);
  state.quizType = type;
  
  if (type === 'mcq') {
    state.mcqQueue = shuffled.slice(0, 20); // 20 سؤالاً
    state.mcqIndex = 0;
    showMcq();
  } else {
    state.writeQueue = shuffled.slice(0, 15); // 15 سؤالاً
    state.writeIndex = 0;
    showWrite();
  }
}

function showMcq() {
  if (state.mcqIndex >= state.mcqQueue.length) {
    alert('أنهيتِ الاختبار!');
    goHome();
    return;
  }
  const word = state.mcqQueue[state.mcqIndex];
  document.getElementById('mcqWord').textContent = word.word;
  
  // 3 إجابات خاطئة عشوائية
  const wrongOptions = WORDS_DATA
    .filter(w => w.id !== word.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(w => w.meaning);
  
  const options = [word.meaning, ...wrongOptions].sort(() => Math.random() - 0.5);
  
  const optionsDiv = document.getElementById('mcqOptions');
  optionsDiv.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.textContent = opt;
    btn.onclick = () => checkMcq(opt, word);
    optionsDiv.appendChild(btn);
  });
  
  document.getElementById('mcqFeedback').classList.add('hidden');
  document.getElementById('mcqNextBtn').classList.add('hidden');
  showScreen('mcqScreen');
}

function checkMcq(selected, word) {
  const buttons = document.querySelectorAll('#mcqOptions .option');
  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === word.meaning) {
      btn.classList.add('correct');
    } else if (btn.textContent === selected) {
      btn.classList.add('wrong');
    }
  });
  
  const feedback = document.getElementById('mcqFeedback');
  if (selected === word.meaning) {
    feedback.textContent = '✓ إجابة صحيحة';
    feedback.className = 'feedback correct';
    if (!state.known.includes(word.id)) state.known.push(word.id);
    state.mistakes = state.mistakes.filter(id => id !== word.id);
  } else {
    feedback.textContent = '✗ الإجابة الصحيحة: ' + word.meaning;
    feedback.className = 'feedback wrong';
    if (!state.mistakes.includes(word.id)) state.mistakes.push(word.id);
  }
  saveState();
  feedback.classList.remove('hidden');
  document.getElementById('mcqNextBtn').classList.remove('hidden');
}

function nextMcq() {
  state.mcqIndex++;
  showMcq();
}

// ===== الكتابة =====
function showWrite() {
  if (state.writeIndex >= state.writeQueue.length) {
    alert('أنهيتِ الاختبار!');
    goHome();
    return;
  }
  state.currentWord = state.writeQueue[state.writeIndex];
  document.getElementById('writeWord').textContent = state.currentWord.word;
  document.getElementById('writeInput').value = '';
  document.getElementById('writeFeedback').classList.add('hidden');
  document.getElementById('writeNextBtn').classList.add('hidden');
  showScreen('writeScreen');
}

function checkWrite() {
  const input = document.getElementById('writeInput').value.trim();
  if (!input) {
    alert('اكتبي إجابة أولاً');
    return;
  }
  
  const word = state.currentWord;
  const feedback = document.getElementById('writeFeedback');
  
  // مقارنة بسيطة: تطابق كامل أو نسبة تشابه عالية
  const normalize = (s) => s.replace(/[أإآا]/g, 'ا').replace(/[ةه]/g, 'ه').replace(/\s+/g, ' ').trim();
  const isCorrect = normalize(input) === normalize(word.meaning);
  
  if (isCorrect) {
    feedback.textContent = '✓ إجابة صحيحة';
    feedback.className = 'feedback correct';
    if (!state.known.includes(word.id)) state.known.push(word.id);
    state.mistakes = state.mistakes.filter(id => id !== word.id);
  } else {
    feedback.textContent = '✗ الإجابة الصحيحة:\n' + word.meaning;
    feedback.className = 'feedback wrong';
    if (!state.mistakes.includes(word.id)) state.mistakes.push(word.id);
  }
  saveState();
  feedback.classList.remove('hidden');
  document.getElementById('writeNextBtn').classList.remove('hidden');
}

function nextWrite() {
  state.writeIndex++;
  showWrite();
}

// ===== التهيئة =====
updateStats();
