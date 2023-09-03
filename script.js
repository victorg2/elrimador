let rhymeLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
let currentRhymeIndex = 0;

const compositions = [
    { name: "Soneto", verses: 14, rhymeScheme: "11A|11B|11A|11B|11C|11D|11C|11D|11E|11E|11F|11F" },
    { name: "Décima", verses: 10, rhymeScheme: "8a|8b|8b|8a|8a|8c|8c|8d|8d|8c" },
    { name: "Lira", verses: 5, rhymeScheme: "7a|11B|7a|7b|11B" },
    { name: "Cuarteto", verses: 4, rhymeScheme: "11A|11B|11B|11A" },
    { name: "Redondilla", verses: 4, rhymeScheme: "8a|8b|8b|8a" },
    { name: "Terceto", verses: 3, rhymeScheme: "11A|11X|11A" },
    { name: "Haiku", verses: 3, rhymeScheme: "5-|7-|5-" },
    { name: "Cuaderna vía", verses: 4, rhymeScheme: "14A|14A|14A|14A" },
    { name: "Octava real", verses: 8, rhymeScheme: "11A|11B|11A|11B|11C|11D|11C|11D" },
    { name: "Romance", verses: "X", rhymeScheme: "8a|8a|8a|..." },
    { name: "Soleá", verses: 3, rhymeScheme: "8a|8a|8a" }
];

function countSinalefas(line) {
    const sinalefaSimpleRegex = /([aeiouáéíóú])\s+([aeiouáéíóú])/gi;
    const sinalefaTripleRegex = /([aeiouáéíóú])\s+([h]?[aeiouáéíóú])\s+([aeiouáéíóú])/gi;
    
    let match;
    let count = 0;
    
    while ((match = sinalefaSimpleRegex.exec(line)) !== null) {
        count++;
    }
    
    while ((match = sinalefaTripleRegex.exec(line)) !== null) {
        count += 2;
    }

    return count;
}

function isConsonantRhyme(ending1, ending2) {
    return ending1 === ending2;
}

function isAsonantRhyme(ending1, ending2) {
    const vowels = 'aeiouáéíóú';
    const getVowels = str => str.split('').filter(char => vowels.includes(char)).join('');
    return getVowels(ending1) === getVowels(ending2);
}

function getEnding(word) {
    const syllables = divide(word);
    const stressPosition = stress(syllables);
    const vowels = 'aeiouáéíóú';

    if (stressPosition === -1) {
        return syllables.slice(-2).join(''); // Si no hay sílaba acentuada, considera las últimas dos sílabas
    }

    // Encuentra la primera vocal en la sílaba acentuada
    for (let i = 0; i < syllables[stressPosition].length; i++) {
        if (vowels.includes(syllables[stressPosition][i])) {
            // Devuelve desde la vocal encontrada hasta el final de la palabra
            return syllables.slice(stressPosition).join('').substring(i);
        }
    }

    // En caso de que no se encuentre una vocal (lo cual es improbable), devuelve las últimas dos sílabas
    return syllables.slice(-2).join('');
}

function processLine(line) {
    const words = line.trim().split(/\s+/);
    let coloredLine = '';
    let colorSwitch = true;
    let syllableCount = 0;

    words.forEach((word, wordIndex) => {
        const syllables = divide(word);
        const stressPosition = stress(syllables);

        syllables.forEach((syllable, syllableIndex) => {
            let colorClass = colorSwitch ? '1' : '2';
            if (word === words[words.length - 1] && wordIndex === words.length - 1) { // Verifica si es la última palabra
                if (stressPosition === syllables.length - 1) {
                    coloredLine += `<span class="last-word-aguda-${colorClass}">${syllable}</span>`;
                } else if (stressPosition === syllables.length - 2) {
                    coloredLine += `<span class="last-word-llana-${colorClass}">${syllable}</span>`;
                } else {
                    coloredLine += `<span class="last-word-esdrujula-${colorClass}">${syllable}</span>`;
                }
            } else {
                coloredLine += `<span class="syllable-${colorClass}">${syllable}</span>`;
            }
            colorSwitch = !colorSwitch;
        });

        // Ajusta el conteo de sílabas después de procesar todas las sílabas de la palabra
        if (word === words[words.length - 1] && wordIndex === words.length - 1) {
            if (stressPosition === syllables.length - 1) {
                syllableCount += 1; // Ajusta el conteo de sílabas solo si es la última palabra y es aguda
            } else if (stressPosition <= syllables.length - 3) {
                syllableCount -= 1; // Ajusta el conteo de sílabas solo si es la última palabra y es esdrújula
            }
        }

        syllableCount += syllables.length;
        coloredLine += ' ';
    });

    const sinalefaCount = countSinalefas(line);
    syllableCount -= sinalefaCount;
	
    const lastWord = words[words.length - 1];

    return {
        coloredLine,
        syllableCount
    };
}

