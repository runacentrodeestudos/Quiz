// Variáveis globais do jogo
let currentQuiz = null;
let currentQuestionIndex = 0;
let score = 0;
let timer = null;
let timeLeft = 30;
let playerName = 'Jogador 1';
let quizzes = [];
let ranking = [];

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    initializeShader();
    loadQuizzes();
    loadRanking();
    setupEventListeners();
    updateRankingDisplay();
});

// Configuração do shader Three.js
function initializeShader() {
    const container = document.getElementById('shader-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    
    renderer.setSize(400, 300);
    container.appendChild(renderer.domElement);

    const material = createPlasmaShaderMaterial();
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    function animate() {
        requestAnimationFrame(animate);
        updateShaderTime(material, performance.now());
        renderer.render(scene, camera);
    }
    animate();
}

// Configuração de eventos
function setupEventListeners() {
    // Menu mobile
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Navegação suave
    document.querySelectorAll('.nav-link, footer a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            showSection(targetId);
        });
    });
}

// Mostrar seção específica
function showSection(sectionId) {
    // Esconder todas as seções
    document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Mostrar a seção selecionada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    // Ações específicas por seção
    if (sectionId === 'jogar') {
        displayQuizzes();
    } else if (sectionId === 'ranking') {
        initializeRankingShader();
    }
}

// Carregar quizzes do arquivo JSON
async function loadQuizzes() {
    try {
        const response = await fetch('quizzes.json');
        if (response.ok) {
            quizzes = await response.json();
        } else {
            // Se o arquivo não existir, usar quizzes padrão
            quizzes = getDefaultQuizzes();
        }
    } catch (error) {
        console.log('Erro ao carregar quizzes.json, usando quizzes padrão:', error);
        quizzes = getDefaultQuizzes();
    }
}

// Função para obter quizzes padrão
function getDefaultQuizzes() {
    return [
        {
            id: 1,
            title: "Geografia Mundial",
            description: "Teste seus conhecimentos sobre o mundo",
            symbol: "🌍",
            difficulty: "media",
            questions: [
                {
                    question: "Qual é o maior país do mundo?",
                    correct: "Rússia",
                    wrong: ["Canadá", "China", "Estados Unidos"]
                },
                {
                    question: "Qual é a capital do Japão?",
                    correct: "Tóquio",
                    wrong: ["Pequim", "Seul", "Bangcoc"]
                },
                {
                    question: "Quantos continentes existem?",
                    correct: "7",
                    wrong: ["5", "6", "8"]
                }
            ]
        },
        {
            id: 2,
            title: "Ciências",
            description: "Desafie seu conhecimento científico",
            symbol: "🧪",
            difficulty: "alta",
            questions: [
                {
                    question: "Qual é o símbolo químico da água?",
                    correct: "H2O",
                    wrong: ["CO2", "O2", "NaCl"]
                },
                {
                    question: "Qual planeta é conhecido como Planeta Vermelho?",
                    correct: "Marte",
                    wrong: ["Vênus", "Júpiter", "Saturno"]
                }
            ]
        }
    ];
}

// Salvar quizzes - faz download do arquivo JSON
function saveQuizzes() {
    const dataStr = JSON.stringify(quizzes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'quizzes.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Importar quizzes de um arquivo
function importQuizzes(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedQuizzes = JSON.parse(e.target.result);
            if (Array.isArray(importedQuizzes)) {
                quizzes = importedQuizzes;
                displayQuizzes();
                showFeedback('Quizzes importados com sucesso!', 'success');
            } else {
                showFeedback('Formato de arquivo inválido!', 'error');
            }
        } catch (error) {
            showFeedback('Erro ao ler o arquivo!', 'error');
        }
    };
    reader.readAsText(file);
}

// Exibir quizzes disponíveis
function displayQuizzes() {
    const quizGrid = document.getElementById('quizGrid');
    if (!quizGrid) return;

    quizGrid.innerHTML = '';
    
    quizzes.forEach(quiz => {
        const quizCard = document.createElement('div');
        quizCard.className = 'course-card';
        quizCard.innerHTML = `
            <div class="course-icon">${quiz.symbol || '🎯'}</div>
            <button class="delete-btn" onclick="deleteQuiz(${quiz.id})" title="Excluir Quiz">×</button>
            <h3>${quiz.title}</h3>
            <p>${quiz.description}</p>
            <ul>
                <li>${quiz.questions.length} perguntas</li>
                <li>Dificuldade: ${quiz.difficulty ? quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1) : 'Média'}</li>
                <li>Tempo: 30 segundos por pergunta</li>
            </ul>
            <button class="cta-button" onclick="startQuiz(${quiz.id})">Jogar</button>
        `;
        quizGrid.appendChild(quizCard);
    });
}

// Iniciar um quiz específico
function startQuiz(quizId) {
    currentQuiz = quizzes.find(q => q.id === quizId);
    if (!currentQuiz) return;

    currentQuestionIndex = 0;
    score = 0;
    
    // Pedir nome do jogador
    const nameInput = prompt('Digite seu nome:');
    if (nameInput) {
        playerName = nameInput;
    }

    showSection('gameArea');
    displayQuestion();
}

// Exibir pergunta atual
function displayQuestion() {
    if (!currentQuiz || currentQuestionIndex >= currentQuiz.questions.length) {
        endGame();
        return;
    }

    const question = currentQuiz.questions[currentQuestionIndex];
    const questionTitle = document.getElementById('questionTitle');
    const answersContainer = document.getElementById('answersContainer');
    const currentScoreElement = document.getElementById('currentScore');
    const playerNameElement = document.getElementById('playerName');

    questionTitle.textContent = `Pergunta ${currentQuestionIndex + 1}: ${question.question}`;
    playerNameElement.textContent = playerName;
    currentScoreElement.textContent = score;

    // Criar array com todas as respostas
    const allAnswers = [question.correct, ...question.wrong];
    // Embaralhar respostas
    allAnswers.sort(() => Math.random() - 0.5);

    // Limpar container de respostas
    answersContainer.innerHTML = '';

    // Criar botões de resposta
    allAnswers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.className = 'answer-button';
        button.textContent = `${String.fromCharCode(65 + index)}. ${answer}`;
        button.onclick = () => selectAnswer(answer, question.correct);
        answersContainer.appendChild(button);
    });

    // Iniciar timer
    startTimer();
}

// Selecionar resposta
function selectAnswer(selectedAnswer, correctAnswer) {
    clearInterval(timer);
    
    const buttons = document.querySelectorAll('.answer-button');
    buttons.forEach(button => {
        button.disabled = true;
        if (button.textContent.includes(correctAnswer)) {
            button.style.backgroundColor = '#4CAF50';
            button.style.color = 'white';
        } else if (button.textContent.includes(selectedAnswer) && selectedAnswer !== correctAnswer) {
            button.style.backgroundColor = '#f44336';
            button.style.color = 'white';
        }
    });

    if (selectedAnswer === correctAnswer) {
        score += Math.max(10, timeLeft); // Pontos baseados no tempo restante
        showFeedback('✅ Correto!', 'success');
    } else {
        showFeedback('❌ Incorreto!', 'error');
    }

    setTimeout(() => {
        currentQuestionIndex++;
        displayQuestion();
    }, 2000);
}

// Iniciar timer
function startTimer() {
    timeLeft = 30;
    const timerElement = document.getElementById('timer');
    
    timer = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        
        if (timeLeft <= 10) {
            timerElement.style.color = '#f44336';
        } else {
            timerElement.style.color = '#333';
        }
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            selectAnswer('', ''); // Tempo esgotado
        }
    }, 1000);
}

// Mostrar feedback
function showFeedback(message, type) {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 20px 40px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 10px;
        font-size: 24px;
        z-index: 10000;
        animation: fadeInUp 0.5s ease;
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.remove();
    }, 1500);
}

// Finalizar jogo
function endGame() {
    clearInterval(timer);
    
    // Adicionar ao ranking
    addToRanking(playerName, score);
    
    // Mostrar resultado final
    const feedback = document.createElement('div');
    feedback.className = 'game-over';
    feedback.innerHTML = `
        <h2>🎉 Jogo Finalizado!</h2>
        <p>${playerName}, sua pontuação final foi: <strong>${score}</strong></p>
        <button class="cta-button" onclick="showSection('ranking')">Ver Ranking</button>
        <button class="cta-button" onclick="showSection('jogar')">Jogar Novamente</button>
    `;
    feedback.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 40px;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        text-align: center;
        z-index: 10000;
        animation: fadeInUp 0.5s ease;
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.remove();
    }, 10000);
}

// Carregar ranking do arquivo JSON
async function loadRanking() {
    try {
        const response = await fetch('ranking.json');
        if (response.ok) {
            ranking = await response.json();
        } else {
            // Se o arquivo não existir, começar com ranking vazio
            ranking = [];
        }
    } catch (error) {
        console.log('Erro ao carregar ranking.json, começando com ranking vazio:', error);
        ranking = [];
    }
}

// Salvar ranking - faz download do arquivo JSON
function saveRanking() {
    const dataStr = JSON.stringify(ranking, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'ranking.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Importar ranking de um arquivo
function importRanking(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedRanking = JSON.parse(e.target.result);
            if (Array.isArray(importedRanking)) {
                ranking = importedRanking;
                updateRankingDisplay();
                showFeedback('Ranking importado com sucesso!', 'success');
            } else {
                showFeedback('Formato de arquivo inválido!', 'error');
            }
        } catch (error) {
            showFeedback('Erro ao ler o arquivo!', 'error');
        }
    };
    reader.readAsText(file);
}

// Adicionar ao ranking
function addToRanking(name, finalScore) {
    ranking.push({
        name: name,
        score: finalScore,
        date: new Date().toLocaleDateString('pt-BR')
    });
    
    // Ordenar por pontuação (maior para menor)
    ranking.sort((a, b) => b.score - a.score);
    
    // Manter apenas os top 10
    ranking = ranking.slice(0, 10);
    
    updateRankingDisplay();
}

// Atualizar exibição do ranking
function updateRankingDisplay() {
    const rankingList = document.getElementById('rankingList');
    if (!rankingList) return;

    if (ranking.length === 0) {
        rankingList.innerHTML = '<p>Nenhuma pontuação registrada ainda.</p>';
        return;
    }

    rankingList.innerHTML = ranking.map((player, index) => `
        <div class="ranking-item" style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            background: ${index < 3 ? '#f0f0f0' : 'white'};
            border-radius: 5px;
            border-left: 4px solid ${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#333'};
            position: relative;
        ">
            <span>${index + 1}. ${player.name}</span>
            <span><strong>${player.score}</strong> pts</span>
            <button class="delete-btn" onclick="deleteRankingItem(${index})" title="Excluir do Ranking">×</button>
        </div>
    `).join('');
}

// Inicializar shader do ranking
function initializeRankingShader() {
    const container = document.getElementById('rankingShader');
    if (!container || container.children.length > 0) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    
    renderer.setSize(window.innerWidth, 200);
    container.appendChild(renderer.domElement);

    const material = createPlasmaShaderMaterial();
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    function animate() {
        requestAnimationFrame(animate);
        updateShaderTime(material, performance.now());
        renderer.render(scene, camera);
    }
    animate();
}

// Adicionar pergunta ao formulário de criação
function addQuestion() {
    const container = document.getElementById('questionsContainer');
    const questionCount = container.children.length + 1;
    
    const questionItem = document.createElement('div');
    questionItem.className = 'question-item';
    questionItem.innerHTML = `
        <div class="form-group">
            <input type="text" class="question-text" placeholder="Pergunta ${questionCount}">
        </div>
        <div class="form-group">
            <input type="text" class="answer-correct" placeholder="Resposta Correta">
        </div>
        <div class="form-group">
            <input type="text" class="answer-wrong" placeholder="Resposta Incorreta 1">
        </div>
        <div class="form-group">
            <input type="text" class="answer-wrong" placeholder="Resposta Incorreta 2">
        </div>
        <div class="form-group">
            <input type="text" class="answer-wrong" placeholder="Resposta Incorreta 3">
        </div>
        <button class="submit-btn" onclick="this.parentElement.remove()" style="background: #f44336; margin-top: 10px;">Remover Pergunta</button>
    `;
    
    container.appendChild(questionItem);
}

