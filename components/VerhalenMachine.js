import React, { useState } from 'react';
import { Sparkles, BookOpen, Loader2, Star, Wand2 } from 'lucide-react';

const VerhalenMachine = () => {
  const [input, setInput] = useState('');
  const [story, setStory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState('');

  const callClaude = async (prompt) => {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error('Failed to call Claude API');
    }

    const data = await response.json();
    return data.response;
  };

  const generateStory = async () => {
    if (!input.trim()) return;
    
    setIsGenerating(true);
    setStory('');
    setCurrentStep('Het verhaal plannen...');
    
    try {
      // Step 1: Plan the story
      const planPrompt = `Je gaat een ontstaan verhaal vertellen over "${input}" voor kinderen van 6-10 jaar in het Nederlands. 

Maak een plan voor een verhaal in 3 delen:
1. Het begin/oorsprong 
2. De ontwikkeling/verandering
3. Hoe het nu is

Geef alleen een korte samenvatting van elk deel (1-2 zinnen per deel). Reageer alleen met geldige JSON:

{
  "deel1": "korte beschrijving van deel 1",
  "deel2": "korte beschrijving van deel 2", 
  "deel3": "korte beschrijving van deel 3"
}

BELANGRIJK: Geef ALLEEN JSON terug, geen andere tekst.`;

      const planResponse = await callClaude(planPrompt);
      const plan = JSON.parse(planResponse);
      
      // Step 2: Generate each part
      const parts = [];
      
      for (let i = 1; i <= 3; i++) {
        setCurrentStep(`Deel ${i} schrijven...`);
        
        const partPrompt = `Schrijf deel ${i} van een verhaal over het ontstaan van "${input}" voor kinderen van 6-10 jaar in het Nederlands.

Plan voor dit deel: ${plan[`deel${i}`]}

${i === 1 ? 'Begin met "Lang, lang geleden..." of iets soortgelijks.' : ''}
${i > 1 ? `Vorig deel eindigde met: "${parts[i-2].slice(-50)}..."` : ''}

Schrijf een leuk, kort verhaal van ongeveer 70-90 woorden. Maak het spannend en begrijpelijk voor kinderen. Gebruik emoji's om het extra leuk te maken.

Geef alleen het verhaal terug, geen andere tekst.`;

        const partResponse = await callClaude(partPrompt);
        parts.push(partResponse);
      }
      
      setStory(parts.join('\n\n'));
      setCurrentStep('Klaar! 🎉');
      
    } catch (error) {
      console.error('Error generating story:', error);
      setStory('Oeps! Er ging iets mis bij het maken van het verhaal. Probeer het nog een keer! 😊');
    } finally {
      setIsGenerating(false);
      setCurrentStep('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      generateStory();
    }
  };

  const exampleWords = ['pizza', 'fiets', 'chocolade', 'boek', 'muziek', 'regenboog', 'voetbal', 'ijs'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Wand2 className="text-yellow-300" size={48} />
            <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
              Verhalen Machine
            </h1>
            <Sparkles className="text-yellow-300" size={48} />
          </div>
          <p className="text-xl text-white drop-shadow-md">
            Ontdek het magische ontstaan verhaal van alles wat je wilt weten! ✨
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <div className="flex justify-center mb-6">
            <BookOpen className="text-purple-500" size={48} />
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Waar ben je nieuwsgierig naar?
            </h2>
            <p className="text-gray-600">
              Type een woord en ontdek het verhaal van hoe het ontstond!
            </p>
          </div>

          <div className="flex gap-4 max-w-md mx-auto mb-6">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Bijvoorbeeld: pizza, fiets, chocolade..."
              className="flex-1 px-4 py-3 text-lg border-2 border-purple-300 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
              disabled={isGenerating}
            />
            <button
              onClick={generateStory}
              disabled={isGenerating || !input.trim()}
              className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold text-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Maken...
                </>
              ) : (
                <>
                  <Star size={20} />
                  Vertel!
                </>
              )}
            </button>
          </div>

          {/* Example words */}
          <div className="text-center">
            <p className="text-gray-500 mb-3">Of kies een van deze voorbeelden:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {exampleWords.map((word) => (
                <button
                  key={word}
                  onClick={() => setInput(word)}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors text-sm font-medium"
                  disabled={isGenerating}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Section */}
        {isGenerating && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Loader2 className="animate-spin text-purple-500" size={48} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Magische verhalen maken...
              </h3>
              <p className="text-purple-600 font-medium">
                {currentStep}
              </p>
              <div className="mt-4 bg-purple-100 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
              </div>
            </div>
          </div>
        )}

        {/* Story Display */}
        {story && !isGenerating && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Het verhaal van {input}! 📖
              </h3>
              <div className="flex justify-center">
                <Sparkles className="text-yellow-500" size={32} />
              </div>
            </div>
            
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-800 leading-relaxed space-y-4">
                {story.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-lg">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
            
            <div className="text-center mt-8">
              <button
                onClick={() => {
                  setStory('');
                  setInput('');
                }}
                className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 transition-colors"
              >
                Nog een verhaal maken! 🎉
              </button>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="text-center mt-12 text-white">
          <p className="text-sm opacity-75">
            Gemaakt met ❤️ voor nieuwsgierige kinderen
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerhalenMachine;