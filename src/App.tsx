import { useState, useEffect } from 'react';
import { Delete, History, RotateCcw } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [current, setCurrent] = useState('0');
  const [previous, setPrevious] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleNumber = (num: string) => {
    if (current === '0' && num !== '.') {
      setCurrent(num);
    } else if (current.includes('.') && num === '.') {
      return;
    } else {
      setCurrent((prev) => prev + num);
    }
  };

  const handleOperator = (op: string) => {
    if (previous === null) {
      setPrevious(current);
      setCurrent('0');
      setOperation(op);
    } else {
      calculate();
      setOperation(op);
    }
  };

  const calculate = () => {
    if (!previous || !operation) return;
    const prev = parseFloat(previous);
    const curr = parseFloat(current);
    let result = 0;

    switch (operation) {
      case '+': result = prev + curr; break;
      case '-': result = prev - curr; break;
      case '×': result = prev * curr; break;
      case '÷': result = prev / curr; break;
      case '%': result = prev % curr; break;
    }

    // Format to avoid long decimals
    const formattedResult = parseFloat(result.toFixed(8)).toString();
    
    setHistory((prev) => [
      `${previous} ${operation} ${current} = ${formattedResult}`,
      ...prev.slice(0, 9)
    ]);
    
    setPrevious(null);
    setOperation(null);
    setCurrent(formattedResult);
  };

  const clear = () => {
    setCurrent('0');
    setPrevious(null);
    setOperation(null);
  };

  const deleteLast = () => {
    if (current.length === 1) {
      setCurrent('0');
    } else {
      setCurrent((prev) => prev.slice(0, -1));
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (/^[0-9]$/.test(e.key)) handleNumber(e.key);
    if (e.key === '.') handleNumber('.');
    if (e.key === '+') handleOperator('+');
    if (e.key === '-') handleOperator('-');
    if (e.key === '*') handleOperator('×');
    if (e.key === '/') handleOperator('÷');
    if (e.key === 'Enter' || e.key === '=') calculate();
    if (e.key === 'Backspace') deleteLast();
    if (e.key === 'Escape') clear();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const Button = ({ 
    text, 
    onClick, 
    variant = 'default', 
    className 
  }: { 
    text: React.ReactNode, 
    onClick: () => void, 
    variant?: 'default' | 'operator' | 'action' | 'equal',
    className?: string
  }) => {
    const variants = {
      default: 'bg-white hover:bg-gray-50 text-gray-900',
      operator: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold',
      action: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
      equal: 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold'
    };

    return (
      <button
        onClick={onClick}
        className={cn(
          "h-16 w-16 md:h-20 md:w-20 rounded-2xl text-xl transition-all active:scale-95 flex items-center justify-center shadow-sm",
          variants[variant],
          className
        )}
      >
        {text}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-[400px] relative overflow-hidden">
        
        {/* Display */}
        <div className="bg-gray-50 p-6 rounded-2xl mb-6 text-right shadow-inner-lg min-h-[120px] flex flex-col justify-end">
           <div className="text-gray-500 text-sm h-6 font-medium">
            {previous} {operation}
          </div>
          <div className="text-4xl md:text-5xl font-bold text-gray-900 break-all">
            {current}
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex justify-between mb-4 px-2">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="text-gray-500 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-indigo-50"
          >
            <History size={20} />
          </button>
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wider py-2">Standard</div>
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-4 gap-3 place-items-center">
          <Button text="C" onClick={clear} variant="action" className="text-red-500 font-medium" />
          <Button text="%" onClick={() => handleOperator('%')} variant="action" />
          <Button text={<Delete size={24} />} onClick={deleteLast} variant="action" />
          <Button text="÷" onClick={() => handleOperator('÷')} variant="operator" />

          <Button text="7" onClick={() => handleNumber('7')} />
          <Button text="8" onClick={() => handleNumber('8')} />
          <Button text="9" onClick={() => handleNumber('9')} />
          <Button text="×" onClick={() => handleOperator('×')} variant="operator" />

          <Button text="4" onClick={() => handleNumber('4')} />
          <Button text="5" onClick={() => handleNumber('5')} />
          <Button text="6" onClick={() => handleNumber('6')} />
          <Button text="-" onClick={() => handleOperator('-')} variant="operator" />

          <Button text="1" onClick={() => handleNumber('1')} />
          <Button text="2" onClick={() => handleNumber('2')} />
          <Button text="3" onClick={() => handleNumber('3')} />
          <Button text="+" onClick={() => handleOperator('+')} variant="operator" />

          <Button text={<RotateCcw size={20} />} onClick={clear} variant="default" className="text-gray-400" />
          <Button text="0" onClick={() => handleNumber('0')} />
          <Button text="." onClick={() => handleNumber('.')} />
          <Button text="=" onClick={calculate} variant="equal" />
        </div>

        {/* History Overlay */}
        {showHistory && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 p-6 flex flex-col animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">History</h3>
              <button 
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-900 p-2"
              >
                <Delete size={20} className="rotate-45" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {history.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">No history yet</div>
              ) : (
                history.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg text-right font-mono text-sm border border-gray-100">
                    {item}
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={() => setHistory([])} 
              className="mt-4 w-full py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium text-sm"
            >
              Clear History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}