// Salvar quiz criado
function saveQuiz() {
    const title = document.getElementById('quizTitle').value;
    const description = document.getElementById('quizDescription').value;
    const symbol = document.getElementById('quizSymbol').value;
    const difficulty = document.getElementById('quizDifficulty').value;
    const questionItems = document.querySelectorAll('.question-item');
    
    if (!title || questionItems.length === 0) {
        alert('Por favor, preencha o título e adicione pelo menos uma pergunta.');
        return;
    }
    
    const questions = [];
    let validQuiz = true;
    
    questionItems.forEach(item => {
        const questionText = item.querySelector('.question-text').value;
        const correctAnswer = item.querySelector('.answer-correct').value;
        const wrongAnswers = Array.from(item.querySelectorAll('.answer-wrong')).map(input => input.value);
        
        if (!questionText || !correctAnswer || wrongAnswers.some(w => !w)) {
            validQuiz = false;
            return;
        }
        
        questions.push({
            question: questionText,
            correct: correctAnswer,
            wrong: wrongAnswers
        });
    });
    
    if (!validQuiz) {
        alert('Por favor, preencha todos os campos das perguntas.');
        return;
    }
    
    const newQuiz = {
        id: quizzes.length + 1,
        title: title,
        description: description || 'Quiz criado pelo usuário',
        symbol: symbol,
        difficulty: difficulty,
        questions: questions
    };
    
    quizzes.push(newQuiz);
    saveQuizzes();
    
    alert('Quiz criado com sucesso!');
    
    // Limpar formulário
    document.getElementById('quizTitle').value = '';
    document.getElementById('quizDescription').value = '';
    document.getElementById('quizSymbol').value = '🎯';
    document.getElementById('quizDifficulty').value = 'media';
    document.getElementById('questionsContainer').innerHTML = `
        <div class="question-item">
            <div class="form-group">
                <input type="text" class="question-text" placeholder="Pergunta 1">
            </div>
            <div class="form-group">
                <input type="text" class="answer-correct" placeholder="Resposta Correta">
            </div>
            <div class="form-group">
                <input type="text" class="answer-wrong" placeholder="Resposta Incorreta 1">
            </div>
            <div class="form-group">
                <input type="text" class="answer-wrong" placeholder="Resposta Incorreta 2">
            </div>
            <div class="form-group">
                <input type="text" class="answer-wrong" placeholder="Resposta Incorreta 3">
            </div>
        </div>
    `;
    
    showSection('jogar');
}

// Função para começar o jogo da página inicial
function startGame() {
    showSection('jogar');
}

// Função para excluir quiz
function deleteQuiz(quizId) {
    const password = prompt('Password:');
    
    if (password === 'eevee') {
        const quizIndex = quizzes.findIndex(q => q.id === quizId);
        if (quizIndex !== -1) {
            const quizTitle = quizzes[quizIndex].title;
            quizzes.splice(quizIndex, 1);
            saveQuizzes();
            displayQuizzes();
            showFeedback(`Quiz "${quizTitle}" excluído com sucesso!`, 'success');
        }
    } else if (password !== null) {
        showFeedback('Senha incorreta!', 'error');
    }
}

// Função para excluir item do ranking
function deleteRankingItem(index) {
    const password = prompt('Password:');
    
    if (password === 'eevee') {
        const playerName = ranking[index].name;
        const playerScore = ranking[index].score;
        ranking.splice(index, 1);
        updateRankingDisplay();
        showFeedback(`Jogador "${playerName}" (${playerScore} pts) excluído do ranking!`, 'success');
    } else if (password !== null) {
        showFeedback('Senha incorreta!', 'error');
    }
}