function determineAllRhymes(lines) {
    const endings = lines.map(line => ({
        ending: getEnding(line.split(/\s+/).pop()),
        letter: '-',
        syllableCount: 0,
        rhymeType: '' // 'consonant-rhyme' o 'asonant-rhyme'
    }));

    for (let i = 0; i < lines.length; i++) {
        let foundRhyme = false;

        // Procesa la línea una vez aquí
        const { coloredLine, syllableCount } = processLine(lines[i]);
        endings[i].coloredLine = coloredLine;
        endings[i].syllableCount = syllableCount;

        for (let j = 0; j < i; j++) {
            if (isConsonantRhyme(endings[i].ending, endings[j].ending) || isAsonantRhyme(endings[i].ending, endings[j].ending)) {
                const rhymeType = isConsonantRhyme(endings[i].ending, endings[j].ending) ? 'consonant-rhyme' : 'asonant-rhyme';
                const newRhymeLetter = endings[j].letter === '-' ? rhymeLetters[currentRhymeIndex++] : endings[j].letter;

                endings[i].rhymeType = rhymeType;
                endings[j].rhymeType = rhymeType;

                // Convertir a minúsculas si es arte menor
                if (syllableCount <= 8) {
                    endings[i].letter = newRhymeLetter.toLowerCase();
                } else {
                    endings[i].letter = newRhymeLetter.toUpperCase();
                }

                // Asegurarse de que la letra de rima del verso anterior esté en el formato correcto
                if (endings[j].syllableCount <= 8) {
                    endings[j].letter = newRhymeLetter.toLowerCase();
                } else {
                    endings[j].letter = newRhymeLetter.toUpperCase();
                }

                foundRhyme = true;
                break;
            }
        }

        // Si no se encontró rima y el verso no es el primero, se marca como libre
        if (!foundRhyme && i !== 0 && endings[i].letter === '-') {
            endings[i].letter = '-';
        } else if (!foundRhyme) { // Si es el primer verso y no tiene rima, se le asigna una nueva letra
            const newRhymeLetter = rhymeLetters[currentRhymeIndex++];
            if (syllableCount <= 8) {
                endings[i].letter = newRhymeLetter.toLowerCase();
            } else {
                endings[i].letter = newRhymeLetter.toUpperCase();
            }
        }
    }

    return endings;
}

function updateColoredTextOutput(lines, rhymes) {
    const coloredTextOutput = document.getElementById('coloredTextOutput');
    coloredTextOutput.innerHTML = '';

    lines.forEach((line, index) => {
		const syllableCount = rhymes[index].syllableCount;

        // Crear contenedor para la línea
        const lineContainer = document.createElement('div');
        lineContainer.className = 'line-container';

        // Crear contenedor para la información de sílabas/rima
        const lineInfo = document.createElement('div');
        lineInfo.className = 'line-info';
        lineInfo.innerHTML = `[${syllableCount}<span class="${rhymes[index].rhymeType}">${rhymes[index].letter}</span>]`;
        lineContainer.appendChild(lineInfo);
		
		        // Crear contenedor para el texto
        const lineText = document.createElement('div');
        lineText.className = 'line-text';
        lineText.innerHTML = rhymes[index].coloredLine;
        lineContainer.appendChild(lineText);

        coloredTextOutput.appendChild(lineContainer);
    });
}


function determineComposition(lines, rhymes) {
    const rhymeString = rhymes.map(r => r.syllableCount + r.letter).join('|');
    const matchingComposition = compositions.find(comp => {
        if (comp.verses === 'X') {
            return rhymeString.startsWith(comp.rhymeScheme);
        }
        return rhymeString === comp.rhymeScheme;
    });
    return matchingComposition ? matchingComposition.name : "Desconocido";
}

/*function analyzeText() {
    const text = document.getElementById('textInput').innerText;
    const lines = text.split('\n').filter(line => line.trim() !== ''); // Filtrar líneas vacías

    // Reset the rhyme index
    currentRhymeIndex = 0;

    const rhymes = determineAllRhymes(lines);

    updateColoredTextOutput(lines, rhymes);
}*/

function analyzeText() {
    const text = document.getElementById('textInput').innerText;
    const lines = text.split('\n').filter(line => line.trim() !== ''); // Filtrar líneas vacías

    // Reset the rhyme index
    currentRhymeIndex = 0;

    const rhymes = determineAllRhymes(lines);
    updateColoredTextOutput(lines, rhymes);

    const compositionName = determineComposition(lines, rhymes);
    // Aquí puedes mostrar el nombre de la composición en algún lugar del DOM
    console.log(`Composición: ${compositionName}`);
}

document.addEventListener("DOMContentLoaded", function() {
    analyzeText();
});

document.addEventListener("DOMContentLoaded", function() {
    const textInput = document.getElementById('textInput');
    const coloredTextOutput = document.getElementById('coloredTextOutput');

    let isSyncingTextInputScroll = false;
    let isSyncingColoredTextOutputScroll = false;

    textInput.addEventListener('scroll', function() {
        if (!isSyncingColoredTextOutputScroll) {
            isSyncingTextInputScroll = true;
            coloredTextOutput.scrollTop = textInput.scrollTop;
        }
        isSyncingTextInputScroll = false;
    });

    coloredTextOutput.addEventListener('scroll', function() {
        if (!isSyncingTextInputScroll) {
            isSyncingColoredTextOutputScroll = true;
            textInput.scrollTop = coloredTextOutput.scrollTop;
        }
        isSyncingColoredTextOutputScroll = false;
    });
});
